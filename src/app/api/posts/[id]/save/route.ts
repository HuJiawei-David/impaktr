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

    // Check if user already saved this post
    const existingSave = await prisma.save.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    });

    if (existingSave) {
      return NextResponse.json({ error: 'Post already saved' }, { status: 400 });
    }

    // Create save relationship
    const save = await prisma.save.create({
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

    return NextResponse.json({ save });
  } catch (error) {
    console.error('Error saving post:', error);
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Check if save relationship exists
    const save = await prisma.save.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    });

    if (!save) {
      return NextResponse.json({ error: 'Post not saved' }, { status: 400 });
    }

    await prisma.save.delete({
      where: { id: save.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsaving post:', error);
    return NextResponse.json({ error: 'Failed to unsave post' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Check if user has saved this post
    const save = await prisma.save.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({ isSaved: !!save });
  } catch (error) {
    console.error('Error checking save status:', error);
    return NextResponse.json({ error: 'Failed to check save status' }, { status: 500 });
  }
}
