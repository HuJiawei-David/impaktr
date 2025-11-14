import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const joinCommunitySchema = z.object({
  communityId: z.string().min(1),
});

// POST /api/communities/join - Join a community
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { communityId } = joinCommunitySchema.parse(body);

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
        { error: 'Already a member of this community' },
        { status: 400 }
      );
    }

    // Check privacy settings
    if (community.privacy === 'INVITE_ONLY') {
      // Check if user has a pending invitation
      const pendingInvitation = await prisma.communityInvitation.findFirst({
        where: {
          communityId,
          userId: session.user.id,
          status: 'PENDING',
          expiresAt: { gt: new Date() }
        }
      });

      if (!pendingInvitation) {
        return NextResponse.json(
          { error: 'This community is invite-only. You need an invitation to join.' },
          { status: 403 }
        );
      }
      // If invitation exists, allow join (invitation will be marked as accepted in the join process)
    }

    if (community.privacy === 'PRIVATE') {
      return NextResponse.json(
        { error: 'This community is private. Please request to join instead.' },
        { status: 403 }
      );
    }

    // If INVITE_ONLY, mark invitation as accepted
    if (community.privacy === 'INVITE_ONLY') {
      await prisma.communityInvitation.updateMany({
        where: {
          communityId,
          userId: session.user.id,
          status: 'PENDING'
        },
        data: {
          status: 'ACCEPTED'
        }
      });
    }

    // Create membership
    const membership = await prisma.communityMember.create({
      data: {
        communityId,
        userId: session.user.id,
        role: 'MEMBER'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            memberCount: true,
          }
        }
      }
    });

    // Get user's avatar
    const userAvatar = membership.user.image;
    
    // Update community member count and memberAvatars
    const currentAvatars = (community.memberAvatars as string[]) || [];
    const updatedAvatars = userAvatar && !currentAvatars.includes(userAvatar)
      ? [...currentAvatars.slice(0, 2), userAvatar].slice(0, 3) // Keep max 3 avatars
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

    return NextResponse.json({
      membership,
      message: 'Successfully joined community'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error joining community:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/leave - Leave a community
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

    // Check if user is a member
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: session.user.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 400 }
      );
    }

    // Check if user is owner
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Owner cannot leave the community. Transfer ownership or delete the community instead.' },
        { status: 400 }
      );
    }

    // Remove membership
    await prisma.communityMember.delete({
      where: {
        communityId_userId: {
          communityId,
          userId: session.user.id
        }
      }
    });

    // Update community member count
    await prisma.community.update({
      where: { id: communityId },
      data: {
        memberCount: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({
      message: 'Successfully left community'
    });

  } catch (error) {
    console.error('Error leaving community:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

