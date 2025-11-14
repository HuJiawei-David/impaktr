// home/ubuntu/impaktrweb/src/app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { EventStatus } from '@/types/events';

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
  page: z.string().transform((str) => {
    const num = parseInt(str, 10);
    return isNaN(num) ? 1 : num;
  }).optional().default('1'),
  limit: z.string().transform((str) => {
    const num = parseInt(str, 10);
    return isNaN(num) ? 20 : num;
  }).optional().default('20'),
  search: z.string().optional(),
  sdg: z.string().transform((str) => {
    const num = parseInt(str, 10);
    return isNaN(num) ? undefined : num;
  }).optional(),
  location: z.string().optional(),
  startDate: z.string().transform((str) => {
    try {
      return new Date(str);
    } catch {
      return undefined;
    }
  }).optional(),
  endDate: z.string().transform((str) => {
    try {
      return new Date(str);
    } catch {
      return undefined;
    }
  }).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  organizationId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { page, limit, search, sdg, location, startDate, endDate, status, organizationId } = querySchema.parse(params);

    const skip = (page - 1) * limit;

    // Get session to check user participation and bookmarks
    let userId: string | undefined;
    try {
      const session = await getSession();
      userId = session?.user?.id;
    } catch (error) {
      // Session error - user not logged in or invalid token
      userId = undefined;
    }

    // Get user's participations if logged in
    let userParticipations: string[] = [];
    let userPendingParticipations: string[] = [];
    let userAttendingParticipations: string[] = [];
    if (userId) {
      try {
        const participations = await prisma.participation.findMany({
          where: { 
            userId,
            status: { 
              notIn: ['CANCELLED', 'REJECTED'] // Exclude cancelled and rejected participations
            }
          },
          select: { eventId: true, status: true }
        });
        userParticipations = participations.map((p: { eventId: string }) => p.eventId);
        // Separate pending (PENDING, REGISTERED) and attending (CONFIRMED, ATTENDED, VERIFIED) participations
        userPendingParticipations = participations
          .filter((p: { eventId: string; status: string }) => 
            p.status === 'PENDING' || p.status === 'REGISTERED'
          )
          .map((p: { eventId: string }) => p.eventId);
        userAttendingParticipations = participations
          .filter((p: { eventId: string; status: string }) => 
            p.status === 'CONFIRMED' || p.status === 'ATTENDED' || p.status === 'VERIFIED'
          )
          .map((p: { eventId: string }) => p.eventId);
      } catch (error) {
        // Participation query failed - default to empty array
        userParticipations = [];
        userPendingParticipations = [];
        userAttendingParticipations = [];
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isPublic: true, // Only show public events
    };

    // Build base conditions array for AND logic
    const baseConditions: Prisma.EventWhereInput[] = [];

    // Apply status filter if provided, otherwise show UPCOMING and ACTIVE events
    if (status) {
      // When status is explicitly provided:
      if (status === 'UPCOMING') {
        // For UPCOMING status, always filter by date to exclude past events
        // If user has participations, include their upcoming events OR other upcoming events
        if (userParticipations.length > 0) {
          baseConditions.push({
            OR: [
              {
                id: { in: userParticipations },
                startDate: { gte: new Date() } // User's events that are still upcoming
              },
              {
                status: status,
                startDate: { gte: new Date() } // Other upcoming events
              }
            ]
          });
        } else {
          baseConditions.push({
            status: status,
            startDate: { gte: new Date() } // Only events starting from now
          });
        }
      } else {
        // For other statuses (ACTIVE, COMPLETED, etc.), include user's events if they have participations
        if (userParticipations.length > 0) {
          baseConditions.push({
            OR: [
              {
                id: { in: userParticipations } // User's registered events - no status filter
              },
              {
                status: status // Events with specified status
              }
            ]
          });
        } else {
          baseConditions.push({
            status: status
          });
        }
      }
    } else {
      // For default query (no status specified)
      // Show UPCOMING/ACTIVE events that haven't started yet
      const now = new Date();
      if (userParticipations.length > 0) {
        // Use OR to include: user's upcoming events OR other UPCOMING/ACTIVE events
        baseConditions.push({
          OR: [
            {
              id: { in: userParticipations },
              startDate: { gte: now } // User's events that are still upcoming
            },
            {
              status: { in: ['UPCOMING', 'ACTIVE'] },
              startDate: { gte: now } // Other upcoming/active events
            }
          ]
        });
      } else {
        // No participations - just show UPCOMING and ACTIVE events that haven't started
        baseConditions.push({
          status: { in: ['UPCOMING', 'ACTIVE'] },
          startDate: { gte: now } // Only events starting from now
        });
      }
    }

    // Apply search filter
    if (search) {
      baseConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ]
      });
    }

    // Apply SDG filter
    if (sdg) {
      baseConditions.push({
        sdg: sdg.toString()
      });
    }

    // Apply location filter
    if (location) {
      baseConditions.push({
        location: {
          contains: location,
          mode: 'insensitive' as const
        }
      });
    }

    // Apply organization filter
    if (organizationId) {
      baseConditions.push({
        organizationId: organizationId
      });
    }

    // Apply custom date filters if provided (override default date filters)
    if (startDate || endDate) {
      const dateCondition: { gte?: Date; lte?: Date } = {};
      if (startDate) dateCondition.gte = startDate;
      if (endDate) dateCondition.lte = endDate;
      baseConditions.push({
        startDate: dateCondition
      });
    }

    // Combine all conditions with AND
    if (baseConditions.length > 0) {
      where.AND = baseConditions;
    } else {
      // If no base conditions, apply status filter directly
      if (status && !where.status) {
        where.status = status;
      }
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

    // Transform events to include bookmark status, participation status, and correct participant count
    const eventsWithBookmarks = events.map((event: { id: string; _count: { participations: number } }) => ({
      ...event,
      isBookmarked: userBookmarks.includes(event.id),
      isPending: userPendingParticipations.includes(event.id), // Mark if user has pending/registered participation
      isAttending: userAttendingParticipations.includes(event.id), // Mark if user has confirmed/attended/verified participation
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
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
        },
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