// home/ubuntu/impaktrweb/src/app/api/organization/members/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function DELETE(
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
      where: { email: session.user.email },
      include: { profile: true }
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
            owner: {
              include: { profile: true }
            }
          }
        },
        user: {
          include: { profile: true }
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Check permissions - owner can remove anyone except themselves, members can leave themselves
    const isOwner = membership.organization.ownerId === user.id;
    const isSelfLeaving = membership.userId === user.id;
    const isTargetOwner = membership.organization.ownerId === membership.userId;

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
        creatorId: membership.userId,
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
    const memberName = membership.user.profile?.displayName || 
                      `${membership.user.profile?.firstName} ${membership.user.profile?.lastName}`.trim() ||
                      membership.user.email;

    const organizationName = membership.organization.name;

    // Remove the membership
    await prisma.organizationMember.delete({
      where: { id: membershipId }
    });

    // Log the removal activity
    const activityType = isSelfLeaving ? 'MEMBER_LEFT' : 'MEMBER_REMOVED';
    const activityDescription = isSelfLeaving 
      ? `${memberName} left the organization`
      : `${memberName} was removed from the organization`;

    await prisma.organizationActivity.create({
      data: {
        organizationId: membership.organizationId,
        type: activityType,
        description: activityDescription,
        metadata: {
          memberId: membership.userId,
          memberName,
          memberRole: membership.role,
          removedBy: user.id,
          isSelfLeaving
        },
        performedBy: user.id
      }
    });

    // Send notification emails
    try {
      if (isSelfLeaving) {
        // Notify organization owner that member left
        if (membership.organization.owner.email && membership.organization.owner.email !== user.email) {
          await sendEmail({
            to: membership.organization.owner.email,
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

    // Get the membership record with detailed information
    const membership = await prisma.organizationMember.findUnique({
      where: { id: membershipId },
      include: {
        organization: {
          include: {
            owner: {
              include: { profile: true }
            }
          }
        },
        user: {
          include: { 
            profile: true,
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
                    sdgTags: true
                  }
                }
              }
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

    // Check permissions
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

    // Calculate organization-specific stats
    const orgParticipations = membership.user.participations.filter(p => 
      p.event.organizationId === membership.organizationId);
    
    const orgHours = orgParticipations.reduce((sum, p) => 
      sum + (p.hoursActual || p.hoursCommitted), 0);
    
    const totalHours = membership.user.participations.reduce((sum, p) => 
      sum + (p.hoursActual || p.hoursCommitted), 0);

    // Get unique SDGs contributed to within this organization
    const orgSDGs = new Set(
      orgParticipations.flatMap(p => p.event.sdgTags)
    );

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
          joinedDate: membership.user.createdAt,
          lastActiveAt: membership.user.lastActiveAt
        },
        stats: {
          organizationHours: orgHours,
          organizationEvents: orgParticipations.length,
          organizationSDGs: orgSDGs.size,
          totalHours,
          totalEvents: membership.user.participations.length,
          badgesEarned: membership.user.badges.length,
          contributionPercentage: totalHours > 0 ? Math.round((orgHours / totalHours) * 100) : 0
        },
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          owner: {
            id: membership.organization.owner.id,
            name: membership.organization.owner.profile?.displayName || membership.organization.owner.email
          }
        },
        permissions: {
          canEdit: isOwner,
          canDelete: isOwner && membership.userId !== membership.organization.ownerId,
          canLeave: isMemberSelf && membership.userId !== membership.organization.ownerId,
          canViewDetails: true
        },
        recentActivity: orgParticipations.slice(-5).map(p => ({
          id: p.id,
          eventTitle: p.event.title,
          eventDate: p.event.startDate,
          hours: p.hoursActual || p.hoursCommitted,
          sdgTags: p.event.sdgTags
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