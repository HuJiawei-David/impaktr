// ome/ubuntu/impaktrweb/src/app/api/organization/events/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus } from '@prisma/client';

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
        memberships: {
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
        creator: true,
        participations: {
          include: {
            user: {
              include: {
                profile: true
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
    const isCreator = event.creatorId === user.id;
    const isOrgAdmin = event.organization?.members.some(
      member => member.userId === user.id && ['admin', 'owner'].includes(member.role)
    );

    if (!isCreator && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update event status' },
        { status: 403 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<EventStatus, EventStatus[]> = {
      [EventStatus.DRAFT]: [EventStatus.ACTIVE, EventStatus.CANCELLED],
      [EventStatus.ACTIVE]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
      [EventStatus.COMPLETED]: [], // Cannot change from completed
      [EventStatus.CANCELLED]: [EventStatus.ACTIVE] // Can reactivate if needed
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
        updatedAt: new Date(),
      },
      include: {
        organization: true,
        creator: {
          include: {
            profile: true
          }
        },
        participations: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    });

    // Handle status-specific actions
    if (status === EventStatus.COMPLETED) {
      // Auto-verify pending participations when event is marked complete
      await prisma.participation.updateMany({
        where: {
          eventId: id,
          status: 'PENDING'
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

      for (const participation of verifiedParticipations) {
        // Calculate new impact score (you'd implement this based on your scoring algorithm)
        const scoreIncrease = calculateScoreIncrease(participation);
        
        await prisma.user.update({
          where: { id: participation.userId },
          data: {
            impaktrScore: {
              increment: scoreIncrease
            }
          }
        });

        await prisma.scoreHistory.create({
          data: {
            userId: participation.userId,
            oldScore: participation.user.impaktrScore,
            newScore: participation.user.impaktrScore + scoreIncrease,
            change: scoreIncrease,
            reason: 'event_completed',
            hoursComponent: participation.hoursActual || participation.hoursCommitted,
            intensityComponent: participation.event.intensity,
            skillComponent: participation.skillMultiplier,
            qualityComponent: participation.qualityRating || 1.0,
            verificationComponent: 1.0,
            locationComponent: 1.0,
            eventId: id,
            participationId: participation.id,
          }
        });
      }

      // Check and award badges for participants
      for (const participation of verifiedParticipations) {
        await checkAndAwardBadges(participation.userId);
      }
    }

    // Send notifications to participants if requested
    if (notifyParticipants && event.participations.length > 0) {
      const notificationData = {
        eventId: event.id,
        eventTitle: event.title,
        status,
        reason,
        completionNotes,
        organizationName: event.organization?.name || 'Organization'
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

    const { id } = await params;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

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
        creator: true,
        participations: {
          include: {
            user: {
              include: {
                profile: true
              }
            },
            verifications: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions
    const isCreator = event.creatorId === user.id;
    const isOrgAdmin = event.organization?.members.some(
      member => member.userId === user.id && ['admin', 'owner'].includes(member.role)
    );

    if (!isCreator && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get status statistics
    const statusStats = {
      totalParticipants: event.participations.length,
      verifiedParticipants: event.participations.filter(p => p.status === 'VERIFIED').length,
      pendingParticipants: event.participations.filter(p => p.status === 'PENDING').length,
      rejectedParticipants: event.participations.filter(p => p.status === 'REJECTED').length,
      totalHours: event.participations.reduce((sum, p) => sum + (p.hoursActual || p.hoursCommitted), 0),
      averageRating: event.participations
        .filter(p => p.qualityRating)
        .reduce((sum, p, _, arr) => sum + (p.qualityRating || 0) / arr.length, 0)
    };

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
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
function calculateScoreIncrease(participation: any): number {
  const baseScore = (participation.hoursActual || participation.hoursCommitted) * 10;
  const intensityMultiplier = participation.event.intensity || 1.0;
  const skillMultiplier = participation.skillMultiplier || 1.0;
  const qualityMultiplier = participation.qualityRating || 1.0;
  
  return Math.round(baseScore * intensityMultiplier * skillMultiplier * qualityMultiplier);
}

async function checkAndAwardBadges(userId: string): Promise<void> {
  // Implement your badge checking logic here
  // This should check user's total hours per SDG and award appropriate badges
}

async function queueParticipantNotifications(participations: any[], notificationData: any): Promise<void> {
  // Implement your notification queuing system here
  // This could use a job queue like Bull or send emails directly
  for (const participation of participations) {
    // Queue notification for each participant
    console.log(`Queuing notification for participant ${participation.user.email}`, notificationData);
  }
}

function getAvailableTransitions(currentStatus: EventStatus): EventStatus[] {
  const transitions: Record<EventStatus, EventStatus[]> = {
    [EventStatus.DRAFT]: [EventStatus.ACTIVE, EventStatus.CANCELLED],
    [EventStatus.ACTIVE]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
    [EventStatus.COMPLETED]: [],
    [EventStatus.CANCELLED]: [EventStatus.ACTIVE]
  };

  return transitions[currentStatus] || [];
}