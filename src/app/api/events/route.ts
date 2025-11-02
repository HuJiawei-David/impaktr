// home/ubuntu/impaktrweb/src/app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus } from '@/types/events';
import { Prisma } from '@prisma/client';

const sessionSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  breakMin: z.number().int().min(0).optional(),
  label: z.string().optional()
});

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  timezone: z.string().optional(),
  sessions: z.array(sessionSchema).min(1).optional(),
  // legacy fallback
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
  verificationType: z.string().default('ORGANIZER').optional(),
  organizationId: z.string().optional(),
  isPublic: z.boolean().optional(),
});

const querySchema = z.object({
  page: z.string().transform((str) => parseInt(str)).default('1'),
  limit: z.string().transform((str) => parseInt(str)).default('20'),
  search: z.string().optional(),
  sdg: z.string().transform((str) => parseInt(str)).optional(),
  location: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  organizationId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { page, limit, search, sdg, location, startDate, endDate, status, organizationId } = querySchema.parse(params);

    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      isPublic: true, // Only show public events
    };

    // Apply status filter if provided, otherwise show UPCOMING and ACTIVE events
    if (status) {
      where.status = status;
      // For UPCOMING status, also filter by date to exclude past events
      if (status === 'UPCOMING') {
        where.startDate = {
          gte: new Date() // Only events starting from now
        };
      }
    } else {
      where.status = { in: ['UPCOMING', 'ACTIVE'] };
      // Also filter by date to exclude past events
      where.startDate = {
        gte: new Date()
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (sdg) {
      where.sdg = sdg.toString(); // Use sdg field instead of non-existent sdgTags
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive' as const
      };
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Apply custom date filters if provided (override default date filters)
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = startDate;
      if (endDate) where.startDate.lte = endDate;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
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
      }),
      prisma.event.count({ where }),
    ]);

    // Get session to check bookmark status
    let userId: string | undefined;
    try {
      const session = await getSession();
      userId = session?.user?.id;
    } catch (error) {
      // Session error - user not logged in or invalid token
      userId = undefined;
    }

    // Get all bookmarks for this user if logged in
    let userBookmarks: string[] = [];
    if (userId) {
      try {
        const bookmarks = await prisma.eventBookmark.findMany({
          where: { userId },
          select: { eventId: true }
        });
        userBookmarks = bookmarks.map((b: { eventId: string }) => b.eventId);
      } catch (error) {
        // Bookmark query failed - default to empty array
        userBookmarks = [];
      }
    }

    // Transform events to include bookmark status and correct participant count
    const eventsWithBookmarks = events.map((event: { id: string; _count: { participations: number } }) => ({
      ...event,
      isBookmarked: userBookmarks.includes(event.id),
      currentParticipants: event._count.participations // Use the count of VERIFIED participations
    }));

    return NextResponse.json({
      events: eventsWithBookmarks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createEventSchema.parse(body);
    const sessions = (parsed.sessions && parsed.sessions.length)
      ? parsed.sessions
      : (parsed.startDate && parsed.endDate)
        ? [{ startAt: parsed.startDate, endAt: parsed.endDate, breakMin: 0, label: 'Day 1' }]
        : [];
    if (!sessions.length) {
      return NextResponse.json({ error: 'At least one session is required' }, { status: 400 });
    }
    if (!sessions.every(s => new Date(s.endAt) > new Date(s.startAt))) {
      return NextResponse.json({ error: 'Each session endAt must be after startAt' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to create events for organization
    if (parsed.organizationId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: parsed.organizationId,
            userId: user.id,
          }
        }
      });

      if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to create events for this organization' },
          { status: 403 }
        );
      }
    }

    const startDate = new Date(Math.min(...sessions.map(s => new Date(s.startAt).getTime())));
    const endDate = new Date(Math.max(...sessions.map(s => new Date(s.endAt).getTime())));
    const totalHours = sessions.reduce((sum, s) => {
      const ms = new Date(s.endAt).getTime() - new Date(s.startAt).getTime();
      const hours = Math.max(0, ms / 36e5 - (s.breakMin ?? 0) / 60);
      return sum + hours;
    }, 0);

    const event = await prisma.event.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        startDate,
        endDate,
        totalHours,
        timezone: parsed.timezone || null,
        location: parsed.location?.city || 'Virtual Event',
        maxParticipants: parsed.maxParticipants,
        organizerId: user.id,
        status: 'DRAFT',
        type: 'VOLUNTEERING',
        sdg: parsed.sdgTags?.[0]?.toString() || null,
        isPublic: parsed.isPublic ?? true,
        sessions: {
          create: sessions.map(s => ({
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
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}