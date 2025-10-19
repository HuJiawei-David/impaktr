// home/ubuntu/impaktrweb/src/app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus } from '@/types/enums';

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional().nullable(),
  location: z.object({
    address: z.string().optional(),
    city: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    isVirtual: z.boolean().default(false),
  }).optional(),
  maxParticipants: z.number().positive().optional().nullable(),
  sdgTags: z.array(z.number().min(1).max(17)).optional(),
  skills: z.array(z.string()).optional(),
  intensity: z.number().min(0.8).max(1.2).optional(),
  status: z.nativeEnum(EventStatus).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: true,
        participations: {
          include: {
            user: true,
            // verifications field doesn't exist in Participation model
          },
        },
        _count: {
          select: {
            participations: {
              where: { status: 'VERIFIED' }
            }
          }
        }
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get session to check bookmark status
    const session = await getSession();
    const userId = session?.user?.id;

    // Check if user has bookmarked this event
    let isBookmarked = false;
    if (userId) {
      const bookmark = await prisma.eventBookmark.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId: id
          }
        }
      });
      isBookmarked = !!bookmark;
    }

    // Transform event to include bookmark status
    const eventWithBookmark = {
      ...event,
      isBookmarked
    };

    return NextResponse.json({ event: eventWithBookmark });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is the event creator or has organization permissions
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isCreator = event.organizerId === user.id;
    const hasOrgPermission = event.organization?.members.some(
      (member: { role: string }) => member.role === 'admin' || member.role === 'owner'
    );

    if (!isCreator && !hasOrgPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this event' },
        { status: 403 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate || validatedData.startDate,
        location: validatedData.location?.city || 'Virtual Event',
        maxParticipants: validatedData.maxParticipants,
        status: validatedData.status,
        // Other fields don't exist in Event model
      },
      include: {
        organization: true,
        _count: {
          select: {
            participations: {
              where: { status: 'VERIFIED' }
            }
          }
        }
      },
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is the event creator or has organization permissions
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isCreator = event.organizerId === user.id;
    const hasOrgPermission = event.organization?.members.some(
      (member: { role: string }) => member.role === 'admin' || member.role === 'owner'
    );

    if (!isCreator && !hasOrgPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this event' },
        { status: 403 }
      );
    }

    // Check if event has verified participations (prevent deletion if it does)
    const verifiedParticipations = await prisma.participation.count({
      where: {
        eventId: id,
        status: 'VERIFIED'
      }
    });

    if (verifiedParticipations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with verified participations' },
        { status: 400 }
      );
    }

    await prisma.event.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}