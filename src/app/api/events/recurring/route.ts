import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRecurringEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  location: z.string().min(1).max(200),
  maxParticipants: z.number().int().min(1).optional(),
  imageUrl: z.string().url().optional(),
  sdg: z.string().optional(),
  type: z.enum(['VOLUNTEERING', 'WORKSHOP', 'FUNDRAISER', 'CLEANUP', 'AWARENESS', 'OTHER']),
  // Recurrence settings
  recurrencePattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
  recurrenceInterval: z.number().int().min(1).default(1), // Every N days/weeks/months
  recurrenceDays: z.array(z.number().int().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
  recurrenceEndDate: z.string().datetime().optional(),
  recurrenceCount: z.number().int().min(1).max(52).optional(), // Max 52 occurrences
  // Time settings
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  duration: z.number().int().min(1).max(1440), // Duration in minutes
  startDate: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is part of an organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        status: 'active',
        role: { in: ['admin', 'owner'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only organization admins can create recurring events' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createRecurringEventSchema.parse(body);

    // Generate recurring event dates
    const eventDates = generateRecurringDates(validatedData);
    
    if (eventDates.length === 0) {
      return NextResponse.json({ error: 'No valid dates generated for recurrence pattern' }, { status: 400 });
    }

    // Create the first event
    const firstEvent = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        organizationId: membership.organizationId,
        startDate: new Date(eventDates[0]),
        endDate: new Date(new Date(eventDates[0]).getTime() + validatedData.duration * 60000),
        location: validatedData.location,
        maxParticipants: validatedData.maxParticipants,
        imageUrl: validatedData.imageUrl,
        sdg: validatedData.sdg,
        type: validatedData.type,
        status: 'UPCOMING',
        isPublic: true,
      }
    });

    // Create remaining events
    const remainingEvents = [];
    for (let i = 1; i < eventDates.length; i++) {
      const event = await prisma.event.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          organizationId: membership.organizationId,
          startDate: new Date(eventDates[i]),
          endDate: new Date(new Date(eventDates[i]).getTime() + validatedData.duration * 60000),
          location: validatedData.location,
          maxParticipants: validatedData.maxParticipants,
          imageUrl: validatedData.imageUrl,
          sdg: validatedData.sdg,
          type: validatedData.type,
          status: 'UPCOMING',
          isPublic: true,
        }
      });
      remainingEvents.push(event);
    }

    return NextResponse.json({ 
      events: [firstEvent, ...remainingEvents],
      totalCreated: eventDates.length,
      message: `Successfully created ${eventDates.length} recurring events`
    });
  } catch (error) {
    console.error('Error creating recurring events:', error);
    return NextResponse.json({ error: 'Failed to create recurring events' }, { status: 500 });
  }
}

function generateRecurringDates(data: any): Date[] {
  const dates: Date[] = [];
  const startDate = new Date(data.startDate);
  const [hours, minutes] = data.startTime.split(':').map(Number);
  
  // Set the time for the first event
  startDate.setHours(hours, minutes, 0, 0);
  
  let currentDate = new Date(startDate);
  const endDate = data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null;
  const maxCount = data.recurrenceCount || 52;
  
  // Add the first date
  dates.push(new Date(currentDate));
  
  while (dates.length < maxCount) {
    switch (data.recurrencePattern) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + data.recurrenceInterval);
        break;
        
      case 'WEEKLY':
        if (data.recurrenceDays && data.recurrenceDays.length > 0) {
          // Find next occurrence of specified days
          let nextDate = new Date(currentDate);
          let found = false;
          
          for (let i = 0; i < 7; i++) {
            nextDate.setDate(nextDate.getDate() + 1);
            if (data.recurrenceDays.includes(nextDate.getDay())) {
              currentDate = new Date(nextDate);
              found = true;
              break;
            }
          }
          
          if (!found) {
            // If no more days in this week, move to next week
            currentDate.setDate(currentDate.getDate() + (7 * data.recurrenceInterval));
          }
        } else {
          currentDate.setDate(currentDate.getDate() + (7 * data.recurrenceInterval));
        }
        break;
        
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + data.recurrenceInterval);
        break;
        
      case 'CUSTOM':
        // For custom, we'll use weekly as default
        currentDate.setDate(currentDate.getDate() + (7 * data.recurrenceInterval));
        break;
    }
    
    // Check if we've exceeded the end date
    if (endDate && currentDate > endDate) {
      break;
    }
    
    // Check if the date is in the future
    if (currentDate > new Date()) {
      dates.push(new Date(currentDate));
    }
  }
  
  return dates;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Check if user is admin of the organization
    if (organizationId) {
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: session.user.id,
          organizationId,
          role: { in: ['admin', 'owner'] },
          status: 'active'
        }
      });

      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized to view recurring events' }, { status: 403 });
      }
    }

    // Get recurring events (events with same title and organization)
    const recurringEvents = await prisma.event.findMany({
      where: {
        organizationId: organizationId ? { equals: organizationId } : undefined,
        status: 'UPCOMING',
        startDate: { gte: new Date() }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        },
        _count: {
          select: {
            participations: true
          }
        }
      },
      orderBy: { startDate: 'asc' },
      take: limit,
      skip: offset
    });

    // Group events by title and organization to identify recurring series
    const recurringSeries = new Map();
    
    recurringEvents.forEach(event => {
      const key = `${event.title}-${event.organizationId}`;
      if (!recurringSeries.has(key)) {
        recurringSeries.set(key, {
          title: event.title,
          organization: event.organization,
          events: [],
          totalEvents: 0,
        });
      }
      
      recurringSeries.get(key).events.push({
        id: event.id,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        participations: event._count.participations,
      });
      
      recurringSeries.get(key).totalEvents++;
    });

    // Convert to array and sort by first event date
    const seriesArray = Array.from(recurringSeries.values())
      .filter(series => series.events.length > 1) // Only show series with multiple events
      .sort((a, b) => new Date(a.events[0].startDate).getTime() - new Date(b.events[0].startDate).getTime());

    return NextResponse.json({ 
      recurringSeries: seriesArray,
      pagination: {
        limit,
        offset,
        total: seriesArray.length,
        hasMore: seriesArray.length === limit,
      }
    });
  } catch (error) {
    console.error('Error fetching recurring events:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring events' }, { status: 500 });
  }
}

