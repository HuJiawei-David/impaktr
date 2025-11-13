import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/communities/posts/[id]/likes - Get all users who liked a post
export async function GET(
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

    // Get all likes with user information
    const likes = await prisma.communityPostLike.findMany({
      where: { postId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      likes: likes.map(like => ({
        id: like.id,
        userId: like.user.id,
        userName: like.user.name || 'Unknown',
        userImage: like.user.image,
        createdAt: like.createdAt.toISOString()
      })),
      total: likes.length
    });

  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

