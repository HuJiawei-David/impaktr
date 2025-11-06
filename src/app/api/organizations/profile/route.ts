import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateESGScore } from '@/lib/esg-calculator';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('id');

    let organizationId = orgId;

    // If no ID provided, fetch the current user's organization
    if (!organizationId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          organizationMemberships: {
            include: {
              organization: true
            }
          }
        }
      });

      if (!user || !user.organizationMemberships || user.organizationMemberships.length === 0) {
        return NextResponse.json({ error: 'Not part of any organization' }, { status: 404 });
      }

      organizationId = user.organizationMemberships[0].organizationId;
    }

    // Fetch organization with related data
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          take: 10,
          orderBy: { joinedAt: 'desc' }
        },
        events: {
          where: {
            status: { in: ['UPCOMING', 'ONGOING', 'COMPLETED'] }
          },
          orderBy: { startDate: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            status: true,
            imageUrl: true,
            sdg: true,
            organization: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        },
        corporateBadges: {
          include: {
            badge: true
          }
        },
        opportunities: {
          where: {
            status: 'OPEN'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        followers: {
          where: { followerId: session.user.id }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get total volunteer hours from all members' participations
    const totalHours = await prisma.participation.aggregate({
      where: {
        userId: {
          in: organization.members.map(m => m.userId)
        },
        status: 'VERIFIED'
      },
      _sum: {
        hours: true
      }
    });

    // Get top volunteers by hours (from THIS organization's COMPLETED/past events only, individuals only)
    const now = new Date();
    const topVolunteersData = await prisma.user.findMany({
      where: {
        userType: 'INDIVIDUAL', // Only individuals
        id: {
          in: organization.members.map(m => m.userId)
        },
        participations: {
          some: {
            event: {
              organizationId: organizationId, // Only events from THIS organization
              OR: [
                { status: 'COMPLETED' },
                { endDate: { lt: now } }
              ]
            },
            status: 'VERIFIED'
          }
        }
      },
      select: {
        id: true,
        name: true,
        image: true,
        impactScore: true,
        participations: {
          where: {
            event: {
              organizationId: organizationId, // Only count hours from THIS organization's events
              OR: [
                { status: 'COMPLETED' },
                { endDate: { lt: now } }
              ]
            },
            status: 'VERIFIED'
          },
          select: {
            hours: true
          }
        }
      }
    });

    // Calculate hours for each volunteer and sort
    const topVolunteers = topVolunteersData
      .map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        image: user.image,
        avatar: user.image,
        hours: user.participations.reduce((sum, p) => sum + (p.hours || 0), 0),
        impactScore: user.impactScore || 0
      }))
      .filter(volunteer => volunteer.hours > 0) // Filter out volunteers with 0 hours
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Get unique SDGs from events (convert string to number)
    const sdgs = [...new Set(
      organization.events
        .map(e => e.sdg ? parseInt(e.sdg) : null)
        .filter((sdg): sdg is number => sdg !== null && !isNaN(sdg))
    )];

    // Calculate SDG participation (count events per SDG from all events, not just upcoming)
    const allEvents = await prisma.event.findMany({
      where: {
        organizationId: organizationId
      },
      select: {
        sdg: true
      }
    });

    // Count events per SDG
    const sdgParticipationMap = new Map<number, number>();
    allEvents.forEach(event => {
      if (event.sdg) {
        const sdgNumber = typeof event.sdg === 'string' ? parseInt(event.sdg) : event.sdg;
        if (!isNaN(sdgNumber) && sdgNumber >= 1 && sdgNumber <= 17) {
          sdgParticipationMap.set(sdgNumber, (sdgParticipationMap.get(sdgNumber) || 0) + 1);
        }
      }
    });

    // Convert to array format matching individual profile
    const sdgParticipations = Array.from(sdgParticipationMap.entries())
      .map(([sdgNumber, eventCount]) => ({
        sdgNumber,
        eventCount
      }))
      .sort((a, b) => b.eventCount - a.eventCount); // Sort by event count descending

    // Get follower count
    const followerCount = await prisma.follow.count({
      where: {
        followingOrgId: organizationId
      }
    });

    // Calculate global and local rankings
    const orgImpactScore = organization.averageImpactScore || 0;
    
    // Global rank: count organizations with higher impact score
    const globalHigherCount = await prisma.organization.count({
      where: {
        averageImpactScore: { gt: orgImpactScore }
      }
    });
    const globalRank = globalHigherCount + 1;
    const globalTotal = await prisma.organization.count({});

    // Local rank (same country)
    let localRank: number | undefined = undefined;
    let localTotal: number | undefined = undefined;
    if (organization.country) {
      const localHigherCount = await prisma.organization.count({
        where: {
          country: organization.country,
          averageImpactScore: { gt: orgImpactScore }
        }
      });
      const localTotalCount = await prisma.organization.count({
        where: {
          country: organization.country
        }
      });
      localRank = localHigherCount + 1;
      localTotal = localTotalCount;
    }

    // Calculate real ESG scores
    let esgData = null;
    try {
      esgData = await calculateESGScore(organizationId, 'annual');
    } catch (error) {
      console.error('Error calculating ESG score:', error);
      // Fallback to mock data if calculation fails
      esgData = {
        environmental: { total: 75 },
        social: { total: 80 },
        governance: { total: 70 },
        overall: 75
      };
    }

    // Format response - match detail page structure (explicitly include all fields)
    const orgData = {
      id: organization.id,
      name: organization.name,
      logo: organization.logo,
      description: organization.description,
      type: organization.type,
      city: organization.city,
      state: organization.state,
      country: organization.country,
      website: organization.website,
      email: organization.email,
      phone: organization.phone,
      tier: organization.tier,
      industry: organization.industry,
      companySize: organization.companySize,
      address: organization.address,
      createdAt: organization.createdAt.toISOString(),
      stats: {
        impactScore: organization.averageImpactScore || 0,
        esgScore: organization.esgScore || 0,
        totalMembers: organization.members.length,
        totalEvents: organization.events.length,
        totalVolunteerHours: totalHours._sum.hours || 0,
        badgesEarned: organization.corporateBadges.length,
        globalRank,
        globalTotal,
        localRank,
        localTotal,
      },
      impactScore: organization.averageImpactScore || 0,
      esgScore: organization.esgScore || 0,
      memberCount: organization.members.length,
      eventCount: organization.events.length,
      totalHours: totalHours._sum.hours || 0,
      isFollowing: organization.followers.length > 0,
      followerCount: followerCount,
      sdgs: organization.sdgFocusAreas && organization.sdgFocusAreas.length > 0 ? organization.sdgFocusAreas : sdgs, // Use sdgFocusAreas from registration if available, otherwise derive from events
      sdgFocusAreas: organization.sdgFocusAreas || [],
      sdgParticipations: sdgParticipations,
      badges: organization.corporateBadges.map(cb => ({
        id: cb.badgeId,
        name: cb.badge.name,
        description: cb.badge.description,
        tier: cb.badge.tier,
        earnedAt: cb.earnedAt.toISOString()
      })),
      recentEvents: organization.events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.title,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString(),
        location: event.location,
        status: event.status,
        imageUrl: event.imageUrl,
        sdg: event.sdg,
        participantCount: 0,
        organization: event.organization,
      })),
      
      // Separate upcoming and past events for Events tab
      upcomingEvents: (await prisma.event.findMany({
        where: {
          organizationId: organizationId,
          status: { in: ['UPCOMING', 'ONGOING', 'ACTIVE'] },
          startDate: { gte: new Date() },
          endDate: { gte: new Date() }
        },
        orderBy: { startDate: 'asc' },
        take: 12,
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
          status: true,
          imageUrl: true,
          sdg: true,
          organization: {
            select: { id: true, name: true, logo: true }
          },
          _count: {
            select: {
              participations: { where: { status: 'VERIFIED' } }
            }
          }
        }
      })).map(event => ({
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString(),
      })),
      
      pastEvents: (await prisma.event.findMany({
        where: {
          organizationId: organizationId,
          OR: [
            { endDate: { lt: new Date() } },
            { startDate: { lt: new Date() } }
          ]
        },
        orderBy: { startDate: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
          status: true,
          imageUrl: true,
          sdg: true,
          organization: {
            select: { id: true, name: true, logo: true }
          },
          _count: {
            select: {
              participations: { where: { status: 'VERIFIED' } }
            }
          }
        }
      })).map(event => ({
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString(),
      })),
      opportunities: organization.opportunities.map(opp => ({
        id: opp.id,
        title: opp.title,
        description: opp.description,
        location: opp.location,
        spots: opp.spots,
        spotsFilled: opp.spotsFilled,
        deadline: opp.deadline?.toISOString(),
        status: opp.status,
        sdg: opp.sdg,
        skills: opp.skills || [],
        requirements: opp.requirements || [],
        isRemote: opp.isRemote,
        createdAt: opp.createdAt.toISOString(),
      })),
      members: organization.members.map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name || 'Unknown',
        email: m.user.email || '',
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        avatar: m.user.image,
      })),
      topVolunteers: topVolunteers,
      esgData: esgData
    };

    return NextResponse.json({ organization: orgData });
  } catch (error) {
    console.error('Error fetching organization profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user || !user.organizationMemberships || user.organizationMemberships.length === 0) {
      return NextResponse.json({ error: 'Not part of any organization' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const membership = user.organizationMemberships[0];

    // Check if user is admin or owner
    if (membership.role !== 'admin' && membership.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    console.log('[API] Received update request:', { organizationId, body });
    
    const {
      name,
      email,
      website,
      description,
      industry,
      companySize,
      country,
      address,
      city,
      state,
      phone,
      sdgFocusAreas
    } = body;

    // Build update data object - only include defined fields
    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website || null; // Allow empty string to clear
    if (description !== undefined) updateData.description = description || null;
    if (industry !== undefined) updateData.industry = industry || null;
    if (companySize !== undefined) updateData.companySize = companySize || null;
    if (country !== undefined) updateData.country = country || null;
    if (address !== undefined) updateData.address = address || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (sdgFocusAreas !== undefined) {
      updateData.sdgFocusAreas = Array.isArray(sdgFocusAreas) ? sdgFocusAreas : [];
    }

    console.log('[API] Update data:', updateData);

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData
    });

    console.log('[API] Organization updated successfully');

    return NextResponse.json({ 
      message: 'Organization profile updated successfully',
      organization: updatedOrganization
    });
  } catch (error) {
    console.error('[API] Error updating organization profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('[API] Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to update organization profile',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
