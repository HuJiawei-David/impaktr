// home/ubuntu/impaktrweb/src/app/api/organization/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { calculateOrganizationScore } from '@/lib/scoring';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId');

    // Get user to check organization membership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: { organization: true }
        },
        ownedOrganizations: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine which organization to get stats for
    let targetOrgId = orgId;
    if (!targetOrgId) {
      // If no orgId specified, use the first organization the user owns or is a member of
      const ownedOrg = user.ownedOrganizations[0];
      const memberOrg = user.memberships[0]?.organization;
      targetOrgId = ownedOrg?.id || memberOrg?.id;
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if user has access to this organization
    const hasAccess = user.ownedOrganizations.some(org => org.id === targetOrgId) ||
                     user.memberships.some(membership => 
                       membership.organizationId === targetOrgId && 
                       ['admin', 'owner'].includes(membership.role)
                     );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get organization with related data
    const organization = await prisma.organization.findUnique({
      where: { id: targetOrgId },
      include: {
        members: {
          include: {
            user: {
              include: {
                profile: true,
                participations: {
                  where: { status: 'VERIFIED' },
                  include: { event: true }
                },
                badges: {
                  where: { earnedAt: { not: null } },
                  include: { badge: true }
                }
              }
            }
          }
        },
        events: {
          include: {
            participations: {
              where: { status: 'VERIFIED' }
            },
            _count: {
              select: {
                participations: {
                  where: { status: 'VERIFIED' }
                }
              }
            }
          }
        },
        badges: {
          where: { earnedAt: { not: null } },
          include: { badge: true }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Calculate current period dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculate stats
    const totalMembers = organization.members.length;
    const activeMembers = organization.members.filter(member => 
      member.user.participations.length > 0
    ).length;

    const totalEvents = organization.events.length;
    const activeEvents = organization.events.filter(event => 
      event.status === 'ACTIVE'
    ).length;
    const completedEvents = organization.events.filter(event => 
      event.status === 'COMPLETED'
    ).length;

    const totalHours = organization.members.reduce((sum, member) =>
      sum + member.user.participations.reduce((memberSum, participation) =>
        memberSum + (participation.hoursActual || participation.hoursCommitted), 0
      ), 0
    );

    const totalParticipations = organization.events.reduce((sum, event) =>
      sum + event.participations.length, 0
    );

    // Calculate this month's stats
    const thisMonthEvents = organization.events.filter(event =>
      new Date(event.createdAt) >= startOfMonth
    );

    const thisMonthHours = organization.members.reduce((sum, member) =>
      sum + member.user.participations
        .filter(p => new Date(p.createdAt) >= startOfMonth)
        .reduce((memberSum, participation) =>
          memberSum + (participation.hoursActual || participation.hoursCommitted), 0
        ), 0
    );

    const thisMonthParticipations = organization.events.reduce((sum, event) =>
      sum + event.participations.filter(p => 
        new Date(p.createdAt) >= startOfMonth
      ).length, 0
    );

    // Calculate last month's stats for comparison
    const lastMonthHours = organization.members.reduce((sum, member) =>
      sum + member.user.participations
        .filter(p => 
          new Date(p.createdAt) >= startOfLastMonth && 
          new Date(p.createdAt) <= endOfLastMonth
        )
        .reduce((memberSum, participation) =>
          memberSum + (participation.hoursActual || participation.hoursCommitted), 0
        ), 0
    );

    const lastMonthParticipations = organization.events.reduce((sum, event) =>
      sum + event.participations.filter(p => 
        new Date(p.createdAt) >= startOfLastMonth && 
        new Date(p.createdAt) <= endOfLastMonth
      ).length, 0
    );

    // Calculate growth rates
    const hoursGrowthRate = lastMonthHours > 0 
      ? ((thisMonthHours - lastMonthHours) / lastMonthHours) * 100 
      : thisMonthHours > 0 ? 100 : 0;

    const participationGrowthRate = lastMonthParticipations > 0 
      ? ((thisMonthParticipations - lastMonthParticipations) / lastMonthParticipations) * 100 
      : thisMonthParticipations > 0 ? 100 : 0;

    // SDG breakdown
    const sdgBreakdown: { [key: number]: number } = {};
    organization.events.forEach(event => {
      event.sdgTags.forEach(sdg => {
        sdgBreakdown[sdg] = (sdgBreakdown[sdg] || 0) + event.participations.length;
      });
    });

    // Member engagement levels
    const memberEngagement = organization.members.map(member => ({
      userId: member.userId,
      name: member.user.profile?.displayName || 
            `${member.user.profile?.firstName} ${member.user.profile?.lastName}`.trim(),
      totalHours: member.user.participations.reduce((sum, p) => 
        sum + (p.hoursActual || p.hoursCommitted), 0),
      totalEvents: member.user.participations.length,
      impaktrScore: member.user.impaktrScore,
      badges: member.user.badges.length,
      lastActivity: member.user.participations.length > 0 
        ? Math.max(...member.user.participations.map(p => new Date(p.createdAt).getTime()))
        : new Date(member.joinedAt).getTime()
    })).sort((a, b) => b.totalHours - a.totalHours);

    // Calculate updated organization score
    const updatedOrgScore = await calculateOrganizationScore(organization.id);

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthHours = organization.members.reduce((sum, member) =>
        sum + member.user.participations
          .filter(p => 
            new Date(p.createdAt) >= monthStart && 
            new Date(p.createdAt) <= monthEnd
          )
          .reduce((memberSum, participation) =>
            memberSum + (participation.hoursActual || participation.hoursCommitted), 0
          ), 0
      );

      const monthParticipations = organization.events.reduce((sum, event) =>
        sum + event.participations.filter(p => 
          new Date(p.createdAt) >= monthStart && 
          new Date(p.createdAt) <= monthEnd
        ).length, 0
      );

      monthlyTrends.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        hours: monthHours,
        participations: monthParticipations,
        events: organization.events.filter(e => 
          new Date(e.createdAt) >= monthStart && 
          new Date(e.createdAt) <= monthEnd
        ).length
      });
    }

    const stats = {
      organizationInfo: {
        id: organization.id,
        name: organization.name,
        type: organization.type,
        tier: organization.tier,
        impaktrScore: updatedOrgScore,
        isVerified: organization.isVerified,
        createdAt: organization.createdAt
      },
      overview: {
        totalMembers,
        activeMembers,
        memberEngagementRate: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0,
        totalEvents,
        activeEvents,
        completedEvents,
        totalHours,
        totalParticipations,
        averageHoursPerMember: totalMembers > 0 ? totalHours / totalMembers : 0,
        averageEventsPerMember: totalMembers > 0 ? totalParticipations / totalMembers : 0
      },
      thisMonth: {
        events: thisMonthEvents.length,
        hours: thisMonthHours,
        participations: thisMonthParticipations,
        newMembers: organization.members.filter(m => 
          new Date(m.joinedAt) >= startOfMonth
        ).length
      },
      growth: {
        hoursGrowthRate: Math.round(hoursGrowthRate * 10) / 10,
        participationGrowthRate: Math.round(participationGrowthRate * 10) / 10,
        memberGrowthRate: 0 // Calculate if needed
      },
      sdgBreakdown,
      memberEngagement: memberEngagement.slice(0, 10), // Top 10 most engaged members
      monthlyTrends,
      badges: {
        total: organization.badges.length,
        bySDG: organization.badges.reduce((acc, badge) => {
          const sdg = badge.badge.sdgNumber;
          acc[sdg] = (acc[sdg] || 0) + 1;
          return acc;
        }, {} as { [key: number]: number })
      },
      recentActivity: organization.events
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(event => ({
          id: event.id,
          type: 'event_created',
          title: event.title,
          date: event.createdAt,
          participants: event.participations.length
        }))
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}