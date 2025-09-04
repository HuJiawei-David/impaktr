// home/ubuntu/impaktrweb/src/app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus, VerificationType } from '@prisma/client';

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
  verificationType: z.nativeEnum(VerificationType).default(VerificationType.ORGANIZER),
  organizationId: z.string().optional(),
});

const querySchema = z.object({
  page: z.string().transform((str) => parseInt(str)).default('1'),
  limit: z.string().transform((str) => parseInt(str)).default('10'),
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

    const where: any = {
      status: status || EventStatus.ACTIVE,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sdg) {
      where.sdgTags = { has: sdg };
    }

    if (location) {
      where.location = {
        path: ['city'],
        string_contains: location,
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
          creator: {
            include: {
              profile: true,
            },
          },
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

    return NextResponse.json({
      events,
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
        ...validatedData,
        creatorId: user.id,
        status: EventStatus.DRAFT,
      },
      include: {
        creator: {
          include: {
            profile: true,
          },
        },
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