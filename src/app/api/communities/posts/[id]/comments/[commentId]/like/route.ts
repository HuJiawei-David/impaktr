import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST /api/communities/posts/[id]/comments/[commentId]/like - Toggle like on a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId, commentId } = await params;

    // Check if comment exists and get post/community
    const comment = await prisma.communityPostComment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          include: {
            community: {
              include: {
                members: {
                  where: { userId: session.user.id }
                }
              }
            }
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Verify comment belongs to the post
    if (comment.postId !== postId) {
      return NextResponse.json(
        { error: 'Comment does not belong to this post' },
        { status: 400 }
      );
    }

    // Check if user is a member of the community
    if (comment.post.community.members.length === 0) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      );
    }

    // Check if user already liked this comment
    const existingLike = await prisma.communityPostCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: commentId,
          userId: session.user.id
        }
      }
    });

    if (existingLike) {
      // Unlike: delete the like
      await prisma.communityPostCommentLike.delete({
        where: { id: existingLike.id }
      });

      // Decrement likes count
      await prisma.communityPostComment.update({
        where: { id: commentId },
        data: {
          likes: {
            decrement: 1
          }
        }
      });

      // Get updated like count
      const likeCount = await prisma.communityPostCommentLike.count({
        where: { commentId: commentId }
      });

      return NextResponse.json({
        liked: false,
        count: likeCount,
        message: 'Comment unliked'
      });
    } else {
      // Like: create the like record
      await prisma.communityPostCommentLike.create({
        data: {
          commentId: commentId,
          userId: session.user.id
        }
      });

      // Increment likes count
      await prisma.communityPostComment.update({
        where: { id: commentId },
        data: {
          likes: {
            increment: 1
          }
        }
      });

      // Get updated like count
      const likeCount = await prisma.communityPostCommentLike.count({
        where: { commentId: commentId }
      });

      return NextResponse.json({
        liked: true,
        count: likeCount,
        message: 'Comment liked'
      });
    }

  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

