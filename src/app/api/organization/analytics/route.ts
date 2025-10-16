// home/ubuntu/impaktrweb/src/app/api/organization/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '30d';

    // Get user's organization
    const userMembership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true }
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'User not part of any organization' }, { status: 404 });
    }

    const organization = userMembership.organization;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
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
        startDate = new Date(0); // All time
    }

    // Get organization data with includes
    const orgData = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                impactScore: true,
                participations: {
                  where: {
                    createdAt: {
                      gte: startDate
                    }
                  },
                  include: {
                    event: true
                  }
                }
              }
            }
          }
        },
        events: {
          where: {
            createdAt: {
              gte: startDate
            }
          },
          include: {
            participations: {
              include: {
                user: {
                  select: {
                    name: true,
                    impactScore: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!orgData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Calculate analytics data
    const totalMembers = orgData.members.length;
    const activeMembers = orgData.members.filter(m => m.status === 'active').length;
    const totalEvents = orgData.events.length;
    const totalParticipants = orgData.events.reduce((sum, event) => sum + event.participations.length, 0);
    const volunteerHours = orgData.events.reduce((sum, event) => 
      sum + event.participations.reduce((eventSum, p) => eventSum + (p.hours || 0), 0), 0
    );
    const participationRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;

    // Generate mock trend data
    const generateTrendData = (baseValue: number, months: number) => {
      return Array.from({ length: months }, (_, i) => ({
        month: new Date(now.getTime() - (months - i - 1) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
        count: baseValue + Math.floor(Math.random() * 20) - 10
      }));
    };

    // Top performers (mock data for now)
    const topPerformers = orgData.members
      .map(member => ({
        id: member.user.id,
        name: member.user.name || 'Unknown',
        impactScore: member.user.impactScore || 0,
        volunteerHours: member.user.participations.reduce((sum, p) => sum + (p.hours || 0), 0),
        eventsParticipated: member.user.participations.length
      }))
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 5);

    // Event statistics
    const eventStats = orgData.events.map(event => ({
      id: event.id,
      title: event.title,
      participants: event.participations.length,
      volunteerHours: event.participations.reduce((sum, p) => sum + (p.hours || 0), 0),
      impactScore: event.participations.reduce((sum, p) => sum + (p.impactPoints || 0), 0),
      status: event.status
    }));

    // SDG breakdown (mock data)
    const sdgBreakdown = [
      { sdg: 1, name: 'No Poverty', events: Math.floor(Math.random() * 5) + 1, participants: Math.floor(Math.random() * 50) + 10, impactScore: Math.floor(Math.random() * 1000) + 500 },
      { sdg: 3, name: 'Good Health', events: Math.floor(Math.random() * 5) + 1, participants: Math.floor(Math.random() * 50) + 10, impactScore: Math.floor(Math.random() * 1000) + 500 },
      { sdg: 4, name: 'Quality Education', events: Math.floor(Math.random() * 5) + 1, participants: Math.floor(Math.random() * 50) + 10, impactScore: Math.floor(Math.random() * 1000) + 500 },
      { sdg: 8, name: 'Decent Work', events: Math.floor(Math.random() * 5) + 1, participants: Math.floor(Math.random() * 50) + 10, impactScore: Math.floor(Math.random() * 1000) + 500 },
      { sdg: 13, name: 'Climate Action', events: Math.floor(Math.random() * 5) + 1, participants: Math.floor(Math.random() * 50) + 10, impactScore: Math.floor(Math.random() * 1000) + 500 },
    ];

    const analyticsData = {
      overview: {
        totalMembers,
        activeMembers,
        totalEvents,
        totalParticipants,
        volunteerHours,
        impactScore: organization.averageImpactScore || 0,
        participationRate
      },
      trends: {
        memberGrowth: generateTrendData(totalMembers, 6),
        eventParticipation: generateTrendData(totalParticipants, 6),
        impactScore: generateTrendData(organization.averageImpactScore || 0, 6),
        volunteerHours: generateTrendData(volunteerHours, 6)
      },
      topPerformers,
      eventStats,
      sdgBreakdown
    };

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      analytics: analyticsData
    });

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

