import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organizationId } = await params;
    const userId = session.user.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingOrgId: {
          followerId: userId,
          followingOrgId: organizationId,
        },
      },
    });

    if (existingFollow) {
      // User is following, so unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingOrgId: {
            followerId: userId,
            followingOrgId: organizationId,
          },
        },
      });

      return NextResponse.json({ 
        message: 'Successfully unfollowed organization',
        isFollowing: false 
      });
    } else {
      // User is not following, so follow
      await prisma.follow.create({
        data: {
          followerId: userId,
          followingOrgId: organizationId,
        },
      });

      return NextResponse.json({ 
        message: 'Successfully followed organization',
        isFollowing: true 
      });
    }

  } catch (error) {
    console.error('Error toggling follow status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
