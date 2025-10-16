// home/ubuntu/impaktrweb/src/app/api/organization/members/[id]/role/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { OrganizationMember, Participation, User, Event } from '@prisma/client';

// Extended types for relations
type UserWithParticipations = User & {
  participations: (Participation & {
    event: Event;
  })[];
  badges: {
    badge: {
      id: string;
      name: string;
    };
  }[];
};

type MembershipWithUser = OrganizationMember & {
  user: UserWithParticipations;
};

const updateRoleSchema = z.object({
  role: z.enum(['member', 'admin']),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);
    
    const { id } = await params;
    const membershipId = id;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the membership record
    const membership = await prisma.organizationMember.findUnique({
      where: { id: membershipId },
      include: {
        organization: true,
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
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Check permissions - only organization admins can change roles
    const userMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: membership.organizationId,
          userId: user.id
        }
      }
    });
    
    if (!userMembership || (userMembership.role !== 'admin' && userMembership.role !== 'owner')) {
      return NextResponse.json({ 
        error: 'Only organization admins can change member roles' 
      }, { status: 403 });
    }

    // Cannot change admin's role to non-admin
    if (membership.role === 'admin' && role !== 'admin') {
      return NextResponse.json({ 
        error: 'Cannot demote organization admin' 
      }, { status: 400 });
    }

    // Update the member's role
    const updatedMembership = await prisma.organizationMember.update({
      where: { id: membershipId },
      data: { 
        role,
        updatedAt: new Date()
      },
      include: {
        user: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log the role change
    await prisma.organizationActivity.create({
      data: {
        organizationId: membership.organizationId,
        description: `${(membership as MembershipWithUser).user?.name || (membership as MembershipWithUser).user?.email}'s role changed to ${role}`,
        activityType: 'MEMBER_ROLE_CHANGED',
        title: 'Member Role Changed',
        impactPoints: 0,
        participantCount: 1
      }
    });

    // TODO: Send notification email to the member about role change
    // await sendRoleChangeNotification(membership.user.email, organization.name, role);

    return NextResponse.json({
      member: {
        id: updatedMembership.id,
        userId: updatedMembership.userId,
        role: updatedMembership.role,
        joinedAt: updatedMembership.joinedAt,
        updatedAt: updatedMembership.updatedAt,
        user: {
          id: updatedMembership.user.id,
          name: updatedMembership.user.name || updatedMembership.user.email,
          email: updatedMembership.user.email,
          avatar: updatedMembership.user.image,
          impaktrScore: updatedMembership.user.impactScore,
          currentRank: updatedMembership.user.tier,
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const membershipId = id;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the membership record
    const membership = await prisma.organizationMember.findUnique({
      where: { id: membershipId },
      include: {
        organization: true,
        user: {
          include: { 
            participations: {
              where: { status: 'VERIFIED' },
              include: { event: true }
            },
            badges: {
              include: { badge: true },
              // where: { earnedAt: { not: null } } // earnedAt field doesn't exist in UserBadge model
            }
          }
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Check if user has permission to view this membership
    const isMemberSelf = membership.userId === user.id;
    const userMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: membership.organizationId,
          userId: user.id,
        }
      }
    });
    const isAdmin = userMembership?.role === 'admin';
    const isOwner = userMembership?.role === 'owner';

    if (!isOwner && !isAdmin && !isMemberSelf) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Calculate member stats
    const membershipWithUser = membership as MembershipWithUser;
    const totalHours = membershipWithUser.user?.participations?.reduce((sum: number, p: Participation) => 
      sum + (p.hours || 0), 0);
    
    const orgEvents = membershipWithUser.user?.participations?.filter((p: Participation & { event: Event }) => 
      p.event.organizationId === membership.organizationId);
    
    const orgHours = orgEvents?.reduce((sum: number, p: Participation) => 
      sum + (p.hours || 0), 0) || 0;

    return NextResponse.json({
      member: {
        id: membership.id,
        userId: membership.userId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: {
          id: membership.user.id,
          name: (membership as MembershipWithUser).user?.name || (membership as MembershipWithUser).user?.email,
          email: (membership as MembershipWithUser).user?.email,
          avatar: (membership as MembershipWithUser).user?.image,
          impactScore: (membership as MembershipWithUser).user?.impactScore || 0,
          tier: (membership as MembershipWithUser).user?.tier || 'BRONZE',
          location: (membership as MembershipWithUser).user?.location,
          occupation: (membership as MembershipWithUser).user?.bio,
          bio: (membership as MembershipWithUser).user?.bio,
          stats: {
            totalHours,
            organizationHours: orgHours,
            organizationEvents: orgEvents.length,
            totalEvents: (membership as MembershipWithUser).user?.participations?.length || 0,
            badgesEarned: (membership as MembershipWithUser).user?.badges?.length || 0,
            lastActive: (membership as MembershipWithUser).user?.updatedAt
          }
        },
        organization: {
          id: membership.organization.id,
          name: membership.organization.name
        },
        permissions: {
          canEdit: isOwner,
          canDelete: isOwner && membership.userId !== user.id,
          canViewDetails: true
        }
      }
    });

  } catch (error) {
    console.error('Error fetching member details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}