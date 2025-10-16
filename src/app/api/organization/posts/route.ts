import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadToS3 } from '@/lib/aws';

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['TEXT', 'IMAGE', 'EVENT', 'POLL', 'ANNOUNCEMENT']).default('TEXT'),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS_ONLY', 'MEMBERS_ONLY']).default('PUBLIC'),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  sdg: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is part of an organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        status: 'active',
        role: { in: ['admin', 'owner'] }
      },
      include: {
        organization: true
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only organization admins can create posts' }, { status: 403 });
    }

    const formData = await request.formData();
    const validatedData = createPostSchema.parse({
      content: formData.get('content'),
      type: formData.get('type'),
      visibility: formData.get('visibility'),
      tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
      location: formData.get('location'),
      sdg: formData.get('sdg'),
    });

    // Handle file uploads
    const mediaUrls: string[] = [];
    const files = formData.getAll('media') as File[];
    
    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `posts/${membership.organizationId}/${Date.now()}-${file.name}`;
        const url = await uploadToS3(buffer, fileName, file.type);
        mediaUrls.push(url);
      }
    }

    const post = await prisma.post.create({
      data: {
        organizationId: membership.organizationId,
        content: validatedData.content,
        type: validatedData.type,
        visibility: validatedData.visibility,
        tags: validatedData.tags || [],
        location: validatedData.location,
        sdg: validatedData.sdg,
        mediaUrls,
        imageUrl: mediaUrls[0] || null,
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
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          }
        }
      }
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let where: any = {
      organizationId: organizationId ? { equals: organizationId } : undefined,
      type: type ? { equals: type } : undefined,
      isDeleted: false,
    };

    // Filter out posts user can't see based on visibility
    if (organizationId) {
      // Check if user is member of this organization
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: session.user.id,
          organizationId,
          status: 'active'
        }
      });

      if (!membership) {
        // User is not a member, only show public posts
        where.visibility = 'PUBLIC';
      }
    }

    const posts = await prisma.post.findMany({
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
        likes: {
          where: { userId: session.user.id }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
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
        id: post.organization?.id,
        name: post.organization?.name,
        avatar: post.organization?.logo,
        type: 'organization',
        tier: post.organization?.tier,
      },
      stats: {
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
      },
      isLiked: post.likes.length > 0,
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching organization posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
