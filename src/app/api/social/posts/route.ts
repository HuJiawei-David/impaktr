import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { uploadToS3 } from '@/lib/aws';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const createPostSchema = z.object({
  content: z.string().max(2000).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'EVENT', 'POLL', 'ANNOUNCEMENT']).default('TEXT'),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS_ONLY', 'MEMBERS_ONLY']).default('PUBLIC'),
  location: z.string().optional(),
  tags: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const validatedData = createPostSchema.parse({
      content: formData.get('content'),
      type: formData.get('type'),
      visibility: formData.get('visibility'),
      location: formData.get('location'),
      tags: formData.get('tags'),
    });

    // Handle file uploads
    const mediaUrls: string[] = [];
    const files = formData.getAll('media') as File[];
    
    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `posts/${session.user.id}/${Date.now()}-${file.name}`;
        const url = await uploadToS3(buffer, fileName, file.type);
        mediaUrls.push(url);
      }
    }

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        content: validatedData.content || '',
        type: validatedData.type,
        visibility: validatedData.visibility,
        tags: validatedData.tags ? JSON.parse(validatedData.tags) : [],
        location: validatedData.location,
        mediaUrls,
        imageUrl: mediaUrls[0] || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            tier: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      }
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

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

    const where: Prisma.PostWhereInput = {};

    // Apply filters
    if (achievementsOnly) {
      where.type = {
        in: ['TEXT', 'IMAGE']
      };
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { organization: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (filter === 'following') {
      // Get posts from users and organizations that current user follows
      const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true, followingOrgId: true }
      });
      
      where.OR = [
        { userId: { in: following.map((f: { followingId: string | null }) => f.followingId).filter(Boolean) as string[] } },
        { organizationId: { in: following.map((f: { followingOrgId: string | null }) => f.followingOrgId).filter(Boolean) as string[] } }
      ];
    }

    const posts = await prisma.post.findMany({
      where,
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
        likes: {
          where: { userId: session.user.id }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        _count: {
          select: {
            likes: true,
            comments: true,
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
      content: post.content,
      type: post.type,
      visibility: post.visibility,
      tags: post.tags,
      location: post.location,
      sdg: post.sdg,
      mediaUrls: post.mediaUrls,
      imageUrl: post.imageUrl,
      isPinned: post.isPinned,
      createdAt: post.createdAt,
      author: {
        id: post.user?.id || post.organization?.id,
        name: post.user?.name || post.organization?.name,
        avatar: post.user?.image || post.organization?.logo,
        type: post.user ? 'user' : 'organization',
        tier: post.user?.tier || post.organization?.tier,
      },
      stats: {
        likes: post._count.likes,
        comments: post._count.comments,
      },
      isLiked: post.likes.length > 0,
      recentComments: post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.user.id,
          name: comment.user.name,
          avatar: comment.user.image,
        }
      }))
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}