import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const createPostSchema = z.object({
  communityId: z.string().min(1),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['TEXT', 'IMAGE', 'EVENT', 'POLL', 'ANNOUNCEMENT']).default('TEXT'),
  imageUrl: z.string().url().optional(),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  isPinned: z.boolean().optional().default(false),
});

const querySchema = z.object({
  communityId: z.string().min(1),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

// GET /api/communities/posts - Get community posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { communityId, page, limit } = querySchema.parse(params);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Check if user is member of community
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: session.user.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      );
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: { communityId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              impactScore: true,
              tier: true,
            }
          },
          community: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take,
      }),
      prisma.communityPost.count({ where: { communityId } })
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching community posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/communities/posts - Create community post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createPostSchema.parse(body);

    // Check if user is member of community
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: data.communityId,
          userId: session.user.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      );
    }

    // Check if user can pin posts (admin/moderator only)
    if (data.isPinned && !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to pin posts' },
        { status: 403 }
      );
    }

    const post = await prisma.communityPost.create({
      data: {
        ...data,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            impactScore: true,
            tier: true,
          }
        },
        community: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Update community post count
    await prisma.community.update({
      where: { id: data.communityId },
      data: {
        postCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      post
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating community post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

