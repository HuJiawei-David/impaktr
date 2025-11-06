// ome/ubuntu/impaktrweb/src/app/api/organization/events/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus } from '@/types/enums';
import { OrganizationMember, Participation } from '@prisma/client';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';

// Types for notification data
interface NotificationData {
  type: string;
  title: string;
  message: string;
  eventId: string;
}

const updateStatusSchema = z.object({
  status: z.nativeEnum(EventStatus),
  reason: z.string().optional(),
  notifyParticipants: z.boolean().default(false),
  completionNotes: z.string().optional(),
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

    const { id } = await params;
    const body = await request.json();
    const { status, reason, notifyParticipants, completionNotes } = updateStatusSchema.parse(body);

    // Get user from database
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

    // Get event and verify organization ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        },
        participations: {
          include: {
            user: {
              include: {
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions - must be event creator or organization admin/owner
    const isCreator = event.organizerId === user.id;
    // Get user's organization memberships separately
    const userMemberships = await prisma.organizationMember.findMany({
      where: { userId: user.id }
    });
    const isOrgAdmin = event.organizationId && userMemberships.some(
      (membership: OrganizationMember) => membership.organizationId === event.organizationId && ['admin', 'owner'].includes(membership.role)
    );

    if (!isCreator && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update event status' },
        { status: 403 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['ACTIVE', 'CANCELLED'],
      'ACTIVE': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // Cannot change from completed
      'CANCELLED': ['ACTIVE'] // Can reactivate if needed
    };

    if (!validTransitions[event.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${event.status} to ${status}` },
        { status: 400 }
      );
    }

    // Update event status
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status,
        // When publishing/activating an event, ensure it becomes public
        ...(status === EventStatus.ACTIVE ? { isPublic: true } : {}),
      },
      include: {
        organization: true,
        participations: {
          include: {
            user: {
              include: {
              }
            }
          }
        }
      }
    });

    // Handle status-specific actions
    if (status === EventStatus.COMPLETED) {
      // Check if there are participants who haven't been granted approval yet
      // ATTENDED means they attended but haven't received grant approval
      // Only ATTENDED participants need approval - PENDING and CONFIRMED haven't checked in yet
      // We need all ATTENDED participants to be VERIFIED before truly completing the event
      const pendingApprovalParticipants = await prisma.participation.findMany({
        where: {
          eventId: id,
          status: 'ATTENDED'
        }
      });

      // If there are participants who haven't been granted approval, return a special response
      if (pendingApprovalParticipants.length > 0) {
        // Revert the status change - don't mark as completed yet
        await prisma.event.update({
          where: { id },
          data: {
            status: event.status, // Keep original status
          }
        });

        return NextResponse.json({
          requiresApproval: true,
          pendingParticipants: pendingApprovalParticipants.length,
          totalParticipants: event.participations.length,
          message: `Please grant approval to ${pendingApprovalParticipants.length} participant(s) before completing the event.`,
          pendingParticipantIds: pendingApprovalParticipants.map(p => p.id)
        }, { status: 200 }); // Return 200 but with requiresApproval flag
      }

      // All participants are VERIFIED, proceed with completion
      // Auto-verify any remaining pending and confirmed participations (shouldn't happen but safety check)
      await prisma.participation.updateMany({
        where: {
          eventId: id,
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date()
        }
      });

      // Create score history entries for all verified participants
      const verifiedParticipations = await prisma.participation.findMany({
        where: {
          eventId: id,
          status: 'VERIFIED'
        },
        include: {
          user: true,
          event: true
        }
      });

      // Process score updates for each participant with error handling
      for (const participation of verifiedParticipations) {
        try {
          // Calculate new impact score using the proper scoring algorithm
          const oldScore = participation.user.impactScore;
          const newScore = await calculateImpaktrScore(participation.userId);
          const scoreIncrease = newScore - oldScore;
          
          await prisma.user.update({
            where: { id: participation.userId },
            data: {
              impactScore: newScore
            }
          });

          // Create score history entry
          await prisma.scoreHistory.create({
            data: {
              userId: participation.userId,
              oldScore,
              newScore,
              change: scoreIncrease,
              reason: 'event_completion',
              hoursComponent: participation.hours || 0,
              intensityComponent: 1.0, // Will be calculated in the scoring function
              skillComponent: 1.0, // Will be calculated in the scoring function
              qualityComponent: 1.0, // Will be calculated in the scoring function
              verificationComponent: 1.0, // Will be calculated in the scoring function
              locationComponent: 1.0, // Will be calculated in the scoring function
              eventId: participation.eventId,
              participationId: participation.id,
            }
          });
        } catch (scoreError) {
          console.error(`Error updating score for participant ${participation.userId}:`, scoreError);
          // Continue with other participants even if one fails
        }
      }

      // Check and award badges for participants with error handling
      for (const participation of verifiedParticipations) {
        try {
          await checkAndAwardBadges(participation.userId);
        } catch (badgeError) {
          console.error(`Error awarding badges for participant ${participation.userId}:`, badgeError);
          // Continue with other participants even if one fails
        }
      }
    }

    // Send notifications to participants if requested
    if (notifyParticipants && event.participations.length > 0) {
      const notificationData: NotificationData = {
        type: 'event_status_update',
        title: 'Event Status Updated',
        message: `Event "${event.title}" status has been updated to ${status}`,
        eventId: event.id
      };

      // Queue email notifications (implement your notification service)
      await queueParticipantNotifications(event.participations, notificationData);
    }

    // Log the status change
    console.log(`Event ${event.id} status changed from ${event.status} to ${status} by user ${user.id}`);

    return NextResponse.json({
      event: updatedEvent,
      message: `Event status updated to ${status}`,
      participantsNotified: notifyParticipants ? event.participations.length : 0
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating event status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get event with status history
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        },
        participations: {
          include: {
            user: {
              include: {
              }
            },
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions
    const isCreator = event.organizerId === user.id;
    // Get user's organization memberships separately
    const userMemberships = await prisma.organizationMember.findMany({
      where: { userId: user.id }
    });
    const isOrgAdmin = event.organizationId && userMemberships.some(
      (membership: OrganizationMember) => membership.organizationId === event.organizationId && ['admin', 'owner'].includes(membership.role)
    );

    if (!isCreator && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get participations separately since event doesn't include them
    const participations = await prisma.participation.findMany({
      where: { eventId: id }
    });

    // Get status statistics
    const statusStats = {
      totalParticipants: participations.length,
      verifiedParticipants: participations.filter((p: Participation) => p.status === 'VERIFIED').length,
      pendingParticipants: participations.filter((p: Participation) => p.status === 'PENDING').length,
      rejectedParticipants: participations.filter((p: Participation) => p.status === 'CANCELLED').length,
      totalHours: participations.reduce((sum: number, p: Participation) => sum + (p.hours || 0), 0),
      averageRating: 0, // qualityRating field not available in Participation model
    };

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        createdAt: event.createdAt,
        updatedAt: new Date()
      },
      statusStats,
      canChangeStatus: true,
      availableTransitions: getAvailableTransitions(event.status)
    });

  } catch (error) {
    console.error('Error fetching event status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function queueParticipantNotifications(participations: Participation[], notificationData: NotificationData): Promise<void> {
  // Implement your notification queuing system here
  // This could use a job queue like Bull or send emails directly
  for (const participation of participations) {
    // Queue notification for each participant
    console.log(`Queuing notification for participant ${participation.userId}`, notificationData);
  }
}

function getAvailableTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    'DRAFT': ['ACTIVE', 'CANCELLED'],
    'ACTIVE': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],
    'CANCELLED': ['ACTIVE']
  };

  return transitions[currentStatus] || [];
}