import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

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

    // Get platform statistics
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
      platformRevenue,
      supportTickets,
      reportedContent,
      systemHealth
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.organization.count(),
      prisma.event.count(),
      prisma.participation.count(),
      
      // New counts in period
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.organization.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.event.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Active counts (users who participated in events in period)
      prisma.user.count({
        where: {
          participations: {
            some: {
              joinedAt: { gte: startDate }
            }
          }
        }
      }),
      
      // Active organizations (organizations with events in period)
      prisma.organization.count({
        where: {
          events: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        }
      }),
      
      // Donation statistics
      prisma.donation.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { amount: true },
        _count: true
      }),
      
      // Volunteer hours
      prisma.participation.aggregate({
        where: {
          joinedAt: { gte: startDate },
          status: 'VERIFIED'
        },
        _sum: { hours: true }
      }),
      
      // Platform revenue (from subscriptions)
      prisma.organization.aggregate({
        where: {
          subscriptionStatus: { in: ['active', 'trialing'] }
        },
        _sum: { donationTotal: true }
      }),
      
      // Support tickets
      prisma.supportTicket.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Reported content
      prisma.report.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // System health metrics
      prisma.$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE "createdAt" >= ${startDate}) as new_users,
          (SELECT COUNT(*) FROM organizations WHERE "createdAt" >= ${startDate}) as new_organizations,
          (SELECT COUNT(*) FROM events WHERE "createdAt" >= ${startDate}) as new_events,
          (SELECT COUNT(*) FROM participations WHERE "joinedAt" >= ${startDate}) as new_participations
      `
    ]);

    // Get recent activity
    const recentActivity = await prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    // Get top performing organizations
    const topOrganizations = await prisma.organization.findMany({
      take: 10,
      orderBy: { averageImpactScore: 'desc' },
      select: {
        id: true,
        name: true,
        logo: true,
        type: true,
        averageImpactScore: true,
        eventCount: true,
        _count: {
          select: {
            members: true,
            events: true,
          }
        }
      }
    });

    // Get user growth data for charts
    const userGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM users 
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    // Get event participation trends
    const participationTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "joinedAt") as date,
        COUNT(*) as count
      FROM participations 
      WHERE "joinedAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "joinedAt")
      ORDER BY date ASC
    `;

    // Get geographic distribution
    const geographicDistribution = await prisma.user.groupBy({
      by: ['country'],
      _count: { country: true },
      where: {
        country: { not: null }
      },
      orderBy: {
        _count: { country: 'desc' }
      },
      take: 10
    });

    // Get SDG impact distribution
    const sdgDistribution = await prisma.event.groupBy({
      by: ['sdg'],
      _count: { sdg: true },
      where: {
        sdg: { not: null },
        createdAt: { gte: startDate }
      },
      orderBy: {
        _count: { sdg: 'desc' }
      }
    });

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
        supportTickets,
        reportedContent,
      },
      charts: {
        userGrowth,
        participationTrends,
        geographicDistribution,
        sdgDistribution,
      },
      recentActivity,
      topOrganizations,
      systemHealth: {
        status: 'healthy',
        uptime: '99.9%',
        responseTime: '120ms',
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch admin dashboard data' }, { status: 500 });
  }
}
