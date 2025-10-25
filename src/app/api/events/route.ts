// home/ubuntu/impaktrweb/src/app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus } from '@/types/events';
import { Prisma } from '@prisma/client';

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  location: z.object({
    address: z.string().optional(),
    city: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    isVirtual: z.boolean().default(false),
  }),
  maxParticipants: z.number().positive().optional(),
  sdgTags: z.array(z.number().min(1).max(17)),
  skills: z.array(z.string()),
  intensity: z.number().min(0.8).max(1.2).default(1.0),
  verificationType: z.string().default('ORGANIZER'), // Using string since VerificationType doesn't exist
  organizationId: z.string().optional(),
  isPublic: z.boolean().default(true),
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
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { page, limit, search, sdg, location, startDate, endDate, status } = querySchema.parse(params);

    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      isPublic: true, // Only show public events
    };

    // Apply status filter if provided, otherwise show UPCOMING and ACTIVE events
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['UPCOMING', 'ACTIVE'] };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sdg) {
      where.sdg = sdg.toString(); // Use sdg field instead of non-existent sdgTags
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    if (startDate) {
      where.startDate = { gte: startDate };
    }

    if (endDate) {
      where.startDate = { lte: endDate };
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
        userBookmarks = bookmarks.map(b => b.eventId);
      } catch (error) {
        // Bookmark query failed - default to empty array
        userBookmarks = [];
      }
    }

    // Transform events to include bookmark status and correct participant count
    const eventsWithBookmarks = events.map(event => ({
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
    const validatedData = createEventSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to create events for organization
    if (validatedData.organizationId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: validatedData.organizationId,
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

    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate || validatedData.startDate,
        location: validatedData.location?.city || 'Virtual Event',
        maxParticipants: validatedData.maxParticipants,
        organizerId: user.id, // creatorId field doesn't exist, using organizerId instead
        status: 'DRAFT', // Using string literal since EventStatus.DRAFT doesn't exist
        type: 'VOLUNTEERING', // Default type
        sdg: validatedData.sdgTags?.[0]?.toString() || null,
        isPublic: validatedData.isPublic,
      },
      include: {
        organization: true,
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