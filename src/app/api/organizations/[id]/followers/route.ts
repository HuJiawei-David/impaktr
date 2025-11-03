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

    // Get followers with user details and organization memberships
    const followers = await prisma.follow.findMany({
      where: {
        followingOrgId: organizationId,
      },
      include: {
        follower: {
          include: {
            organizationMemberships: {
              where: {
                status: 'active'
              },
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    tier: true
                  }
                }
              },
              take: 1, // Get first active membership
              orderBy: {
                joinedAt: 'desc'
              }
            }
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

    // Format the response - use organization tier if user is an organization member
    const formattedFollowers = followers.map(follow => {
      const user = follow.follower;
      const orgMembership = user.organizationMemberships?.[0];
      
      // If user is an organization member, use organization tier, otherwise use individual tier
      const displayTier = orgMembership?.organization?.tier || user.tier || 'HELPER';
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        userType: user.userType,
        bio: null,
        location: null,
        sdgFocus: [],
        tier: displayTier,
        followedAt: follow.createdAt,
      };
    });

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
