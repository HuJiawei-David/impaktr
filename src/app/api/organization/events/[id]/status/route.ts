// ome/ubuntu/impaktrweb/src/app/api/organization/events/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus } from '@/types/events';
import { OrganizationMember, Participation } from '@prisma/client';

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
            impactScore: {
              increment: scoreIncrease
            }
          }
        });

        // Score history tracking removed - model doesn't exist
      }

      // Check and award badges for participants
      for (const participation of verifiedParticipations) {
        await checkAndAwardBadges(participation.userId);
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
function calculateScoreIncrease(participation: Participation): number {
  const baseScore = (participation.hours || 0) * 10;
  const intensityMultiplier = 1.0; // event relation not available in Participation model
  const skillMultiplier = 1.0; // skillMultiplier field not available in Participation model
  const qualityMultiplier = 1.0; // qualityRating field not available in Participation model
  
  return Math.round(baseScore * intensityMultiplier * skillMultiplier * qualityMultiplier);
}

async function checkAndAwardBadges(userId: string): Promise<void> {
  // Implement your badge checking logic here
  // This should check user's total hours per SDG and award appropriate badges
}

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