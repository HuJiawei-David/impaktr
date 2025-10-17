import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('id');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Fetch organization with related data
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
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
          }
        },
        corporateBadges: {
          include: {
            badge: true
          }
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

    // Get top volunteers by hours
    const topVolunteersData = await prisma.user.findMany({
      where: {
        id: {
          in: organization.members.map(m => m.userId)
        }
      },
      select: {
        id: true,
        name: true,
        image: true,
        participations: {
          where: {
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
        name: user.name,
        image: user.image,
        hours: user.participations.reduce((sum, p) => sum + (p.hours || 0), 0)
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Get unique SDGs from events (convert string to number)
    const sdgs = [...new Set(
      organization.events
        .map(e => e.sdg ? parseInt(e.sdg) : null)
        .filter((sdg): sdg is number => sdg !== null && !isNaN(sdg))
    )];

    // Format response
    const orgData = {
      id: organization.id,
      name: organization.name,
      logo: organization.logo,
      description: organization.description,
      type: organization.type,
      city: organization.city,
      country: organization.country,
      website: organization.website,
      email: organization.email,
      phone: organization.phone,
      tier: organization.tier,
      impactScore: organization.averageImpactScore || 0,
      esgScore: organization.esgScore || 0,
      memberCount: organization.members.length,
      eventCount: organization.events.length,
      totalHours: totalHours._sum.hours || 0,
      isFollowing: organization.followers.length > 0,
      sdgs: sdgs,
      badges: organization.corporateBadges.map(cb => ({
        id: cb.badgeId,
        name: cb.badge.name,
        description: cb.badge.description,
        tier: cb.badge.tier,
        earnedAt: cb.earnedAt
      })),
      recentEvents: organization.events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        status: event.status,
        imageUrl: event.imageUrl
      })),
      topVolunteers: topVolunteers
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
