import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const updateCommunitySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  sdgFocus: z.array(z.number().min(1).max(17)).optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).optional(),
  tags: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  location: z.string().optional(),
  locationData: z.object({
    country: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
  }).optional(),
  language: z.string().optional(),
  whoShouldJoin: z.string().nullable().optional(),
  whatWeDo: z.string().nullable().optional(),
});

// GET /api/communities/[id] - Get community details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                impactScore: true,
                tier: true,
              }
            }
          },
          orderBy: { joinedAt: 'desc' },
          take: 20
        },
        moderators: {
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
        posts: {
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
          take: 10
        },
        resources: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            members: true,
            posts: true,
            resources: true,
          }
        }
      }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Check if user is member
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      }
    });

    // Check if user is moderator
    const userModeration = await prisma.communityModerator.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      }
    });

    // Map privacy enum to isPublic boolean
    const isPublic = community.privacy === 'PUBLIC';

    return NextResponse.json({
      community: {
        ...community,
        memberCount: community._count.members,
        postCount: community._count.posts,
        resourceCount: community._count.resources,
        isJoined: !!userMembership,
        userRole: userMembership?.role || null,
        isModerator: !!userModeration,
        moderatorRole: userModeration?.role || null,
        isPublic,
        _count: undefined,
      }
    });

  } catch (error) {
    console.error('Error fetching community:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/communities/[id] - Update community
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateCommunitySchema.parse(body);

    // Check if user is owner or admin
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      }
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Build update data, excluding location (we use locationData instead)
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Add fields that are valid Prisma fields
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.privacy !== undefined) updateData.privacy = data.privacy;
    if (data.language !== undefined) updateData.language = data.language || null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.rules !== undefined) updateData.rules = data.rules;
    if (data.sdgFocus !== undefined) updateData.sdgFocus = data.sdgFocus;
    // Convert empty strings to null for optional fields
    if (data.whoShouldJoin !== undefined) updateData.whoShouldJoin = data.whoShouldJoin?.trim() || null;
    if (data.whatWeDo !== undefined) updateData.whatWeDo = data.whatWeDo?.trim() || null;

    // Handle locationData separately
    if (data.locationData) {
      updateData.locationData = data.locationData;
      // Also update location string if locationData is provided
      const locationParts = [
        data.locationData.city,
        data.locationData.state,
        data.locationData.country
      ].filter(Boolean);
      if (locationParts.length > 0) {
        updateData.location = locationParts.join(', ');
      }
    } else if (data.location !== undefined) {
      // Fallback to location string if locationData is not provided
      updateData.location = data.location;
    }

    const community = await prisma.community.update({
      where: { id },
      data: updateData,
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
            resources: true,
          }
        }
      }
    });

    return NextResponse.json({
      community: {
        ...community,
        memberCount: community._count.members,
        postCount: community._count.posts,
        resourceCount: community._count.resources,
        _count: undefined,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating community:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/[id] - Delete community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is owner
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      }
    });

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can delete the community' },
        { status: 403 }
      );
    }

    await prisma.community.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting community:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}