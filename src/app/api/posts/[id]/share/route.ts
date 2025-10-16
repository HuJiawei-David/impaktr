import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user already shared this post
    const existingShare = await prisma.share.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    });

    if (existingShare) {
      return NextResponse.json({ error: 'Post already shared' }, { status: 400 });
    }

    // Create share relationship
    const share = await prisma.share.create({
      data: {
        postId,
        userId: session.user.id,
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                tier: true,
              }
            },
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
                tier: true,
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                shares: true,
                saves: true,
              }
            }
          }
        }
      }
    });

    // Notify the original author
    const authorId = post.userId || post.organizationId;
    if (authorId) {
      await prisma.notification.create({
        data: {
          userId: authorId,
          type: 'SYSTEM',
          title: 'Post Shared',
          message: `${session.user.name} shared your post`,
          data: {
            postId,
            sharedBy: session.user.id,
          }
        }
      });
    }

    return NextResponse.json({ share });
  } catch (error) {
    console.error('Error sharing post:', error);
    return NextResponse.json({ error: 'Failed to share post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Check if share relationship exists
    const share = await prisma.share.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    });

    if (!share) {
      return NextResponse.json({ error: 'Post not shared' }, { status: 400 });
    }

    await prisma.share.delete({
      where: { id: share.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsharing post:', error);
    return NextResponse.json({ error: 'Failed to unshare post' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Check if user has shared this post
    const share = await prisma.share.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({ isShared: !!share });
  } catch (error) {
    console.error('Error checking share status:', error);
    return NextResponse.json({ error: 'Failed to check share status' }, { status: 500 });
  }
}
