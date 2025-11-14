import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const requestJoinSchema = z.object({
  communityId: z.string().min(1),
});

// POST /api/communities/request-join - Request to join a private/invite-only community
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { communityId } = requestJoinSchema.parse(body);

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        members: {
          where: {
            role: {
              in: ['OWNER', 'ADMIN']
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: session.user.id
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this community' },
        { status: 400 }
      );
    }

    // Check if community is actually private or invite-only
    if (community.privacy === 'PUBLIC') {
      return NextResponse.json(
        { error: 'This community is public. Please use the join endpoint instead.' },
        { status: 400 }
      );
    }

    // Get user info for notification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        image: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create notifications for community owners and admins
    const notifications = community.members.map(member => ({
      userId: member.userId,
      title: 'New Community Join Request',
      message: `${user.name} wants to join ${community.name}`,
      type: 'CUSTOM' as const,
      data: {
        communityId: community.id,
        communityName: community.name,
        requesterId: user.id,
        requesterName: user.name,
        requesterImage: user.image,
        type: 'COMMUNITY_JOIN_REQUEST'
      },
      isRead: false,
    }));

    // Create notifications in bulk
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }

    // If no owners/admins found, notify the creator
    if (notifications.length === 0) {
      await prisma.notification.create({
        data: {
          userId: community.createdBy,
          title: 'New Community Join Request',
          message: `${user.name} wants to join ${community.name}`,
          type: 'CUSTOM',
          data: {
            communityId: community.id,
            communityName: community.name,
            requesterId: user.id,
            requesterName: user.name,
            requesterImage: user.image,
            type: 'COMMUNITY_JOIN_REQUEST'
          },
          isRead: false,
        }
      });
    }

    return NextResponse.json({
      message: 'Join request sent successfully. The community admin will review your request.',
      success: true
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error requesting to join community:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/request-join - Cancel a join request
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const communityId = url.searchParams.get('communityId');

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      );
    }

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

    // Check if user is already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: session.user.id
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this community' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find and delete notifications related to this join request
    // We need to find notifications where:
    // - The notification is for community owners/admins
    // - The notification data contains the requesterId matching the current user
    // - The notification data contains the communityId
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'CUSTOM',
        data: {
          path: ['type'],
          equals: 'COMMUNITY_JOIN_REQUEST'
        }
      }
    });

    // Filter notifications that match this specific request
    const matchingNotifications = notifications.filter(notification => {
      const data = notification.data as any;
      return data?.communityId === communityId && 
             data?.requesterId === session.user.id;
    });

    // Delete matching notifications
    if (matchingNotifications.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          id: {
            in: matchingNotifications.map(n => n.id)
          }
        }
      });
    }

    return NextResponse.json({
      message: 'Join request cancelled successfully',
      success: true
    });

  } catch (error) {
    console.error('Error cancelling join request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

