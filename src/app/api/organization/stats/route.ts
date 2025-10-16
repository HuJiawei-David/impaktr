// home/ubuntu/impaktrweb/src/app/api/organization/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { OrganizationMember, User, Participation, Event, UserBadge, Badge } from '@prisma/client';

// Extended types for organization relations
type UserWithRelations = User & {
  participations: Participation[];
  badges: UserBadge[];
};

type MemberWithUser = OrganizationMember & {
  user: UserWithRelations;
};

type EventWithParticipations = Event & {
  participations: Participation[];
};

type UserBadgeWithBadge = UserBadge & {
  badge: Badge;
};

type OrganizationWithRelations = {
  id: string;
  name: string | null;
  members: MemberWithUser[];
  events: EventWithParticipations[];
  corporateBadges?: UserBadgeWithBadge[];
};
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
        organizationMemberships: {
          include: { organization: true }
        },
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine which organization to get stats for
    let targetOrgId = orgId;
    if (!targetOrgId) {
      // If no orgId specified, use the first organization the user owns or is a member of
      const memberOrg = user.organizationMemberships[0]?.organization;
      targetOrgId = memberOrg?.id;
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if user has access to this organization
    const hasAccess = user.organizationMemberships.some((membership: OrganizationMember) => 
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
                    participations: {
                      where: { status: 'VERIFIED' },
                      include: { event: true }
                    },
                    badges: {
                      // where: { earnedAt: { not: null } } // earnedAt field doesn't exist in UserBadge model,
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
              // where: { earnedAt: { not: null } } // earnedAt field doesn't exist in OrganizationBadge model
              // include: { badge: true } // badge field doesn't exist in OrganizationBadge model
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
    const orgWithRelations = organization as OrganizationWithRelations;
    const totalMembers = orgWithRelations.members?.length || 0;
    const activeMembers = orgWithRelations.members?.filter((member: MemberWithUser) => 
      member.user.participations.length > 0
    ).length;

    const totalEvents = orgWithRelations.events?.length || 0;
    const activeEvents = orgWithRelations.events?.filter((event: EventWithParticipations) => 
      event.status === 'ACTIVE'
    ).length;
    const completedEvents = orgWithRelations.events?.filter((event: EventWithParticipations) => 
      event.status === 'COMPLETED'
    ).length || 0;

    const totalHours = orgWithRelations.members?.reduce((sum: number, member: MemberWithUser) =>
      sum + (member.user?.participations?.reduce((memberSum: number, participation: Participation) =>
        memberSum + (participation.hours || 0), 0) || 0), 0
    ) || 0;

    const totalParticipations = orgWithRelations.events?.reduce((sum: number, event: EventWithParticipations) =>
      sum + (event.participations?.length || 0), 0
    ) || 0;

    // Calculate this month's stats
    const thisMonthEvents = orgWithRelations.events?.filter((event: EventWithParticipations) =>
      new Date(event.createdAt) >= startOfMonth
    ) || [];

    const thisMonthHours = orgWithRelations.members?.reduce((sum: number, member: MemberWithUser) =>
      sum + (member.user?.participations
        ?.filter((p: Participation) => new Date(p.createdAt) >= startOfMonth)
        ?.reduce((memberSum: number, participation: Participation) =>
          memberSum + (participation.hours || 0), 0) || 0), 0
    ) || 0;

    const thisMonthParticipations = orgWithRelations.events?.reduce((sum: number, event: EventWithParticipations) =>
      sum + (event.participations?.filter((p: Participation) => 
        new Date(p.createdAt) >= startOfMonth
      ).length || 0), 0
    ) || 0;

    // Calculate last month's stats for comparison
    const lastMonthHours = orgWithRelations.members?.reduce((sum: number, member: MemberWithUser) =>
      sum + (member.user?.participations
        ?.filter((p: Participation) => 
          new Date(p.createdAt) >= startOfLastMonth && 
          new Date(p.createdAt) <= endOfLastMonth
        )
        ?.reduce((memberSum: number, participation: Participation) =>
          memberSum + (participation.hours || 0), 0) || 0), 0
    ) || 0;

    const lastMonthParticipations = orgWithRelations.events?.reduce((sum: number, event: EventWithParticipations) =>
      sum + (event.participations?.filter((p: Participation) => 
        new Date(p.createdAt) >= startOfLastMonth && 
        new Date(p.createdAt) <= endOfLastMonth
      ).length || 0), 0
    ) || 0;

    // Calculate growth rates
    const hoursGrowthRate = lastMonthHours > 0 
      ? ((thisMonthHours - lastMonthHours) / lastMonthHours) * 100 
      : thisMonthHours > 0 ? 100 : 0;

    const participationGrowthRate = lastMonthParticipations > 0 
      ? ((thisMonthParticipations - lastMonthParticipations) / lastMonthParticipations) * 100 
      : thisMonthParticipations > 0 ? 100 : 0;

    // SDG breakdown
    const sdgBreakdown: { [key: number]: number } = {};
    orgWithRelations.events?.forEach((event: EventWithParticipations) => {
      if (event.sdg) {
        sdgBreakdown[parseInt(event.sdg)] = (sdgBreakdown[parseInt(event.sdg)] || 0) + (event.participations?.length || 0);
      }
    });

    // Member engagement levels
    const memberEngagement = orgWithRelations.members?.map((member: MemberWithUser) => ({
      userId: member.userId,
      name: member.user?.name || member.user?.email || 'Unknown User',
      totalHours: member.user?.participations?.reduce((sum: number, p: Participation) => 
        sum + (p.hours || 0), 0) || 0,
      totalEvents: member.user?.participations?.length || 0,
      impaktrScore: member.user?.impactScore || 0,
      badges: member.user?.badges?.length || 0,
      lastActivity: (member.user?.participations?.length || 0) > 0 
        ? Math.max(...(member.user?.participations?.map((p: Participation) => new Date(p.createdAt).getTime()) || [0]))
        : new Date(member.joinedAt).getTime()
    })).sort((a: {totalHours: number}, b: {totalHours: number}) => b.totalHours - a.totalHours);

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
          .reduce((memberSum: number, participation: Participation) =>
            memberSum + (participation.hours || 0), 0
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
        tier: organization.subscriptionTier,
        impaktrScore: updatedOrgScore,
        // isVerified field removed - not in schema
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
        total: orgWithRelations.corporateBadges?.length || 0,
        bySDG: orgWithRelations.corporateBadges?.reduce((acc: { [key: string]: number }, badge: UserBadgeWithBadge) => {
          const sdg = badge.badge?.category || 'unknown';
          acc[sdg] = (acc[sdg] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }) || {}
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