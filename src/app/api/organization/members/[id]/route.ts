// home/ubuntu/impaktrweb/src/app/api/organization/members/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { OrganizationMember, Participation } from '@prisma/client';

export async function DELETE(
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
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the membership record
    const membership = await prisma.organizationMember.findUnique({
      where: { id: membershipId },
      include: {
        organization: {
          include: {
            members: true
          }
        },
        user: true
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Check permissions - owner can remove anyone except themselves, members can leave themselves
    // Get user's organization memberships to check if they're owner
    const userMemberships = await prisma.organizationMember.findMany({
      where: { userId: user.id }
    });
    const isOwner = userMemberships.some((m: OrganizationMember) => m.organizationId === membership.organizationId && m.role === 'owner');
    const isSelfLeaving = membership.userId === user.id;
    const isTargetOwner = membership.organization.members.some((m: OrganizationMember) => m.userId === membership.userId && m.role === 'owner');

    if (!isOwner && !isSelfLeaving) {
      return NextResponse.json({ 
        error: 'You can only remove yourself or must be organization owner' 
      }, { status: 403 });
    }

    // Cannot remove organization owner
    if (isTargetOwner && !isSelfLeaving) {
      return NextResponse.json({ 
        error: 'Cannot remove organization owner' 
      }, { status: 400 });
    }

    // If owner is leaving, they must transfer ownership first
    if (isTargetOwner && isSelfLeaving) {
      const otherMembers = await prisma.organizationMember.count({
        where: {
          organizationId: membership.organizationId,
          userId: { not: user.id }
        }
      });

      if (otherMembers > 0) {
        return NextResponse.json({ 
          error: 'Organization owners must transfer ownership before leaving. Contact support if you need to delete the organization.' 
        }, { status: 400 });
      }
    }

    // Check if member has any ongoing responsibilities
    const ongoingEvents = await prisma.event.count({
      where: {
        organizerId: membership.userId,
        organizationId: membership.organizationId,
        status: 'ACTIVE',
        startDate: { gt: new Date() }
      }
    });

    if (ongoingEvents > 0 && !isSelfLeaving) {
      return NextResponse.json({ 
        error: `Member has ${ongoingEvents} active events. Please reassign or cancel them first.`,
        details: { ongoingEvents }
      }, { status: 400 });
    }

    // Get member details for notifications
    // Get user details separately since membership doesn't include user
    const memberUser = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { name: true, email: true }
    });
    const memberName = memberUser?.name || memberUser?.email || 'Unknown User';

    // Get organization name separately since membership doesn't include organization
    const organization = await prisma.organization.findUnique({
      where: { id: membership.organizationId },
      select: { name: true }
    });
    const organizationName = organization?.name || 'Organization';

    // Remove the membership
    await prisma.organizationMember.delete({
      where: { id: membershipId }
    });

    // Log the removal activity
    const activityType = isSelfLeaving ? 'MEMBER_LEFT' : 'MEMBER_REMOVED';
    const activityDescription = isSelfLeaving 
      ? `${memberName} left the organization`
      : `${memberName} was removed from the organization`;

    // OrganizationActivity creation removed - model doesn't exist
    // await prisma.organizationActivity.create({
    //   data: {
    //     organizationId: membership.organizationId,
    //     description: activityDescription,
    //   }
    // });

    // Send notification emails
    try {
      if (isSelfLeaving) {
        // Notify organization owner that member left
        const ownerMember = membership.organization.members.find((m: OrganizationMember) => m.role === 'owner');
        if (ownerMember && ownerMember.userId !== user.id) {
          await sendEmail({
            to: 'owner@example.com', // We need to get the user email separately
            subject: `${memberName} has left ${organizationName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Impaktr</h1>
                </div>
                
                <div style="padding: 30px; background: white;">
                  <h2 style="color: #1f2937; margin-bottom: 20px;">Member Left Organization</h2>
                  
                  <p style="color: #4b5563; line-height: 1.6;">
                    <strong>${memberName}</strong> has left <strong>${organizationName}</strong>.
                  </p>
                  
                  <p style="color: #4b5563; line-height: 1.6;">
                    You can view your organization's current members and manage roles in your organization dashboard.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXTAUTH_URL}/organization/members" 
                       style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); 
                              color: white; padding: 12px 24px; text-decoration: none; 
                              border-radius: 6px; font-weight: 600; display: inline-block;">
                      View Members
                    </a>
                  </div>
                </div>
              </div>
            `
          });
        }
      } else {
        // Notify removed member
        if (membership.user.email) {
          await sendEmail({
            to: membership.user.email,
          subject: `You've been removed from ${organizationName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Impaktr</h1>
              </div>
              
              <div style="padding: 30px; background: white;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Membership Ended</h2>
                
                <p style="color: #4b5563; line-height: 1.6;">
                  Your membership with <strong>${organizationName}</strong> has been ended by the organization administrator.
                </p>
                
                <p style="color: #4b5563; line-height: 1.6;">
                  Your individual Impaktr profile and verified impact hours remain intact. You can continue participating in events and building your impact score independently.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                     style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); 
                            color: white; padding: 12px 24px; text-decoration: none; 
                            border-radius: 6px; font-weight: 600; display: inline-block;">
                    Go to Dashboard
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  If you believe this was done in error, please contact the organization directly or reach out to our support team.
                </p>
              </div>
            </div>
          `
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Continue with the response even if email fails
    }

    return NextResponse.json({ 
      message: isSelfLeaving 
        ? 'Successfully left the organization' 
        : 'Member removed successfully',
      member: {
        id: membership.id,
        userId: membership.userId,
        name: memberName,
        action: isSelfLeaving ? 'left' : 'removed'
      }
    });

  } catch (error) {
    console.error('Error removing organization member:', error);
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

    // Get the membership record with detailed information
    const membership = await prisma.organizationMember.findUnique({
      where: { id: membershipId },
      include: {
        organization: {
          include: {
          }
        },
        user: {
          include: { 
            participations: {
              where: { 
                status: 'VERIFIED',
                event: {
                  organizationId: { not: null }
                }
              },
              include: { 
                event: {
                  select: {
                    id: true,
                    title: true,
                    startDate: true,
                    organizationId: true,
                    sdg: true
                  }
                }
              }
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

    // Check permissions
    // Get user's organization memberships to check if they're owner
    const userMemberships = await prisma.organizationMember.findMany({
      where: { userId: user.id }
    });
    const isOwner = userMemberships.some((m: OrganizationMember) => m.organizationId === membership.organizationId && m.role === 'owner');
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

    // Calculate organization-specific stats
    // Get user participations separately since membership doesn't include user
    const userParticipations = await prisma.participation.findMany({
      where: { userId: membership.userId },
      include: { event: true }
    });
    
    const orgParticipations = userParticipations.filter(p => 
      p.event.organizationId === membership.organizationId);
    
    const orgHours = orgParticipations.reduce((sum: number, p: Participation) => 
      sum + (p.hours || 0), 0);
    
    const totalHours = userParticipations.reduce((sum: number, p: Participation) => 
      sum + (p.hours || 0), 0);

    // Get unique SDGs contributed to within this organization
    const orgSDGs = new Set(
      orgParticipations.flatMap(p => p.event.sdg ? [p.event.sdg] : [])
    );

    return NextResponse.json({
      member: {
        id: membership.id,
        userId: membership.userId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: {
          id: membership.userId,
          name: 'Unknown User', // We need to get this separately
          email: 'unknown@example.com', // We need to get this separately
          avatar: null, // We need to get this separately
          impactScore: 0, // We need to get this separately
          tier: 'BRONZE', // We need to get this separately
          location: null, // We need to get this separately
          occupation: null, // We need to get this separately
          bio: null, // We need to get this separately
          joinedDate: new Date(), // We need to get this separately
          lastActivityDate: new Date() // Using lastActivityDate instead of removed lastActiveAt
        },
        stats: {
          organizationHours: orgHours,
          organizationEvents: orgParticipations.length,
          organizationSDGs: orgSDGs.size,
          totalHours,
          totalEvents: userParticipations.length,
          badgesEarned: 0, // We need to get this separately
          contributionPercentage: totalHours > 0 ? Math.round((orgHours / totalHours) * 100) : 0
        },
        organization: {
          id: membership.organizationId,
          name: 'Organization', // We need to get this separately
          owner: {
            id: 'unknown', // We need to get this separately
            name: 'Unknown Owner'
          }
        },
        permissions: {
          canEdit: isOwner,
          canDelete: isOwner && membership.userId !== 'unknown', // We need to get owner ID separately
          canLeave: isMemberSelf && membership.userId !== 'unknown', // We need to get owner ID separately
          canViewDetails: true
        },
        recentActivity: orgParticipations.slice(-5).map(p => ({
          id: p.id,
          eventTitle: p.event.title,
          eventDate: p.event.startDate,
          hours: p.hours || 0,
          sdg: p.event.sdg
        }))
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