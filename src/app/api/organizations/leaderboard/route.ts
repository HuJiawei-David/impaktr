// home/ubuntu/impaktrweb/src/app/api/organizations/leaderboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const industry = url.searchParams.get('industry') || 'all';
    const size = url.searchParams.get('size') || 'all';
    const country = url.searchParams.get('country') || 'all';
    const period = url.searchParams.get('period') || '30d';

    // Get user's organization
    const userMembership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true }
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'User not part of any organization' }, { status: 404 });
    }

    // Build where clause for filtering
    const where: Prisma.OrganizationWhereInput = {};

    if (industry !== 'all') {
      where.industry = industry;
    }

    if (size !== 'all') {
      where.companySize = size;
    }

    if (country !== 'all') {
      where.country = country;
    }

    // Get organizations with their stats
    const organizations = await prisma.organization.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              select: {
                impactScore: true,
                participations: {
                  include: {
                    event: true
                  }
                }
              }
            }
          }
        },
        events: {
          include: {
            participations: true
          }
        }
      },
      orderBy: { averageImpactScore: 'desc' }
    });

    // Calculate rankings and stats
    const rankings = organizations.map((org, index) => {
      const totalMembers = org.members.length;
      const activeMembers = org.members.filter(m => m.status === 'active').length;
      const totalEvents = org.events.length;
      const totalParticipants = org.events.reduce((sum, event) => sum + event.participations.length, 0);
      const volunteerHours = org.events.reduce((sum, event) => 
        sum + event.participations.reduce((eventSum, p) => eventSum + (p.hours || 0), 0), 0
      );
      const participationRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;

      return {
        id: org.id,
        name: org.name,
        logo: org.logo,
        industry: org.industry,
        companySize: org.companySize,
        country: org.country,
        impactScore: org.averageImpactScore || 0,
        participationRate,
        volunteerHours,
        eventCount: totalEvents,
        memberCount: totalMembers,
        rank: index + 1,
        tier: org.tier
      };
    });

    // Find current organization ranking
    const currentOrganization = rankings.find(org => org.id === userMembership.organization.id);

    return NextResponse.json({
      organizations: rankings,
      currentOrganization,
      totalOrganizations: rankings.length
    });

  } catch (error) {
    console.error('Error fetching organization leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}