// home/ubuntu/impaktrweb/src/app/api/organization/events/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import { z } from 'zod';

const querySchema = z.object({
  organizationId: z.string().optional(),
  period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  sdg: z.string().transform((str) => parseInt(str)).optional(),
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
        memberships: {
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
    const adminOrganizations = user.memberships.filter(
      membership => membership.role === 'admin' || membership.role === 'owner'
    );

    if (adminOrganizations.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { organizationId, period, sdg } = querySchema.parse(params);

    // Determine which organizations to include
    let targetOrganizationIds;
    if (organizationId) {
      // Check if user has access to specific organization
      const hasAccess = adminOrganizations.some(m => m.organizationId === organizationId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied for this organization' }, { status: 403 });
      }
      targetOrganizationIds = [organizationId];
    } else {
      targetOrganizationIds = adminOrganizations.map(m => m.organizationId);
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
        startDate = new Date('1970-01-01');
    }

    const where: any = {
      organizationId: { in: targetOrganizationIds },
      createdAt: { gte: startDate },
    };

    if (sdg) {
      where.sdgTags = { has: sdg };
    }

    // Get basic event stats
    const [
      totalEvents,
      activeEvents,
      completedEvents,
      draftEvents,
      totalParticipations,
      verifiedParticipations,
    ] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.event.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.event.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.participation.count({
        where: {
          event: where,
        }
      }),
      prisma.participation.count({
        where: {
          event: where,
          status: 'VERIFIED',
        }
      }),
    ]);

    // Get detailed event data for calculations
    const events = await prisma.event.findMany({
      where,
      include: {
        participations: {
          include: {
            verifications: true,
          }
        },
        _count: {
          select: {
            participations: {
              where: { status: 'VERIFIED' }
            }
          }
        }
      }
    });

    // Calculate advanced statistics
    const totalHours = events.reduce((sum, event) => {
      return sum + event.participations.reduce((eventSum, participation) => {
        return eventSum + (participation.hoursActual || participation.hoursCommitted);
      }, 0);
    }, 0);

    const averageParticipantsPerEvent = totalEvents > 0 ? totalParticipations / totalEvents : 0;
    const completionRate = totalParticipations > 0 ? (verifiedParticipations / totalParticipations) * 100 : 0;

    // SDG distribution
    const sdgDistribution: { [key: number]: number } = {};
    events.forEach(event => {
      event.sdgTags.forEach(sdgTag => {
        sdgDistribution[sdgTag] = (sdgDistribution[sdgTag] || 0) + 1;
      });
    });

    // Monthly trend data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthlyEvents = await prisma.event.count({
        where: {
          ...where,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          }
        }
      });

      const monthlyParticipations = await prisma.participation.count({
        where: {
          event: {
            ...where,
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            }
          }
        }
      });

      monthlyData.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        events: monthlyEvents,
        participations: monthlyParticipations,
      });
    }

    // Top performing events
    const topEvents = events
      .map(event => ({
        id: event.id,
        title: event.title,
        participationCount: event.participations.length,
        verificationRate: event.participations.length > 0 
          ? (event._count.participations / event.participations.length) * 100 
          : 0,
        totalHours: event.participations.reduce((sum, p) => sum + (p.hoursActual || p.hoursCommitted), 0),
      }))
      .sort((a, b) => b.participationCount - a.participationCount)
      .slice(0, 5);

    // Verification method breakdown
    const verificationMethods: { [key: string]: number } = {};
    events.forEach(event => {
      const method = event.verificationType;
      verificationMethods[method] = (verificationMethods[method] || 0) + 1;
    });

    const stats = {
      overview: {
        totalEvents,
        activeEvents,
        completedEvents,
        draftEvents,
        totalParticipations,
        verifiedParticipations,
        totalHours: Math.round(totalHours * 10) / 10,
        averageParticipantsPerEvent: Math.round(averageParticipantsPerEvent * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
      },
      trends: {
        monthlyData,
        period: period,
      },
      distribution: {
        sdgDistribution,
        verificationMethods,
      },
      topEvents,
      organizations: adminOrganizations.map(m => ({
        id: m.organizationId,
        name: m.organization.name,
        role: m.role,
      })),
    };

    return NextResponse.json(stats);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching organization event stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}