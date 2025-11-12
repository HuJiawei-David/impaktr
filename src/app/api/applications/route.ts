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

    const opportunityId = request.nextUrl.searchParams.get('opportunityId');

    // Log the current user ID for debugging
    console.log('[Applications API] Fetching applications for user:', session.user.id);
    if (opportunityId) {
      console.log('[Applications API] Filtering by opportunity:', opportunityId);
    }

    const applications = await prisma.application.findMany({
      where: { 
        userId: session.user.id,
        ...(opportunityId ? { opportunityId } : {}),
      },
      orderBy: { appliedAt: 'desc' },
      select: {
        id: true,
        userId: true, // Include userId for verification
        status: true,
        message: true,
        resumeUrl: true,
        appliedAt: true,
        opportunity: {
          select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            location: true,
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    console.log(`[Applications API] Found ${applications.length} applications for user ${session.user.id}`);

    // Verify all applications belong to the current user (extra safety check)
    const verifiedApplications = applications.filter(app => app.userId === session.user.id);
    
    if (verifiedApplications.length !== applications.length) {
      console.error(`[Applications API] WARNING: Found applications that don't belong to user ${session.user.id}`);
    }

    return NextResponse.json(
      {
        applications: verifiedApplications.map((application) => ({
          id: application.id,
          userId: application.userId,
          status: application.status,
          message: application.message,
          resumeUrl: application.resumeUrl,
          appliedAt: application.appliedAt,
          opportunity: application.opportunity,
        })),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }
}


