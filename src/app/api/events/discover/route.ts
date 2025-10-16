import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const eventDiscoverySchema = z.object({
  view: z.enum(['list', 'map', 'calendar']).default('list'),
  filters: z.object({
    location: z.string().optional(),
    radius: z.number().optional(), // in km
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
    eventTypes: z.array(z.string()).optional(),
    sdgs: z.array(z.string()).optional(),
    organizations: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    isRemote: z.boolean().optional(),
    maxParticipants: z.number().optional(),
    minParticipants: z.number().optional(),
  }).optional(),
  sortBy: z.enum(['date', 'distance', 'popularity', 'relevance']).default('date'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = {
      view: url.searchParams.get('view') || 'list',
      filters: {
        location: url.searchParams.get('location'),
        radius: url.searchParams.get('radius') ? parseInt(url.searchParams.get('radius')!) : undefined,
        dateRange: {
          start: url.searchParams.get('startDate'),
          end: url.searchParams.get('endDate'),
        },
        eventTypes: url.searchParams.get('eventTypes') ? url.searchParams.get('eventTypes')!.split(',') : undefined,
        sdgs: url.searchParams.get('sdgs') ? url.searchParams.get('sdgs')!.split(',') : undefined,
        organizations: url.searchParams.get('organizations') ? url.searchParams.get('organizations')!.split(',') : undefined,
        skills: url.searchParams.get('skills') ? url.searchParams.get('skills')!.split(',') : undefined,
        isRemote: url.searchParams.get('isRemote') === 'true',
        maxParticipants: url.searchParams.get('maxParticipants') ? parseInt(url.searchParams.get('maxParticipants')!) : undefined,
        minParticipants: url.searchParams.get('minParticipants') ? parseInt(url.searchParams.get('minParticipants')!) : undefined,
      },
      sortBy: url.searchParams.get('sortBy') || 'date',
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const validatedParams = eventDiscoverySchema.parse(params);

    // Get user's location and preferences for personalized results
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        volunteerProfile: true,
        participations: {
          include: { event: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build where clause
    let where: any = {
      status: 'UPCOMING',
      isPublic: true,
      startDate: { gte: new Date() },
    };

    // Apply filters
    if (validatedParams.filters) {
      const filters = validatedParams.filters;

      // Date range filter
      if (filters.dateRange?.start) {
        where.startDate = { ...where.startDate, gte: new Date(filters.dateRange.start) };
      }
      if (filters.dateRange?.end) {
        where.endDate = { lte: new Date(filters.dateRange.end) };
      }

      // Event types filter
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        where.type = { in: filters.eventTypes };
      }

      // SDGs filter
      if (filters.sdgs && filters.sdgs.length > 0) {
        where.sdg = { in: filters.sdgs };
      }

      // Organizations filter
      if (filters.organizations && filters.organizations.length > 0) {
        where.organizationId = { in: filters.organizations };
      }

      // Skills filter (search in description)
      if (filters.skills && filters.skills.length > 0) {
        where.OR = filters.skills.map(skill => ({
          description: { contains: skill, mode: 'insensitive' }
        }));
      }

      // Participant count filter
      if (filters.minParticipants !== undefined || filters.maxParticipants !== undefined) {
        where.currentParticipants = {};
        if (filters.minParticipants !== undefined) {
          where.currentParticipants.gte = filters.minParticipants;
        }
        if (filters.maxParticipants !== undefined) {
          where.currentParticipants.lte = filters.maxParticipants;
        }
      }

      // Remote filter
      if (filters.isRemote !== undefined) {
        where.location = filters.isRemote ? 'Remote' : { not: 'Remote' };
      }
    }

    // Build orderBy clause
    let orderBy: any = { startDate: 'asc' };
    if (validatedParams.sortBy === 'popularity') {
      orderBy = { currentParticipants: 'desc' };
    } else if (validatedParams.sortBy === 'relevance') {
      // For relevance, we'll sort by user's interests and past participations
      orderBy = { startDate: 'asc' };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            tier: true,
            description: true,
          }
        },
        participations: {
          where: { userId: session.user.id }
        },
        _count: {
          select: {
            participations: true
          }
        }
      },
      orderBy,
      take: validatedParams.limit,
      skip: validatedParams.offset
    });

    // Calculate distance and relevance scores
    const userLocation = user.city || user.country;
    const userSkills = user.volunteerProfile?.skills || [];
    const userInterests = user.volunteerProfile?.interests || [];
    const pastEventTypes = user.participations.map(p => p.event.type);
    const pastSDGs = user.participations.map(p => p.event.sdg).filter(Boolean);

    const enrichedEvents = events.map(event => {
      // Calculate distance (simplified - in real app, use proper geocoding)
      let distance = null;
      if (userLocation && event.location && !event.location.toLowerCase().includes('remote')) {
        // Simple distance calculation based on location matching
        if (event.location.toLowerCase().includes(userLocation.toLowerCase())) {
          distance = 0; // Same city
        } else {
          distance = Math.random() * 50; // Mock distance
        }
      }

      // Calculate relevance score
      let relevanceScore = 0;
      
      // Skills match
      if (userSkills.length > 0) {
        const skillMatches = userSkills.filter(skill => 
          event.description?.toLowerCase().includes(skill.toLowerCase())
        ).length;
        relevanceScore += skillMatches * 20;
      }

      // Interests match
      if (userInterests.length > 0) {
        const interestMatches = userInterests.filter(interest => 
          event.description?.toLowerCase().includes(interest.toLowerCase())
        ).length;
        relevanceScore += interestMatches * 15;
      }

      // Past event types match
      if (pastEventTypes.includes(event.type)) {
        relevanceScore += 25;
      }

      // SDG match
      if (pastSDGs.includes(event.sdg)) {
        relevanceScore += 20;
      }

      // Location match
      if (userLocation && event.location?.toLowerCase().includes(userLocation.toLowerCase())) {
        relevanceScore += 30;
      }

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        imageUrl: event.imageUrl,
        sdg: event.sdg,
        type: event.type,
        status: event.status,
        organization: event.organization,
        stats: {
          totalParticipants: event._count.participations,
          spotsRemaining: event.maxParticipants ? event.maxParticipants - event.currentParticipants : null,
        },
        hasApplied: event.participations.length > 0,
        distance,
        relevanceScore: Math.min(relevanceScore, 100),
        createdAt: event.createdAt,
      };
    });

    // Sort by relevance if requested
    if (validatedParams.sortBy === 'relevance') {
      enrichedEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (validatedParams.sortBy === 'distance') {
      enrichedEvents.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    // Get additional metadata for filters
    const filterOptions = await getFilterOptions();

    return NextResponse.json({
      events: enrichedEvents,
      filterOptions,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        total: enrichedEvents.length,
        hasMore: enrichedEvents.length === validatedParams.limit,
      }
    });
  } catch (error) {
    console.error('Error discovering events:', error);
    return NextResponse.json({ error: 'Failed to discover events' }, { status: 500 });
  }
}

async function getFilterOptions() {
  try {
    // Get unique event types
    const eventTypes = await prisma.event.findMany({
      select: { type: true },
      distinct: ['type'],
      where: { status: 'UPCOMING', isPublic: true }
    });

    // Get unique SDGs
    const sdgs = await prisma.event.findMany({
      select: { sdg: true },
      distinct: ['sdg'],
      where: { 
        status: 'UPCOMING', 
        isPublic: true,
        sdg: { not: null }
      }
    });

    // Get organizations with upcoming events
    const organizations = await prisma.organization.findMany({
      where: {
        events: {
          some: {
            status: 'UPCOMING',
            isPublic: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        logo: true,
      },
      take: 50
    });

    return {
      eventTypes: eventTypes.map(et => et.type),
      sdgs: sdgs.map(s => s.sdg).filter(Boolean),
      organizations: organizations,
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {
      eventTypes: [],
      sdgs: [],
      organizations: [],
    };
  }
}

