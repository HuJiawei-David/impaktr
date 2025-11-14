import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const updateMemberRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']),
});

const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1),
});

// GET /api/communities/[id]/members - Get all members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is member
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      }
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      );
    }

    const members = await prisma.communityMember.findMany({
      where: { communityId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            impactScore: true,
            tier: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' }
      ]
    });

    return NextResponse.json({ members });

  } catch (error) {
    console.error('Error fetching community members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/communities/[id]/members - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateMemberRoleSchema.parse(body);

    // Check if requester is owner or admin
    const requesterMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      }
    });

    if (!requesterMembership || !['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can manage roles.' },
        { status: 403 }
      );
    }

    // Check if target user is a member
    const targetMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: data.userId
        }
      }
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this community' },
        { status: 404 }
      );
    }

    // Only owner can assign/remove OWNER role
    if (data.role === 'OWNER' && requesterMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can assign ownership' },
        { status: 403 }
      );
    }

    // Only owner can change owner's role
    if (targetMembership.role === 'OWNER' && requesterMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can change the owner\'s role' },
        { status: 403 }
      );
    }

    // Update member role
    await prisma.communityMember.update({
      where: {
        communityId_userId: {
          communityId: id,
          userId: data.userId
        }
      },
      data: {
        role: data.role
      }
    });

    return NextResponse.json({ success: true, message: 'Member role updated' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/[id]/members - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Check if requester is owner or admin
    const requesterMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      }
    });

    if (!requesterMembership || !['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can remove members.' },
        { status: 403 }
      );
    }

    // Check if target user is a member
    const targetMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: userId
        }
      },
      include: {
        user: {
          select: {
            image: true
          }
        }
      }
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this community' },
        { status: 404 }
      );
    }

    // Cannot remove owner
    if (targetMembership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove the owner. Transfer ownership first.' },
        { status: 400 }
      );
    }

    // Only owner can remove admins
    if (targetMembership.role === 'ADMIN' && requesterMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can remove admins' },
        { status: 403 }
      );
    }

    // Remove membership
    await prisma.communityMember.delete({
      where: {
        communityId_userId: {
          communityId: id,
          userId: userId
        }
      }
    });

    // Update community member count
    const memberCount = await prisma.communityMember.count({
      where: { communityId: id }
    });

    // Update memberAvatars if needed
    const community = await prisma.community.findUnique({
      where: { id },
      select: { memberAvatars: true }
    });

    const currentAvatars = (community?.memberAvatars as string[]) || [];
    const userAvatar = targetMembership.user.image;
    const updatedAvatars = userAvatar && currentAvatars.includes(userAvatar)
      ? currentAvatars.filter(avatar => avatar !== userAvatar)
      : currentAvatars;

    await prisma.community.update({
      where: { id },
      data: {
        memberCount,
        memberAvatars: updatedAvatars
      }
    });

    return NextResponse.json({ success: true, message: 'Member removed' });

  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

