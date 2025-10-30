// home/ubuntu/impaktrweb/src/app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus } from '@/types/enums';

const sessionSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  breakMin: z.number().int().min(0).optional(),
  label: z.string().optional()
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  timezone: z.string().optional(),
  sessions: z.array(sessionSchema).min(1).optional(),
  // legacy optional fields
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
            type: true
          }
        },
        sessions: true,
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
    let userId: string | undefined;
    try {
      const session = await getSession();
      userId = session?.user?.id;
    } catch (error) {
      // Session error - user not logged in or invalid token
      userId = undefined;
    }

    // Check if user has bookmarked this event
    let isBookmarked = false;
    if (userId) {
      try {
        const bookmark = await prisma.eventBookmark.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: id
            }
          }
        });
        isBookmarked = !!bookmark;
      } catch (error) {
        // Bookmark query failed - default to false
        isBookmarked = false;
      }
    }

    // Transform event to include bookmark status and current participants
    const eventWithBookmark = {
      ...event,
      isBookmarked,
      currentParticipants: event._count.participations
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
    const parsed = updateEventSchema.parse(body);

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

    // Load current event and sessions
    const current = await prisma.event.findUnique({ where: { id }, include: { sessions: true } });
    if (!current) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Determine target sessions
    const useSessions = parsed.sessions && parsed.sessions.length
      ? parsed.sessions
      : current.sessions.length
        ? current.sessions.map((s: { startAt: Date; endAt: Date; breakMin: number | null; label: string | null }) => ({ startAt: s.startAt.toISOString(), endAt: s.endAt.toISOString(), breakMin: s.breakMin ?? 0, label: s.label || undefined }))
        : (parsed.startDate && parsed.endDate)
          ? [{ startAt: parsed.startDate, endAt: parsed.endDate, breakMin: 0, label: 'Day 1' }]
          : [];
    if (!useSessions.length) return NextResponse.json({ error: 'At least one session is required' }, { status: 400 });
    if (!useSessions.every((s: { startAt: string; endAt: string; breakMin?: number; label?: string }) => new Date(s.endAt) > new Date(s.startAt))) {
      return NextResponse.json({ error: 'Each session endAt must be after startAt' }, { status: 400 });
    }

    const startDate = new Date(Math.min(...useSessions.map((s: { startAt: string }) => new Date(s.startAt).getTime())));
    const endDate = new Date(Math.max(...useSessions.map((s: { endAt: string }) => new Date(s.endAt).getTime())));
    const totalHours = useSessions.reduce((sum: number, s: { startAt: string; endAt: string; breakMin?: number }) => {
      const ms = new Date(s.endAt).getTime() - new Date(s.startAt).getTime();
      const hours = Math.max(0, ms / 36e5 - (s.breakMin ?? 0) / 60);
      return sum + hours;
    }, 0);

    // Apply updates without transaction for simpler typing
    await prisma.eventSession.deleteMany({ where: { eventId: id } });
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: parsed.title ?? current.title,
        description: parsed.description ?? current.description,
        startDate,
        endDate,
        totalHours,
        timezone: parsed.timezone ?? current.timezone,
        location: parsed.location?.city ?? current.location,
        maxParticipants: parsed.maxParticipants ?? current.maxParticipants,
        status: parsed.status ?? current.status,
        sdg: parsed.sdgTags?.[0]?.toString() ?? current.sdg,
        sessions: {
          create: useSessions.map((s: { startAt: string; endAt: string; breakMin?: number; label?: string }) => ({
            startAt: new Date(s.startAt),
            endAt: new Date(s.endAt),
            breakMin: s.breakMin ?? 0,
            label: s.label || null
          }))
        }
      },
      include: {
        organization: true,
        sessions: true,
        _count: { select: { participations: true } }
      }
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