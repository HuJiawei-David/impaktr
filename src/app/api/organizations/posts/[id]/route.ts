import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.organizationPost.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            tier: true,
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            imageUrl: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      content,
      images,
      videos,
      eventId,
      location,
      sdgs,
      tags,
      hoursReported,
      peopleReached,
      volunteersCount,
      visibility,
      isPinned
    } = body;

    // Check if user is the author or admin of the organization
    const post = await prisma.organizationPost.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                status: 'active',
                role: { in: ['admin', 'owner'] }
              }
            }
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isAuthor = post.authorId === session.user.id;
    const isAdmin = post.organization.members.length > 0;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to edit this post' },
        { status: 403 }
      );
    }

    const updatedPost = await prisma.organizationPost.update({
      where: { id },
      data: {
        content,
        images,
        videos,
        eventId,
        location,
        sdgs,
        tags,
        hoursReported,
        peopleReached,
        volunteersCount,
        visibility,
        isPinned,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            tier: true,
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            imageUrl: true,
          }
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          }
        }
      }
    });

    return NextResponse.json(updatedPost);

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if user is the author or admin of the organization
    const post = await prisma.organizationPost.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                status: 'active',
                role: { in: ['admin', 'owner'] }
              }
            }
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isAuthor = post.authorId === session.user.id;
    const isAdmin = post.organization.members.length > 0;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to delete this post' },
        { status: 403 }
      );
    }

    await prisma.organizationPost.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
