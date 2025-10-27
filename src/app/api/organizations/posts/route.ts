import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const where = organizationId ? { organizationId } : {};

    // TODO: Fix OrganizationPost model access issue
    const posts: any[] = [];
    
    // Commented out due to schema issue:
    /*
    const posts = await prisma.organizationPost.findMany({
      where,
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
          orderBy: { createdAt: 'desc' },
          take: 5
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
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });
    */

    return NextResponse.json({
      posts,
      hasMore: posts.length === limit
    });

  } catch (error) {
    console.error('Error fetching organization posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      content,
      postType = 'UPDATE',
      images = [],
      videos = [],
      eventId,
      location,
      sdgs = [],
      tags = [],
      hoursReported,
      peopleReached,
      volunteersCount,
      visibility = 'PUBLIC',
      isPinned = false,
      scheduledFor
    } = body;

    // Verify user is admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: session.user.id,
        status: 'active',
        role: { in: ['admin', 'owner'] }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to post for this organization' },
        { status: 403 }
      );
    }

    // TODO: Fix OrganizationPost model access issue
    const post = null;
    
    /*
    const post = await prisma.organizationPost.create({
      data: {
        organizationId,
        authorId: session.user.id,
        content,
        postType,
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
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
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
    */

    return NextResponse.json(post, { status: 201 });

  } catch (error) {
    console.error('Error creating organization post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
