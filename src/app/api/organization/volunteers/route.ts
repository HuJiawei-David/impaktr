import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const volunteerSearchSchema = z.object({
  query: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  availability: z.string().optional(),
  tier: z.string().optional(),
  hasVolunteered: z.boolean().optional(),
  sortBy: z.enum(['name', 'tier', 'lastActivity', 'volunteerCount', 'rating']).default('name'),
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
    const organizationId = url.searchParams.get('organizationId');
    const params = {
      query: url.searchParams.get('query'),
      skills: url.searchParams.get('skills') ? url.searchParams.get('skills')!.split(',') : undefined,
      location: url.searchParams.get('location'),
      availability: url.searchParams.get('availability'),
      tier: url.searchParams.get('tier'),
      hasVolunteered: url.searchParams.get('hasVolunteered') === 'true',
      sortBy: url.searchParams.get('sortBy') || 'name',
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const validatedParams = volunteerSearchSchema.parse(params);

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
        return NextResponse.json({ error: 'Unauthorized to access volunteer database' }, { status: 403 });
      }
    }

    // Build where clause for volunteer search
    let where: any = {
      isPublic: true,
      volunteerProfile: {
        isPublic: true
      }
    };

    // Search by query (name, bio, skills)
    if (validatedParams.query) {
      where.OR = [
        { name: { contains: validatedParams.query, mode: 'insensitive' } },
        { bio: { contains: validatedParams.query, mode: 'insensitive' } },
        { volunteerProfile: { skills: { hasSome: [validatedParams.query] } } }
      ];
    }

    // Filter by skills
    if (validatedParams.skills && validatedParams.skills.length > 0) {
      where.volunteerProfile = {
        ...where.volunteerProfile,
        skills: { hasSome: validatedParams.skills }
      };
    }

    // Filter by location
    if (validatedParams.location) {
      where.OR = [
        { city: { contains: validatedParams.location, mode: 'insensitive' } },
        { country: { contains: validatedParams.location, mode: 'insensitive' } }
      ];
    }

    // Filter by tier
    if (validatedParams.tier) {
      where.tier = validatedParams.tier;
    }

    // Filter by availability
    if (validatedParams.availability) {
      where.volunteerProfile = {
        ...where.volunteerProfile,
        availability: { contains: validatedParams.availability, mode: 'insensitive' }
      };
    }

    // Get volunteers
    const volunteers = await prisma.user.findMany({
      where,
      include: {
        volunteerProfile: true,
        participations: {
          include: {
            event: {
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
        badges: {
          include: {
            badge: true
          },
          take: 5
        },
        _count: {
          select: {
            participations: true,
            followers: true,
          }
        }
      },
      take: validatedParams.limit,
      skip: validatedParams.offset
    });

    // Filter by "has volunteered" if requested
    let filteredVolunteers = volunteers;
    if (validatedParams.hasVolunteered !== undefined) {
      if (organizationId) {
        // Check if they've volunteered with this specific organization
        filteredVolunteers = volunteers.filter(volunteer => {
          const hasVolunteeredWithOrg = volunteer.participations.some(p => 
            p.event.organizationId === organizationId
          );
          return validatedParams.hasVolunteered ? hasVolunteeredWithOrg : !hasVolunteeredWithOrg;
        });
      } else {
        // Check if they've volunteered with any organization
        filteredVolunteers = volunteers.filter(volunteer => {
          const hasVolunteered = volunteer.participations.length > 0;
          return validatedParams.hasVolunteered ? hasVolunteered : !hasVolunteered;
        });
      }
    }

    // Calculate additional metrics for each volunteer
    const enrichedVolunteers = filteredVolunteers.map(volunteer => {
      const totalHours = volunteer.participations.reduce((sum, p) => sum + (p.hours || 0), 0);
      const verifiedHours = volunteer.participations.filter(p => p.status === 'VERIFIED').reduce((sum, p) => sum + (p.hours || 0), 0);
      const organizationsWorkedWith = new Set(volunteer.participations.map(p => p.event.organizationId)).size;
      
      // Calculate rating based on participation history
      const completedEvents = volunteer.participations.filter(p => p.status === 'VERIFIED').length;
      const totalEvents = volunteer.participations.length;
      const completionRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;
      
      // Calculate last activity
      const lastParticipation = volunteer.participations
        .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())[0];

      return {
        id: volunteer.id,
        name: volunteer.name,
        email: volunteer.email,
        image: volunteer.image,
        bio: volunteer.bio,
        city: volunteer.city,
        country: volunteer.country,
        tier: volunteer.tier,
        impactScore: volunteer.impactScore,
        volunteerProfile: volunteer.volunteerProfile,
        stats: {
          totalHours,
          verifiedHours,
          eventsParticipated: volunteer.participations.length,
          organizationsWorkedWith,
          completionRate: Math.round(completionRate),
          followers: volunteer._count.followers,
        },
        badges: volunteer.badges.map(ub => ({
          id: ub.badge.id,
          name: ub.badge.name,
          icon: ub.badge.icon,
          tier: ub.badge.tier,
        })),
        lastActivity: lastParticipation?.joinedAt,
        hasVolunteeredWithOrg: organizationId ? 
          volunteer.participations.some(p => p.event.organizationId === organizationId) : 
          volunteer.participations.length > 0,
      };
    });

    // Sort volunteers
    enrichedVolunteers.sort((a, b) => {
      switch (validatedParams.sortBy) {
        case 'tier':
          const tierOrder = ['GLOBAL_CITIZEN', 'AMBASSADOR', 'LEADER', 'MENTOR', 'CHANGEMAKER', 'ADVOCATE', 'BUILDER', 'CONTRIBUTOR', 'SUPPORTER', 'HELPER'];
          return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
        case 'lastActivity':
          return new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime();
        case 'volunteerCount':
          return b.stats.eventsParticipated - a.stats.eventsParticipated;
        case 'rating':
          return b.stats.completionRate - a.stats.completionRate;
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return NextResponse.json({
      volunteers: enrichedVolunteers,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        total: enrichedVolunteers.length,
        hasMore: enrichedVolunteers.length === validatedParams.limit,
      }
    });
  } catch (error) {
    console.error('Error searching volunteers:', error);
    return NextResponse.json({ error: 'Failed to search volunteers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { volunteerId, organizationId, action, message } = body;

    // Check if user is admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to manage volunteers' }, { status: 403 });
    }

    // Get volunteer details
    const volunteer = await prisma.user.findUnique({
      where: { id: volunteerId },
      include: {
        volunteerProfile: true
      }
    });

    if (!volunteer) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    // Perform action based on type
    switch (action) {
      case 'invite':
        // Create a notification for the volunteer
        await prisma.notification.create({
          data: {
            userId: volunteerId,
            type: 'INVITATION',
            title: 'Volunteer Invitation',
            message: `An organization has invited you to volunteer with them. ${message || ''}`,
            data: {
              organizationId,
              inviterId: session.user.id,
              action: 'invite'
            }
          }
        });
        break;

      case 'favorite':
        // Add to organization's favorite volunteers (we'll need to create a FavoriteVolunteer model)
        // For now, we'll just create a notification
        await prisma.notification.create({
          data: {
            userId: volunteerId,
            type: 'SYSTEM',
            title: 'Added to Favorites',
            message: `An organization has added you to their favorite volunteers.`,
            data: {
              organizationId,
              action: 'favorite'
            }
          }
        });
        break;

      case 'contact':
        // Create a notification for contact
        await prisma.notification.create({
          data: {
            userId: volunteerId,
            type: 'MESSAGE',
            title: 'Volunteer Opportunity',
            message: `An organization wants to contact you about volunteering opportunities. ${message || ''}`,
            data: {
              organizationId,
              contactId: session.user.id,
              action: 'contact'
            }
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Action completed successfully' });
  } catch (error) {
    console.error('Error managing volunteer:', error);
    return NextResponse.json({ error: 'Failed to manage volunteer' }, { status: 500 });
  }
}
