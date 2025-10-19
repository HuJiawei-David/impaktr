import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateESGScore } from '@/lib/esg-calculator';
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
    
    // Calculate real ESG score
    let esgMetrics;
    try {
      esgMetrics = await calculateESGScore(organization.id, 'annual');
    } catch (error) {
      console.error('Error calculating ESG score:', error);
      esgMetrics = {
        environmental: { total: 0 },
        social: { total: 0 },
        governance: { total: 0 },
        overall: 0
      };
    }

    // Get leaderboard position (mock for now)
    const leaderboardPosition = {
      rank: 42,
      total: 150,
    };

    // Calculate Global Ranking (replaces Community Impact Score)
    // This shows where the organization ranks globally
    const globalRanking = {
      rank: leaderboardPosition.rank,
      total: leaderboardPosition.total,
      percentile: Math.round(((leaderboardPosition.total - leaderboardPosition.rank + 1) / leaderboardPosition.total) * 100)
    };

    // Map KPIs to the format expected by CorporateKPIs component
    const kpis = {
      impactScore: rawKpis.averageImpactScore,
      esgScore: esgMetrics.overall,
      volunteerHours: rawKpis.volunteerHours || 0,
      globalRanking: globalRanking,
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
      esgMetrics: {
        environmental: esgMetrics.environmental.total,
        social: esgMetrics.social.total,
        governance: esgMetrics.governance.total,
        overall: esgMetrics.overall,
        breakdown: {
          environmental: {
            sdg6: esgMetrics.environmental.sdg6,
            sdg7: esgMetrics.environmental.sdg7,
            sdg11: esgMetrics.environmental.sdg11,
            sdg12: esgMetrics.environmental.sdg12,
            sdg13: esgMetrics.environmental.sdg13,
            sdg14: esgMetrics.environmental.sdg14,
            sdg15: esgMetrics.environmental.sdg15,
          },
          social: {
            sdg1: esgMetrics.social.sdg1,
            sdg2: esgMetrics.social.sdg2,
            sdg3: esgMetrics.social.sdg3,
            sdg4: esgMetrics.social.sdg4,
            sdg5: esgMetrics.social.sdg5,
            sdg8: esgMetrics.social.sdg8,
            sdg10: esgMetrics.social.sdg10,
          },
          governance: {
            sdg16: esgMetrics.governance.sdg16,
            sdg17: esgMetrics.governance.sdg17,
            sdg12_6: esgMetrics.governance.sdg12_6,
          }
        }
      },
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
