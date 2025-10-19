import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getOrderBy(sort: string) {
  switch (sort) {
    case 'popular':
      return { _count: { applications: 'desc' } };
    case 'deadline':
      return { deadline: 'asc' as const };
    case 'alphabetical':
      return { title: 'asc' as const };
    case 'recent':
    default:
      return { createdAt: 'desc' as const };
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'OPEN';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';
    const location = url.searchParams.get('location') || '';
    const skills = url.searchParams.get('skills')?.split(',') || [];
    const sdg = url.searchParams.get('sdg')?.split(',') || [];
    const sort = url.searchParams.get('sort') || 'recent';

    const where: any = {
      status: status as any,
    };

    // Build OR conditions for search and SDG
    const orConditions = [];

    if (search) {
      orConditions.push(
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      );
    }

    if (sdg.length > 0) {
      orConditions.push(...sdg.map(num => ({
        sdg: { contains: `SDG ${num}` }
      })));
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (skills.length > 0) {
      where.skills = { hasSome: skills };
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            tier: true,
          }
        },
        _count: {
          select: {
            applications: true,
          }
        },
        applications: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: getOrderBy(sort),
      take: limit,
      skip: offset
    });

    // Get user's bookmarks and applications if session exists
    let userBookmarks: string[] = [];
    let userApplications: string[] = [];
    
    try {
      const { getSession } = await import('@/lib/auth');
      const session = await getSession();
      if (session?.user?.id) {
        const bookmarks = await prisma.opportunityBookmark.findMany({
          where: { userId: session.user.id },
          select: { opportunityId: true }
        });
        userBookmarks = bookmarks.map(b => b.opportunityId);

        const applications = await prisma.application.findMany({
          where: { userId: session.user.id },
          select: { opportunityId: true }
        });
        userApplications = applications.map(a => a.opportunityId);
      }
    } catch (error) {
      // Session not available, continue without user data
    }

    const formattedOpportunities = opportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      requirements: opp.requirements,
      spots: opp.spots,
      spotsFilled: opp.spotsFilled,
      deadline: opp.deadline,
      location: opp.location,
      isRemote: opp.isRemote,
      skills: opp.skills,
      sdg: opp.sdg,
      status: opp.status,
      createdAt: opp.createdAt,
      organization: {
        id: opp.organization.id,
        name: opp.organization.name,
        logo: opp.organization.logo,
        tier: opp.organization.tier,
      },
      stats: {
        totalApplications: opp._count.applications,
        spotsRemaining: opp.spots - opp.spotsFilled,
        appliedCount: opp.applications.filter(app => app.status === 'PENDING').length,
        acceptedCount: opp.applications.filter(app => app.status === 'APPROVED').length,
        rejectedCount: opp.applications.filter(app => app.status === 'REJECTED').length,
      },
      isBookmarked: userBookmarks.includes(opp.id),
      isApplied: userApplications.includes(opp.id),
    }));

    return NextResponse.json({ opportunities: formattedOpportunities });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}
