import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const rsvpSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']).default('CONFIRMED'),
  feedback: z.string().max(500).optional(),
  bringGuests: z.number().int().min(0).max(5).default(0),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const validatedData = rsvpSchema.parse(body);

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participations: {
          where: { status: { in: ['CONFIRMED'] } }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'UPCOMING') {
      return NextResponse.json({ error: 'Event is not accepting RSVPs' }, { status: 400 });
    }

    // Check if user already has a participation
    const existingParticipation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    });

    if (existingParticipation) {
      return NextResponse.json({ error: 'You have already RSVPed to this event' }, { status: 400 });
    }

    // Calculate total spots needed (user + guests)
    const totalSpotsNeeded = 1 + validatedData.bringGuests;
    const currentConfirmed = event.participations.filter(p => p.status === 'CONFIRMED').length;
    const availableSpots = event.maxParticipants ? event.maxParticipants - currentConfirmed : null;

    let participationStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' = validatedData.status;
    let waitlistPosition = null;

    // Determine if user goes to waitlist
    if (validatedData.status === 'CONFIRMED' && availableSpots !== null && totalSpotsNeeded > availableSpots) {
      participationStatus = 'PENDING';
      waitlistPosition = event.participations.filter(p => p.status === 'PENDING').length + 1;
    }

    // Create participation
    const participation = await prisma.participation.create({
      data: {
        userId: session.user.id,
        eventId: eventId,
        status: participationStatus,
        hours: null, // Will be set after event completion
        impactPoints: 0,
        joinedAt: new Date(),
        feedback: validatedData.feedback
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
              }
            }
          }
        }
      }
    });

    // Update event participant count
    await prisma.event.update({
      where: { id: eventId },
      data: {
        currentParticipants: participationStatus === 'CONFIRMED' ? 
          { increment: totalSpotsNeeded } : 
          { increment: 0 }
      }
    });

    // Notify event organizers
    const organizers = await prisma.organizationMember.findMany({
      where: {
        organizationId: event.organizationId || undefined,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      },
      include: { user: true }
    });

    await prisma.notification.createMany({
      data: organizers.map(org => ({
        userId: org.userId,
        type: 'EVENT_REMINDER',
        title: 'New RSVP',
        message: `${session.user.name} ${participationStatus === 'PENDING' ? 'joined the waitlist for' : 'RSVPed to'} "${event.title}"`,
        data: {
          eventId,
          participationId: participation.id,
          status: participationStatus,
        }
      }))
    });

    return NextResponse.json({ 
      participation,
      status: participationStatus,
      waitlistPosition,
      feedback: participationStatus === 'PENDING' ? 
        `You've been added to the waitlist at position ${waitlistPosition}` :
        'RSVP confirmed successfully'
    });
  } catch (error) {
    console.error('Error creating RSVP:', error);
    return NextResponse.json({ error: 'Failed to create RSVP' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const validatedData = rsvpSchema.parse(body);

    // Get existing participation
    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      },
      include: {
        event: true
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'RSVP not found' }, { status: 404 });
    }

    // Update participation
    const updatedParticipation = await prisma.participation.update({
      where: { id: participation.id },
      data: {
        status: validatedData.status,
        feedback: validatedData.feedback
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ participation: updatedParticipation });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Get existing participation
    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      },
      include: {
        event: true
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'RSVP not found' }, { status: 404 });
    }

    // Delete participation
    await prisma.participation.delete({
      where: { id: participation.id }
    });

    // Update event participant count
    if (participation.status === 'CONFIRMED') {
      const guestCount = 0; // Guest count not stored in current schema
      await prisma.event.update({
        where: { id: eventId },
        data: {
          currentParticipants: { decrement: 1 + guestCount }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting RSVP:', error);
    return NextResponse.json({ error: 'Failed to delete RSVP' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Get event with all participations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          orderBy: [
            { status: 'asc' }, // CONFIRMED first, then WAITLIST
            { joinedAt: 'asc' }
          ]
        },
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: { in: ['admin', 'owner'] },
                status: 'active'
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is organizer or participant
    const isOrganizer = event.organization?.members.some(member => member.userId === session.user.id) || false;
    const userParticipation = event.participations.find(p => p.userId === session.user.id);

    if (!isOrganizer && !userParticipation) {
      return NextResponse.json({ error: 'Unauthorized to view RSVPs' }, { status: 403 });
    }

    // Separate confirmed and waitlist participants
    const confirmedParticipants = event.participations.filter(p => p.status === 'CONFIRMED');
    const waitlistParticipants = event.participations.filter(p => p.status === 'PENDING');

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
      },
      confirmedParticipants,
      waitlistParticipants,
      userParticipation,
      isOrganizer,
    });
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 });
  }
}
