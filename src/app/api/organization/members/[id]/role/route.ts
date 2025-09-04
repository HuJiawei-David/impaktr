// home/ubuntu/impaktrweb/src/app/api/organization/members/[id]/role/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['member', 'admin']),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);
    const membershipId = params.id;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedOrganizations: true
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
          include: { profile: true }
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Check permissions - only organization owner can change roles
    const isOwner = membership.organization.ownerId === user.id;
    
    if (!isOwner) {
      return NextResponse.json({ 
        error: 'Only organization owners can change member roles' 
      }, { status: 403 });
    }

    // Cannot change owner's role
    if (membership.organization.ownerId === membership.userId) {
      return NextResponse.json({ 
        error: 'Cannot change organization owner role' 
      }, { status: 400 });
    }

    // Update the member's role
    const updatedMembership = await prisma.organizationMember.update({
      where: { id: membershipId },
      data: { 
        role
      },
      include: {
        user: {
          include: { profile: true }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // TODO: Log the role change when activity model is implemented
    // await prisma.organizationActivity.create({
    //   data: {
    //     organizationId: membership.organizationId,
    //     type: 'MEMBER_ROLE_CHANGED',
    //     description: `${membership.user.profile?.displayName || membership.user.email}'s role changed to ${role}`,
    //     metadata: {
    //       memberId: membership.userId,
    //       oldRole: membership.role,
    //       newRole: role,
    //       changedBy: user.id
    //     },
    //     performedBy: user.id
    //   }
    // });

    // TODO: Send notification email to the member about role change
    // await sendRoleChangeNotification(membership.user.email, organization.name, role);

    return NextResponse.json({
      member: {
        id: updatedMembership.id,
        userId: updatedMembership.userId,
        role: updatedMembership.role,
        joinedAt: updatedMembership.joinedAt,
        user: {
          id: updatedMembership.user.id,
          name: updatedMembership.user.profile?.displayName || 
                `${updatedMembership.user.profile?.firstName} ${updatedMembership.user.profile?.lastName}`.trim() ||
                updatedMembership.user.name ||
                'Unknown User',
          email: updatedMembership.user.email,
          avatar: updatedMembership.user.profile?.avatar,
          impaktrScore: updatedMembership.user.impaktrScore,
          currentRank: updatedMembership.user.currentRank,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membershipId = params.id;

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
            profile: true,
            participations: {
              where: { status: 'VERIFIED' },
              include: { event: true }
            },
            badges: {
              include: { badge: true },
              where: { earnedAt: { not: null } }
            }
          }
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Check if user has permission to view this membership
    const isOwner = membership.organization.ownerId === user.id;
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

    if (!isOwner && !isAdmin && !isMemberSelf) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Calculate member stats
    const totalHours = membership.user.participations.reduce((sum, p) => 
      sum + (p.hoursActual || p.hoursCommitted), 0);
    
    const orgEvents = membership.user.participations.filter(p => 
      p.event.organizationId === membership.organizationId);
    
    const orgHours = orgEvents.reduce((sum, p) => 
      sum + (p.hoursActual || p.hoursCommitted), 0);

    return NextResponse.json({
      member: {
        id: membership.id,
        userId: membership.userId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: {
          id: membership.user.id,
          name: membership.user.profile?.displayName || 
                `${membership.user.profile?.firstName} ${membership.user.profile?.lastName}`.trim(),
          email: membership.user.email,
          avatar: membership.user.profile?.avatar,
          impaktrScore: membership.user.impaktrScore,
          currentRank: membership.user.currentRank,
          location: membership.user.profile?.location,
          occupation: membership.user.profile?.occupation,
          bio: membership.user.profile?.bio,
          stats: {
            totalHours,
            organizationHours: orgHours,
            organizationEvents: orgEvents.length,
            totalEvents: membership.user.participations.length,
            badgesEarned: membership.user.badges.length,
            lastActive: membership.user.lastActiveAt
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