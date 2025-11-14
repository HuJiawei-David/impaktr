import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
});

// POST /api/communities/[id]/requests/[requestId] - Approve or reject a join request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId, requestId } = await params;
    const body = await request.json();
    const { action } = actionSchema.parse(body);

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
        { error: 'Only owners and admins can approve/reject join requests' },
        { status: 403 }
      );
    }

    // Find the notification/request
    const notification = await prisma.notification.findUnique({
      where: { id: requestId }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    const requestData = notification.data as any;
    
    // Verify this notification is for the correct community
    if (requestData?.communityId !== communityId) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const requesterId = requestData?.requesterId;

    if (!requesterId) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: requesterId
        }
      }
    });

    if (action === 'approve') {
      if (existingMembership) {
        // User is already a member, just delete the notification
        await prisma.notification.delete({
          where: { id: requestId }
        });
        return NextResponse.json({
          message: 'User is already a member',
          success: true
        });
      }

      // Create membership
      const newMembership = await prisma.communityMember.create({
        data: {
          communityId,
          userId: requesterId,
          role: 'MEMBER'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      });

      // Update community member count and memberAvatars
      const userAvatar = newMembership.user.image;
      const currentAvatars = (community.memberAvatars as string[]) || [];
      const updatedAvatars = userAvatar && !currentAvatars.includes(userAvatar)
        ? [...currentAvatars.slice(0, 2), userAvatar].slice(0, 3)
        : currentAvatars;

      await prisma.community.update({
        where: { id: communityId },
        data: {
          memberCount: {
            increment: 1
          },
          memberAvatars: updatedAvatars
        }
      });

      // Create notification for the requester
      await prisma.notification.create({
        data: {
          userId: requesterId,
          title: 'Join Request Approved',
          message: `Your request to join ${community.name} has been approved!`,
          type: 'CUSTOM',
          data: {
            communityId: community.id,
            communityName: community.name,
            type: 'COMMUNITY_JOIN_APPROVED'
          },
          isRead: false,
        }
      });
    } else {
      // Reject - just delete the notification and notify the user
      await prisma.notification.create({
        data: {
          userId: requesterId,
          title: 'Join Request Rejected',
          message: `Your request to join ${community.name} has been rejected.`,
          type: 'CUSTOM',
          data: {
            communityId: community.id,
            communityName: community.name,
            type: 'COMMUNITY_JOIN_REJECTED'
          },
          isRead: false,
        }
      });
    }

    // Delete the join request notification
    await prisma.notification.delete({
      where: { id: requestId }
    });

    return NextResponse.json({
      message: `Join request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      success: true
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error processing join request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

