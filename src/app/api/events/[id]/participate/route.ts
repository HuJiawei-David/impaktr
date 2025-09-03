// home/ubuntu/impaktrweb/src/app/api/events/[id]/participate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ParticipationStatus } from '@prisma/client';

const participateSchema = z.object({
  hoursCommitted: z.number().positive(),
  notes: z.string().optional(),
});

const updateParticipationSchema = z.object({
  hoursActual: z.number().positive().optional(),
  notes: z.string().optional(),
  proofImages: z.array(z.string()).optional(),
  qualityRating: z.number().min(0.5).max(1.5).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { hoursCommitted, notes } = participateSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Event is not active for participation' },
        { status: 400 }
      );
    }

    // Check if event has reached max participants
    if (event.maxParticipants) {
      const currentParticipants = await prisma.participation.count({
        where: { eventId: params.id }
      });

      if (currentParticipants >= event.maxParticipants) {
        return NextResponse.json(
          { error: 'Event has reached maximum participants' },
          { status: 400 }
        );
      }
    }

    // Check if user is already participating
    const existingParticipation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: params.id,
        }
      }
    });

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'User is already participating in this event' },
        { status: 400 }
      );
    }

    // Determine skill multiplier based on event skills and user skills
    // This would normally check against user's verified skills
    const skillMultiplier = 1.0; // Default for now

    const participation = await prisma.participation.create({
      data: {
        userId: user.id,
        eventId: params.id,
        hoursCommitted,
        notes,
        skillMultiplier,
        status: ParticipationStatus.PENDING,
      },
      include: {
        event: true,
        user: {
          include: {
            profile: true,
          }
        }
      }
    });

    // Update event current participants count
    await prisma.event.update({
      where: { id: params.id },
      data: {
        currentParticipants: {
          increment: 1,
        }
      }
    });

    return NextResponse.json({ participation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating participation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateParticipationSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: params.id,
        }
      },
      include: { event: true }
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    const updatedParticipation = await prisma.participation.update({
      where: { id: participation.id },
      data: validatedData,
      include: {
        event: true,
        user: {
          include: {
            profile: true,
          }
        },
        verifications: true,
      }
    });

    return NextResponse.json({ participation: updatedParticipation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating participation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: params.id,
        }
      }
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    if (participation.status === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Cannot cancel verified participation' },
        { status: 400 }
      );
    }

    await prisma.participation.delete({
      where: { id: participation.id },
    });

    // Update event current participants count
    await prisma.event.update({
      where: { id: params.id },
      data: {
        currentParticipants: {
          decrement: 1,
        }
      }
    });

    return NextResponse.json({ message: 'Participation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling participation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}