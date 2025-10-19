// home/ubuntu/impaktrweb/src/app/api/organization/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus, VerificationType } from '@/types/enums';
import { Prisma } from '@prisma/client';

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  registrationDeadline: z.string().transform((str) => new Date(str)).optional(),
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
  verificationType: z.string().default('ORGANIZER'), // Using string since VerificationType.ORGANIZER doesn't exist
  images: z.array(z.string()).optional(),
  certificateTemplate: z.string().optional(),
  autoIssueCertificates: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  eventInstructions: z.string().optional(),
  materialsNeeded: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email(),
  }).optional(),
});

const querySchema = z.object({
  page: z.string().transform((str) => parseInt(str)).default('1'),
  limit: z.string().transform((str) => parseInt(str)).default('10'),
  search: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  sdg: z.string().transform((str) => parseInt(str)).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get organizations where user is admin or owner
    const adminOrganizations = user.organizationMemberships.filter(
      membership => membership.role === 'admin' || membership.role === 'owner'
    );

    if (adminOrganizations.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    const organizationIds = adminOrganizations.map(m => m.organizationId);

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { page, limit, search, status, sdg, startDate, endDate } = querySchema.parse(params);

    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      organizationId: { in: organizationIds },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (sdg) {
      where.sdg = sdg.toString(); // Convert number to string for sdg field
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
        orderBy: { createdAt: 'desc' },
        include: {
          organization: true,
          participations: {
            include: {
              user: true
            }
          },
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

    // Add calculated fields
    const eventsWithStats = events.map(event => ({
      ...event,
      stats: {
        totalParticipants: 0, // We need to get this separately
        verifiedParticipants: 0, // We need to get this separately
        completionRate: 0, // We need to get this separately
        totalHours: 0, // We need to get this separately
      }
    }));

    return NextResponse.json({
      events: eventsWithStats,
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

    console.error('Error fetching organization events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to create events for any organization
    const adminMembership = user.organizationMemberships.find(
      membership => membership.role === 'admin' || membership.role === 'owner'
    );

    if (!adminMembership) {
      return NextResponse.json(
        { error: 'No organization admin access' },
        { status: 403 }
      );
    }

    // Use the first admin organization (in a real app, this should be specified)
    const organizationId = adminMembership.organizationId;

    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate || validatedData.startDate,
        registrationDeadline: validatedData.registrationDeadline,
        location: validatedData.location.city || 'Virtual Event',
        maxParticipants: validatedData.maxParticipants,
        organizerId: user.id,
        organizationId,
        status: 'DRAFT', // Using string literal since EventStatus.DRAFT doesn't exist
        type: 'VOLUNTEERING', // Default type since validatedData.type doesn't exist
        sdg: validatedData.sdgTags?.[0]?.toString() || null,
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