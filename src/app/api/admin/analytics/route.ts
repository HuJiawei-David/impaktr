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
    const period = url.searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const metric = url.searchParams.get('metric') || 'overview'; // overview, users, events, engagement, revenue

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    switch (metric) {
      case 'overview':
        return await getOverviewAnalytics(startDate, now);
      case 'users':
        return await getUserAnalytics(startDate, now);
      case 'events':
        return await getEventAnalytics(startDate, now);
      case 'engagement':
        return await getEngagementAnalytics(startDate, now);
      case 'revenue':
        return await getRevenueAnalytics(startDate, now);
      default:
        return await getOverviewAnalytics(startDate, now);
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

async function getOverviewAnalytics(startDate: Date, endDate: Date) {
  const [
    totalUsers,
    totalOrganizations,
    totalEvents,
    totalParticipations,
    newUsers,
    newOrganizations,
    newEvents,
    activeUsers,
    activeOrganizations,
    totalDonations,
    totalVolunteerHours,
    platformRevenue
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.event.count(),
    prisma.participation.count(),
    prisma.user.count({ where: { createdAt: { gte: startDate } } }),
    prisma.organization.count({ where: { createdAt: { gte: startDate } } }),
    prisma.event.count({ where: { createdAt: { gte: startDate } } }),
    prisma.user.count({
      where: {
        participations: {
          some: { joinedAt: { gte: startDate } }
        }
      }
    }),
    prisma.organization.count({
      where: {
        events: {
          some: { createdAt: { gte: startDate } }
        }
      }
    }),
    prisma.donation.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { amount: true },
      _count: true
    }),
    prisma.participation.aggregate({
      where: {
        joinedAt: { gte: startDate },
        status: 'VERIFIED'
      },
      _sum: { hours: true }
    }),
    prisma.organization.aggregate({
      where: {
        subscriptionStatus: { in: ['active', 'trialing'] }
      },
      _sum: { donationTotal: true }
    })
  ]);

  return NextResponse.json({
    overview: {
      totalUsers,
      totalOrganizations,
      totalEvents,
      totalParticipations,
      newUsers,
      newOrganizations,
      newEvents,
      activeUsers,
      activeOrganizations,
      totalDonations: totalDonations._sum.amount || 0,
      donationCount: totalDonations._count,
      totalVolunteerHours: totalVolunteerHours._sum.hours || 0,
      platformRevenue: platformRevenue._sum.donationTotal || 0,
    }
  });
}

async function getUserAnalytics(startDate: Date, endDate: Date) {
  const [
    userGrowth,
    userRetention,
    userTiers,
    geographicDistribution,
    userEngagement
  ] = await Promise.all([
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM users 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', "createdAt") as week,
        COUNT(*) as new_users,
        COUNT(CASE WHEN "lastActiveAt" >= "createdAt" + INTERVAL '7 days' THEN 1 END) as retained_users
      FROM users 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('week', "createdAt")
      ORDER BY week ASC
    `,
    prisma.user.groupBy({
      by: ['tier'],
      _count: { tier: true },
      orderBy: { _count: { tier: 'desc' } }
    }),
    prisma.user.groupBy({
      by: ['country'],
      _count: { country: true },
      where: { country: { not: null } },
      orderBy: { _count: { country: 'desc' } },
      take: 10
    }),
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "joinedAt") as date,
        COUNT(DISTINCT "userId") as unique_users,
        COUNT(*) as total_participations
      FROM participations 
      WHERE "joinedAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "joinedAt")
      ORDER BY date ASC
    `
  ]);

  return NextResponse.json({
    userGrowth,
    userRetention,
    userTiers,
    geographicDistribution,
    userEngagement
  });
}

async function getEventAnalytics(startDate: Date, endDate: Date) {
  const [
    eventGrowth,
    eventCategories,
    eventParticipation,
    topEvents,
    eventCompletionRates
  ] = await Promise.all([
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM events 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,
    prisma.event.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    }),
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "joinedAt") as date,
        COUNT(*) as participations,
        AVG("hours") as avg_hours
      FROM participations 
      WHERE "joinedAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "joinedAt")
      ORDER BY date ASC
    `,
    prisma.event.findMany({
      take: 10,
      orderBy: { currentParticipants: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        currentParticipants: true,
        maxParticipants: true,
        startDate: true,
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        }
      }
    }),
    prisma.$queryRaw`
      SELECT 
        "type",
        COUNT(*) as total_events,
        COUNT(CASE WHEN "status" = 'COMPLETED' THEN 1 END) as completed_events,
        AVG("currentParticipants") as avg_participants
      FROM events 
      WHERE "createdAt" >= ${startDate}
      GROUP BY "type"
      ORDER BY total_events DESC
    `
  ]);

  return NextResponse.json({
    eventGrowth,
    eventCategories,
    eventParticipation,
    topEvents,
    eventCompletionRates
  });
}

async function getEngagementAnalytics(startDate: Date, endDate: Date) {
  const [
    participationTrends,
    badgeEarnings,
    socialEngagement,
    contentEngagement,
    userActivity
  ] = await Promise.all([
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "joinedAt") as date,
        COUNT(*) as participations,
        COUNT(DISTINCT "userId") as unique_users,
        AVG("hours") as avg_hours
      FROM participations 
      WHERE "joinedAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "joinedAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw`
      SELECT 
        ub."badgeId",
        b."name",
        b."tier",
        b."category",
        COUNT(*) as count
      FROM "user_badges" ub
      JOIN "badges" b ON ub."badgeId" = b."id"
      WHERE ub."earnedAt" >= ${startDate}
      GROUP BY ub."badgeId", b."name", b."tier", b."category"
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as posts,
        COUNT(CASE WHEN "type" = 'LIKE' THEN 1 END) as likes,
        COUNT(CASE WHEN "type" = 'COMMENT' THEN 1 END) as comments,
        COUNT(CASE WHEN "type" = 'SHARE' THEN 1 END) as shares
      FROM posts 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as total_content,
        COUNT(CASE WHEN "type" = 'POST' THEN 1 END) as posts,
        COUNT(CASE WHEN "type" = 'COMMENT' THEN 1 END) as comments,
        COUNT(CASE WHEN "type" = 'LIKE' THEN 1 END) as likes
      FROM activities 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(DISTINCT "userId") as active_users,
        COUNT(*) as total_activities
      FROM activities 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `
  ]);

  return NextResponse.json({
    participationTrends,
    badgeEarnings,
    socialEngagement,
    contentEngagement,
    userActivity
  });
}

async function getRevenueAnalytics(startDate: Date, endDate: Date) {
  const [
    donationTrends,
    subscriptionRevenue,
    organizationTiers,
    paymentMethods,
    revenueByRegion
  ] = await Promise.all([
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as donations,
        SUM("amount") as total_amount,
        AVG("amount") as avg_amount
      FROM donations 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as subscriptions,
        SUM("donationTotal") as total_revenue
      FROM organizations 
      WHERE "createdAt" >= ${startDate}
      AND "subscriptionStatus" IN ('active', 'trialing')
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `,
    prisma.organization.groupBy({
      by: ['tier'],
      _count: { tier: true },
      _sum: { donationTotal: true },
      orderBy: { _count: { tier: 'desc' } }
    }),
    prisma.$queryRaw`
      SELECT 
        "paymentMethod",
        COUNT(*) as count,
        SUM("amount") as total_amount
      FROM donations 
      WHERE "createdAt" >= ${startDate}
      GROUP BY "paymentMethod"
      ORDER BY total_amount DESC
    `,
    prisma.$queryRaw`
      SELECT 
        o."country",
        COUNT(*) as organizations,
        SUM(o."donationTotal") as total_revenue,
        SUM(d."amount") as total_donations
      FROM organizations o
      LEFT JOIN donations d ON o."id" = d."campaignId"
      WHERE o."createdAt" >= ${startDate}
      GROUP BY o."country"
      ORDER BY total_revenue DESC
      LIMIT 10
    `
  ]);

  return NextResponse.json({
    donationTrends,
    subscriptionRevenue,
    organizationTiers,
    paymentMethods,
    revenueByRegion
  });
}
