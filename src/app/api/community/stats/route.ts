// home/ubuntu/impaktrweb/src/app/api/community/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get community stats
    const [
      totalMembers,
      totalPosts,
      activeToday,
      recentPosts
    ] = await Promise.all([
      prisma.user.count({
        where: { userType: 'INDIVIDUAL' }
      }),
      prisma.post.count(),
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.post.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          likes: true,
          comments: true
        },
        take: 100
      })
    ]);

    // Calculate engagement rate
    const totalEngagements = recentPosts.reduce((sum, post) => {
      return sum + post.likes.length + post.comments.length;
    }, 0);
    const engagement = recentPosts.length > 0 ? 
      Math.round((totalEngagements / recentPosts.length) * 10) : 0;

    // Find most common SDG (mock data for now)
    const topSDG = 13; // Climate Action - would be calculated from posts

    // New members this week
    const newMembers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const stats = {
      totalMembers,
      totalPosts,
      activeToday,
      topSDG,
      engagement,
      newMembers
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching community stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}