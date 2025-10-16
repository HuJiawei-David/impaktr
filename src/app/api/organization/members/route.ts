// home/ubuntu/impaktrweb/src/app/api/organization/members/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { OrganizationMember } from '@prisma/client';

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'admin']).default('member'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get organization ID from query params or find user's main organization
    const url = new URL(request.url);
    let organizationId = url.searchParams.get('organizationId');
    
    if (!organizationId) {
      // Use first owned organization or first membership
      const ownedMembership = user.organizationMemberships.find(membership => membership.role === 'owner');
      const organization = ownedMembership ? { id: ownedMembership.organizationId } : user.organizationMemberships[0]?.organization;
      if (!organization) {
        return NextResponse.json({ error: 'No organization found' }, { status: 404 });
      }
      organizationId = organization.id;
    }

    // Check if user has permission to view members
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        }
      }
    });

      const isOwner = user.organizationMemberships.some((org: OrganizationMember) => org.organizationId === organizationId && org.role === 'owner');
    const isAdmin = membership?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get organization members
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          include: {
            participations: {
              where: { status: 'VERIFIED' },
              include: { event: true }
            },
            badges: {
              include: { badge: true }
            }
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // owners/admins first
        { joinedAt: 'asc' }
      ]
    });

    // Format response data
    const formattedMembers = members.map(member => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        id: member.user.id,
        name: member.user.name || member.user.email,
        email: member.user.email,
        avatar: member.user.image,
        impactScore: member.user.impactScore,
        tier: member.user.tier,
        location: member.user.location,
        occupation: member.user.bio,
        stats: {
          totalHours: member.user.participations.reduce((sum, p) => 
            sum + (p.hours || 0), 0),
          eventsParticipated: member.user.participations.length,
          badgesEarned: member.user.badges.filter(b => b.earnedAt).length,
          lastActive: member.user.updatedAt
        }
      }
    }));

    return NextResponse.json({ 
      members: formattedMembers,
      organization: members[0]?.organization || null,
      totalMembers: members.length
    });

  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = addMemberSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get organization ID from request body or query
    const organizationId = body.organizationId || new URL(request.url).searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Check if user has permission to add members
      const isOwner = user.organizationMemberships.some((org: OrganizationMember) => org.organizationId === organizationId && org.role === 'owner');
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        }
      }
    });
    const isAdmin = membership?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUser.id,
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Add user to organization
    const newMembership = await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: targetUser.id,
        role,
        joinedAt: new Date()
      },
      include: {
        user: {
          include: {
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // TODO: Send invitation email to user
    // await sendMemberInvitationEmail(targetUser.email, organization.name, inviterName);

    return NextResponse.json({ 
      member: {
        id: newMembership.id,
        userId: newMembership.userId,
        role: newMembership.role,
        joinedAt: newMembership.joinedAt,
        user: {
          id: newMembership.user.id,
          name: newMembership.user.name || newMembership.user.email,
          email: newMembership.user.email,
          avatar: newMembership.user.image,
          impactScore: newMembership.user.impactScore,
          tier: newMembership.user.tier,
        }
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding organization member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}