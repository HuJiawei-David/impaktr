import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    console.log('Fetching followers for organization:', organizationId);
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      console.log('Organization not found:', organizationId);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('Organization found:', organization.name);

    // Get followers with user details - just tier for rank badge
    const followers = await prisma.follow.findMany({
      where: {
        followingOrgId: organizationId,
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            userType: true,
            tier: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    console.log('Found followers:', followers.length);

    // Get total count for pagination
    const totalCount = await prisma.follow.count({
      where: {
        followingOrgId: organizationId,
      }
    });

    console.log('Total followers count:', totalCount);

    // Format the response - simple with just rank
    const formattedFollowers = followers.map(follow => ({
      id: follow.follower.id,
      name: follow.follower.name,
      email: follow.follower.email,
      image: follow.follower.image,
      userType: follow.follower.userType,
      bio: null,
      location: null,
      sdgFocus: [],
      tier: follow.follower.tier || 'HELPER',
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      followers: formattedFollowers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching followers:', error);
    console.error('Error details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
