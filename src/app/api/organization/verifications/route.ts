import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find organizations where user is admin or owner
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs that user has admin access to
    const organizationIds = adminMemberships.map(m => m.organization.id);

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'pending';

    // Build where clause
    const whereClause: any = {
      participation: {
        event: {
          organizationId: { in: organizationIds }
        }
      }
    };

    // Add status filter
    if (statusFilter !== 'all') {
      whereClause.status = statusFilter.toUpperCase();
    }

    // Fetch verifications
    const verifications = await prisma.verification.findMany({
      where: whereClause,
      include: {
        participation: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                impactScore: true
              }
            },
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                location: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      verifications,
      count: verifications.length
    });

  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

