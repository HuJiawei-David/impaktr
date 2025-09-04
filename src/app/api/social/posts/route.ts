//home/ubuntu/impaktrweb/src/app/api/social/posts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { uploadToS3 } from '@/lib/aws';
import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().max(2000).optional(),
  type: z.enum(['general', 'achievement', 'event_share']).default('general'),
  location: z.string().optional(),
  tags: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all';
    const search = url.searchParams.get('search') || '';
    const achievementsOnly = url.searchParams.get('achievements_only') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let where: any = {};

    // Apply filters
    if (achievementsOnly) {
      where.type = {
        in: ['badge_earned', 'achievement', 'rank_up', 'event_joined']
      };
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { user: { profile: { displayName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    if (filter === 'following') {
      // Get posts from users that current user follows
      const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true }
      });
      
      where.userId = {
        in: following.map(f => f.followingId)
      };
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
          }
        },
        likes: {
          where: { userId: session.user.id }
        },
        comments: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true
          }
        },
        badge: {
          select: {
            id: true,
            name: true,
            sdgNumber: true,
            tier: true,
            icon: true
          }
        },
        achievement: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      },
      orderBy: filter === 'trending' ? 
        [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }] :
        { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      type: post.type,
      content: post.content,
      images: post.images,
      author: {
        id: post.user.id,
        name: post.user.profile?.displayName || 'Unknown User',
        avatar: post.user.profile?.avatar || '',
        rank: post.user.currentRank,
        organization: post.user.profile?.organization
      },
      createdAt: post.createdAt,
      likes: post._count.likes,
      comments: post._count.comments,
      shares: post._count.shares,
      isLiked: post.likes.length > 0,
      isBookmarked: false, // Would need to implement bookmarks
      recentComments: post.comments.slice(0, 2).map(comment => ({
        id: comment.id,
        content: comment.content,
        author: {
          id: comment.user.id,
          name: comment.user.profile?.displayName || 'Unknown User',
          avatar: comment.user.profile?.avatar || ''
        },
        createdAt: comment.createdAt
      })),
      // Additional fields based on post type
      ...(post.event && {
        eventId: post.event.id,
        eventTitle: post.event.title,
        eventDate: post.event.startDate,
        eventLocation: typeof post.event.location === 'object' && post.event.location !== null 
          ? (post.event.location as any)?.address || (post.event.location as any)?.city || 'Virtual'
          : 'Location not specified'
      }),
      ...(post.badge && {
        badgeId: post.badge.id,
        badgeName: post.badge.name,
        sdgNumber: post.badge.sdgNumber,
        badgeTier: post.badge.tier,
        badgeIcon: post.badge.icon
      }),
      ...(post.achievement && {
        achievementId: post.achievement.id,
        achievementName: post.achievement.name,
        achievementDescription: post.achievement.description,
        achievementIcon: post.achievement.icon
      })
    }));

    return NextResponse.json({ posts: formattedPosts });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const content = formData.get('content') as string;
    const type = formData.get('type') as string;
    const location = formData.get('location') as string;
    const tagsString = formData.get('tags') as string;

    const validatedData = createPostSchema.parse({
      content: content || undefined,
      type: type as any,
      location: location || undefined,
      tags: tagsString
    });

    if (!validatedData.content?.trim() && !formData.get('image_0')) {
      return NextResponse.json({ error: 'Post content or image required' }, { status: 400 });
    }

    // Handle image uploads
    const images: string[] = [];
    for (let i = 0; i < 4; i++) {
      const image = formData.get(`image_${i}`) as File;
      if (image) {
        const buffer = await image.arrayBuffer();
        const s3Key = `posts/${session.user.id}/${Date.now()}-${i}.${image.name.split('.').pop()}`;
        const imageUrl = await uploadToS3(Buffer.from(buffer), s3Key, image.type);
        images.push(imageUrl);
      }
    }

    // Parse tags
    const tags = validatedData.tags ? JSON.parse(validatedData.tags) : [];

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        type: validatedData.type,
        content: validatedData.content,
        images,
        location: validatedData.location,
        tags,
      },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Post created successfully',
      post: {
        id: post.id,
        type: post.type,
        content: post.content,
        images: post.images,
        author: {
          id: post.user.id,
          name: post.user.profile?.displayName || 'Unknown User',
          avatar: post.user.profile?.avatar || '',
          rank: post.user.currentRank
        },
        createdAt: post.createdAt,
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
        isLiked: false,
        isBookmarked: false
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}