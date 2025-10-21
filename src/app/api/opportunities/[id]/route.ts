import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if opportunity exists
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            type: true,
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
      }
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Get user's bookmark and application status if logged in
    let isBookmarked = false;
    let isApplied = false;
    
    try {
      const session = await getSession();
      if (session?.user?.id) {
        const bookmark = await prisma.opportunityBookmark.findUnique({
          where: {
            userId_opportunityId: {
              userId: session.user.id,
              opportunityId: id
            }
          }
        });
        isBookmarked = !!bookmark;

        const application = await prisma.application.findUnique({
          where: {
            opportunityId_userId: {
              opportunityId: id,
              userId: session.user.id
            }
          }
        });
        isApplied = !!application;
      }
    } catch (error) {
      // Session not available, continue without user data
    }

    // Format response
    const response = {
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      requirements: opportunity.requirements,
      spots: opportunity.spots,
      spotsFilled: opportunity.spotsFilled,
      deadline: opportunity.deadline,
      location: opportunity.location,
      isRemote: opportunity.isRemote,
      skills: opportunity.skills,
      sdg: opportunity.sdg,
      status: opportunity.status,
      createdAt: opportunity.createdAt,
      organization: {
        id: opportunity.organization.id,
        name: opportunity.organization.name,
        logo: opportunity.organization.logo,
        type: opportunity.organization.type,
      },
      stats: {
        totalApplications: opportunity._count.applications,
        spotsRemaining: opportunity.spots - opportunity.spotsFilled,
        appliedCount: opportunity.applications.filter(app => app.status === 'PENDING').length,
        acceptedCount: opportunity.applications.filter(app => app.status === 'APPROVED').length,
        rejectedCount: opportunity.applications.filter(app => app.status === 'REJECTED').length,
      },
      isBookmarked,
      isApplied,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 });
  }
}

