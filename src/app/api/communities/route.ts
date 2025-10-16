import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadToS3 } from '@/lib/aws';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const createCommunitySchema = z.object({
  name: z.string().min(1, 'Community name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  sdgFocus: z.array(z.number().min(1).max(17)).optional().default([]),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PUBLIC'),
  tags: z.array(z.string()).optional().default([]),
  rules: z.array(z.string()).optional().default([]),
  location: z.string().optional(),
  language: z.string().optional(),
});

const querySchema = z.object({
  category: z.string().optional(),
  sdg: z.string().optional(),
  privacy: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

// GET /api/communities - List communities with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { category, sdg, privacy, search, page, limit } = querySchema.parse(params);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (sdg && sdg !== 'all') {
      where.sdgFocus = {
        has: parseInt(sdg)
      };
    }
    
    if (privacy && privacy !== 'all') {
      where.privacy = privacy;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          members: {
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            },
            take: 5,
            orderBy: { joinedAt: 'desc' }
          },
          posts: {
            select: {
              id: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              members: true,
              posts: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.community.count({ where })
    ]);

    // Check if user is member of each community
    const userId = session.user.id;
    const userMemberships = await prisma.communityMember.findMany({
      where: { userId },
      select: { communityId: true, role: true }
    });
    
    const membershipMap = new Map(
      userMemberships.map(m => [m.communityId, m.role])
    );

    const communitiesWithMembership = communities.map(community => ({
      ...community,
      memberCount: community._count.members,
      postCount: community._count.posts,
      recentActivity: community.posts.length > 0 
        ? `Last post ${new Date(community.posts[0].createdAt).toLocaleDateString()}`
        : `Created ${new Date(community.createdAt).toLocaleDateString()}`,
      isJoined: membershipMap.has(community.id),
      userRole: membershipMap.get(community.id) || null,
      _count: undefined,
    }));

    return NextResponse.json({
      communities: communitiesWithMembership,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/communities - Create new community
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Parse form data
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      privacy: formData.get('privacy') as string,
      location: formData.get('location') as string,
      language: formData.get('language') as string,
      sdgFocus: JSON.parse(formData.get('sdgFocus') as string || '[]'),
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      rules: JSON.parse(formData.get('rules') as string || '[]'),
    };

    const validatedData = createCommunitySchema.parse(data);

    // Check if community name already exists
    const existingCommunity = await prisma.community.findFirst({
      where: { name: data.name }
    });

    if (existingCommunity) {
      return NextResponse.json(
        { error: 'Community name already exists' },
        { status: 400 }
      );
    }

    // Handle avatar upload
    let avatarUrl: string | null = null;
    const avatarFile = formData.get('avatar') as File | null;
    
    if (avatarFile && avatarFile.size > 0) {
      try {
        const buffer = await avatarFile.arrayBuffer();
        const fileName = `community-avatars/${Date.now()}-${avatarFile.name}`;
        avatarUrl = await uploadToS3(buffer, fileName, avatarFile.type);
      } catch (error) {
        console.error('Error uploading avatar:', error);
        return NextResponse.json(
          { error: 'Failed to upload avatar' },
          { status: 500 }
        );
      }
    }

    const community = await prisma.community.create({
      data: {
        ...validatedData,
        avatar: avatarUrl,
        createdBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        _count: {
          select: {
            members: true,
            posts: true,
          }
        }
      }
    });

    // Add creator as owner
    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: session.user.id,
        role: 'OWNER'
      }
    });

    return NextResponse.json({
      community: {
        ...community,
        memberCount: 1,
        postCount: 0,
        isJoined: true,
        userRole: 'OWNER',
        _count: undefined,
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating community:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}