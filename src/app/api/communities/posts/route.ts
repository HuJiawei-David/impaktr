import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { uploadToS3 } from '@/lib/aws';
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

    // Get roles for all post authors
    const userIds = [...new Set(posts.map(post => post.userId))];
    const memberships = await prisma.communityMember.findMany({
      where: {
        communityId,
        userId: { in: userIds }
      },
      select: {
        userId: true,
        role: true
      }
    });

    const roleMap = new Map(memberships.map(m => [m.userId, m.role]));

    // Get like counts and user's like status for all posts
    const postIds = posts.map(post => post.id);
    const likeCounts = await prisma.communityPostLike.groupBy({
      by: ['postId'],
      where: { postId: { in: postIds } },
      _count: { id: true }
    });

    const likeCountMap = new Map(likeCounts.map(l => [l.postId, l._count.id]));

    // Get user's likes for these posts
    const userLikes = session?.user?.id ? await prisma.communityPostLike.findMany({
      where: {
        postId: { in: postIds },
        userId: session.user.id
      },
      select: {
        postId: true
      }
    }) : [];

    const userLikedPostIds = new Set(userLikes.map(like => like.postId));

    // Get recent likes with user info for each post (first 5)
    const allLikes = await prisma.communityPostLike.findMany({
      where: { postId: { in: postIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Get more than needed, we'll group by post
    });

    // Group likes by postId and take first 5 for each
    const likesByPost = new Map<string, Array<{ id: string; name: string; image: string | null }>>();
    allLikes.forEach(like => {
      if (!likesByPost.has(like.postId)) {
        likesByPost.set(like.postId, []);
      }
      const postLikes = likesByPost.get(like.postId)!;
      if (postLikes.length < 5) {
        postLikes.push({
          id: like.user.id,
          name: like.user.name || 'Unknown',
          image: like.user.image
        });
      }
    });

    // Add role, like count, isLiked, and likedBy to each post
    const postsWithRoles = posts.map(post => ({
      ...post,
      user: {
        ...post.user,
        role: roleMap.get(post.userId) || null
      },
      likes: likeCountMap.get(post.id) || 0,
      isLiked: session?.user?.id ? userLikedPostIds.has(post.id) : false,
      likedBy: likesByPost.get(post.id) || []
    }));

    return NextResponse.json({
      posts: postsWithRoles,
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

    // Check if request has FormData (with files) or JSON
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let mediaUrls: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Handle file uploads
      const files = formData.getAll('media') as File[];
      for (const file of files) {
        if (file.size > 0) {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `community-posts/${formData.get('communityId')}/${Date.now()}-${file.name}`;
            const url = await uploadToS3(buffer, fileName, file.type);
            mediaUrls.push(url);
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        }
      }

      body = {
        communityId: formData.get('communityId'),
        content: formData.get('content'),
        type: formData.get('type') || 'TEXT',
        mediaUrls: mediaUrls,
        isPinned: formData.get('isPinned') === 'true',
      };
    } else {
      body = await request.json();
      mediaUrls = body.mediaUrls || [];
    }

    const data = createPostSchema.parse({
      ...body,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : body.mediaUrls || [],
    });

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

