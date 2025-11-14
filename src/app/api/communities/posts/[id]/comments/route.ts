import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(1000),
  parentId: z.string().optional(),
});

// GET /api/communities/posts/[id]/comments - Get comments for a community post
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
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

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

    // Fetch comments with nested replies
    const comments = await prisma.communityPostComment.findMany({
      where: {
        postId: id,
        parentId: null // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            impactScore: true,
            tier: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                impactScore: true,
                tier: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get all user IDs from comments and replies
    const userIds = new Set<string>();
    comments.forEach(comment => {
      userIds.add(comment.userId);
      comment.replies.forEach(reply => {
        userIds.add(reply.userId);
      });
    });

    // Fetch roles for all comment/reply authors
    const memberships = await prisma.communityMember.findMany({
      where: {
        communityId: post.community.id,
        userId: { in: Array.from(userIds) }
      },
      select: {
        userId: true,
        role: true
      }
    });

    const roleMap = new Map(memberships.map(m => [m.userId, m.role]));

    // Get all comment IDs (including replies)
    const commentIds = new Set<string>();
    comments.forEach(comment => {
      commentIds.add(comment.id);
      comment.replies.forEach(reply => {
        commentIds.add(reply.id);
      });
    });

    // Get user's likes for these comments
    const userLikes = session?.user?.id ? await prisma.communityPostCommentLike.findMany({
      where: {
        commentId: { in: Array.from(commentIds) },
        userId: session.user.id
      },
      select: {
        commentId: true
      }
    }) : [];

    const userLikedCommentIds = new Set(userLikes.map(like => like.commentId));

    return NextResponse.json({
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: {
          id: comment.user.id,
          name: comment.user.name || 'Unknown',
          image: comment.user.image,
          impactScore: comment.user.impactScore || 0,
          tier: comment.user.tier || 'Contributor',
          role: roleMap.get(comment.userId) || null
        },
        likes: comment.likes,
        isLiked: session?.user?.id ? userLikedCommentIds.has(comment.id) : false,
        replies: comment.replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          user: {
            id: reply.user.id,
            name: reply.user.name || 'Unknown',
            image: reply.user.image,
            impactScore: reply.user.impactScore || 0,
            tier: reply.user.tier || 'Contributor',
            role: roleMap.get(reply.userId) || null
          },
          likes: reply.likes,
          isLiked: session?.user?.id ? userLikedCommentIds.has(reply.id) : false
        }))
      })),
      hasMore: comments.length === limit
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/communities/posts/[id]/comments - Create a comment on a community post
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
    const body = await request.json();
    const { content, parentId } = createCommentSchema.parse(body);

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

    // If replying to a comment, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.communityPostComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }

      // Verify parent comment belongs to the same post
      if (parentComment.postId !== id) {
        return NextResponse.json(
          { error: 'Parent comment does not belong to this post' },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.communityPostComment.create({
      data: {
        postId: id,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            impactScore: true,
            tier: true
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    // Get the user's role in the community
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: post.community.id,
          userId: session.user.id
        }
      },
      select: {
        role: true
      }
    });

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: {
        id: comment.user.id,
        name: comment.user.name || 'Unknown',
        image: comment.user.image,
        impactScore: comment.user.impactScore || 0,
        tier: comment.user.tier || 'Contributor',
        role: membership?.role || null
      },
      likes: comment.likes,
      replies: []
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

