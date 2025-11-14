import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/communities/[id]/requests - Get pending join requests for a community
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId } = await params;

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: session.user.id
        }
      }
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can view join requests' },
        { status: 403 }
      );
    }

    // Find all notifications related to join requests for this community
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'CUSTOM',
        data: {
          path: ['type'],
          equals: 'COMMUNITY_JOIN_REQUEST'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter and format join requests
    const joinRequests = notifications
      .filter(notification => {
        const data = notification.data as any;
        return data?.communityId === communityId && 
               data?.type === 'COMMUNITY_JOIN_REQUEST';
      })
      .map(notification => {
        const data = notification.data as any;
        return {
          id: notification.id,
          requesterId: data?.requesterId,
          requesterName: data?.requesterName,
          requesterImage: data?.requesterImage,
          communityId: data?.communityId,
          communityName: data?.communityName,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
        };
      });

    // Get user details for each requester
    const requesterIds = [...new Set(joinRequests.map(r => r.requesterId).filter(Boolean))];
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: requesterIds
        }
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        bio: true,
        impactScore: true,
        tier: true,
      }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Combine request data with user details
    const requestsWithUsers = joinRequests.map(request => {
      const user = userMap.get(request.requesterId);
      return {
        ...request,
        user: user || null,
      };
    });

    return NextResponse.json({
      requests: requestsWithUsers,
      count: requestsWithUsers.length
    });

  } catch (error) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

