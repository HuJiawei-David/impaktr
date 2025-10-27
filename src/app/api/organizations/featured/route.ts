import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '4');

    // Fetch real organizations from the database
    const organizations = await prisma.organization.findMany({
      include: {
        members: {
          select: {
            id: true,
            status: true
          }
        },
        followers: session?.user?.id ? {
          where: {
            followerId: session.user.id
          },
          select: {
            id: true
          }
        } : false,
        _count: {
          select: {
            members: true,
            events: true,
            posts: true,
            followers: true
          }
        }
      },
      orderBy: {
        esgScore: 'desc' // Order by ESG score to show top organizations
      },
      take: limit
    });

    // Map organizations to the format expected by the component
    const featuredOrganizations = organizations.map(org => {
      const activeMemberCount = org.members.filter(m => m.status === 'active').length;
      const memberDisplay = activeMemberCount >= 1000 
        ? `${(activeMemberCount / 1000).toFixed(1)}K` 
        : activeMemberCount.toString();
      
      // Determine focus based on industry
      let focus = 'General';
      if (org.industry) {
        const industryLower = org.industry.toLowerCase();
        if (industryLower.includes('environment') || industryLower.includes('sustainability')) {
          focus = 'Environment';
        } else if (industryLower.includes('education') || industryLower.includes('learning')) {
          focus = 'Education';
        } else if (industryLower.includes('health') || industryLower.includes('medical')) {
          focus = 'Healthcare';
        } else if (industryLower.includes('child') || industryLower.includes('youth')) {
          focus = 'Children';
        }
      }

      const location = [org.city, org.country].filter(Boolean).join(', ');

      return {
        id: org.id,
        name: org.name,
        members: memberDisplay,
        focus,
        description: org.description || `${org.name} is making a positive impact in the community`,
        isFollowing: session?.user?.id ? org.followers.length > 0 : false,
        logo: org.logo,
        impactScore: Math.round(org.esgScore || 0),
        location: location || 'Global',
        followerCount: org._count.followers
      };
    });

    return NextResponse.json({
      organizations: featuredOrganizations,
      total: featuredOrganizations.length
    });

  } catch (error) {
    console.error('Featured organizations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured organizations' },
      { status: 500 }
    );
  }
}
