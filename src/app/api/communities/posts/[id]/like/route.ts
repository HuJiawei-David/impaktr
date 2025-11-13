import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST /api/communities/posts/[id]/like - Toggle like on a community post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if post exists and get community
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        community: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is a member of the community
    if (post.community.members.length === 0) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      );
    }

    // Check if user already liked this post
    const existingLike = await prisma.communityPostLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id
        }
      }
    });

    if (existingLike) {
      // Unlike: delete the like
      await prisma.communityPostLike.delete({
        where: { id: existingLike.id }
      });

      // Get updated like count
      const likeCount = await prisma.communityPostLike.count({
        where: { postId: id }
      });

      return NextResponse.json({
        liked: false,
        count: likeCount,
        message: 'Post unliked'
      });
    } else {
      // Like: create the like record
      await prisma.communityPostLike.create({
        data: {
          postId: id,
          userId: session.user.id
        }
      });

      // Get updated like count
      const likeCount = await prisma.communityPostLike.count({
        where: { postId: id }
      });

      return NextResponse.json({
        liked: true,
        count: likeCount,
        message: 'Post liked'
      });
    }

  } catch (error) {
    console.error('Error toggling like:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      { error: errorMessage, details: errorStack },
      { status: 500 }
    );
  }
}

