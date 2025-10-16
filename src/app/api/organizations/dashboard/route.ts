import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateOrganizationKPIs } from '@/lib/organizationHelpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user belongs to an organization
    const membership = user.organizationMemberships[0];
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Not part of an organization' },
        { status: 404 }
      );
    }

    const organization = membership.organization;

    // Fetch organization members
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: organization.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            impactScore: true,
          },
        },
      },
    });

    // Fetch recent events
    const recentEvents = await prisma.event.findMany({
      where: { organizationId: organization.id },
      orderBy: { startDate: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        startDate: true,
        currentParticipants: true,
      },
    });

    // Calculate KPIs
    const rawKpis = await calculateOrganizationKPIs(organization.id);
    
    // Get counts for social features
    const [followersCount, postsCount, eventsCount] = await Promise.all([
      prisma.follow.count({
        where: { followingOrgId: organization.id }
      }),
      prisma.post.count({
        where: { organizationId: organization.id }
      }),
      prisma.event.count({
        where: { organizationId: organization.id }
      })
    ]);
    
    // Map KPIs to the format expected by CorporateKPIs component
    const kpis = {
      impactScore: rawKpis.averageImpactScore,
      participationRate: rawKpis.participationRate,
      volunteerHours: rawKpis.volunteerHours || 0,
      carbonOffset: 0, // TODO: Calculate actual carbon offset
    };

    // Get leaderboard position (mock for now)
    const leaderboardPosition = {
      rank: 42,
      total: 150,
    };

    // Format member data
    const formattedMembers = members.filter((m) => m.status === 'active').map((m) => ({
      id: m.id,
      user: {
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        impactScore: m.user.impactScore,
      },
      role: m.role,
      status: m.status,
    }));

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        logo: organization.logo,
        type: organization.type,
        subscriptionTier: organization.subscriptionTier,
        esgScore: organization.esgScore,
        volunteerHours: organization.volunteerHours,
        participationRate: organization.participationRate,
        averageImpactScore: organization.averageImpactScore,
        industry: organization.industry,
        employeeCount: organization.employeeCount,
        maxMembers: organization.maxMembers,
        maxEvents: organization.maxEvents,
        currentPeriodEnd: organization.currentPeriodEnd,
        tier: organization.subscriptionTier,
        description: organization.description,
        _count: {
          followers: followersCount,
          posts: postsCount,
          events: eventsCount,
        },
      },
      kpis,
      members: formattedMembers,
      recentEvents: recentEvents.map((e) => ({
        ...e,
        startDate: e.startDate.toISOString(),
      })),
      leaderboardPosition,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
