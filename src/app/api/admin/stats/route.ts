// home/ubuntu/impaktrweb/src/app/api/admin/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = session.user['https://impaktr.com/roles']?.includes('admin') || 
                   session.user.email === 'admin@impaktr.com' ||
                   session.user.email?.endsWith('@impaktr.com');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel queries for better performance
    const [
      totalUsers,
      thisMonthUsers,
      lastMonthUsers,
      totalOrganizations,
      thisMonthOrgs,
      lastMonthOrgs,
      totalEvents,
      totalHours,
      activeSubscriptions,
      pendingVerifications,
      recentActivity
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // This month users
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Last month users
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Total organizations
      prisma.organization.count(),
      
      // This month organizations
      prisma.organization.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Last month organizations
      prisma.organization.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Total events
      prisma.event.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      
      // Total impact hours
      prisma.participation.aggregate({
        where: {
          status: 'VERIFIED'
        },
        _sum: {
          hoursActual: true
        }
      }),
      
      // Active subscriptions (mock data - you'd get this from Stripe)
      prisma.user.count({
        where: {
          // subscriptionStatus: 'active' // Add this field to your schema
        }
      }),
      
      // Pending verifications
      prisma.verification.count({
        where: {
          status: 'PENDING'
        }
      }),
      
      // Recent activity (last 24 hours)
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          profile: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    // Calculate growth rates
    const userGrowthRate = lastMonthUsers > 0 
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
      : 0;
      
    const orgGrowthRate = lastMonthOrgs > 0 
      ? ((thisMonthOrgs - lastMonthOrgs) / lastMonthOrgs) * 100 
      : 0;

    // Mock revenue data (you'd get this from Stripe)
    const monthlyRevenue = 45230; // This would come from Stripe

    const stats = {
      totalUsers,
      totalOrganizations,
      totalEvents,
      totalHours: totalHours._sum.hoursActual || 0,
      monthlyRevenue,
      activeSubscriptions,
      pendingVerifications,
      systemHealth: 98.7, // This would come from your monitoring system
      userGrowthRate,
      orgGrowthRate,
      recentActivity: recentActivity.map((user: any) => ({
        id: user.id,
        type: 'user_signup',
        name: user.profile?.displayName || `${user.profile?.firstName} ${user.profile?.lastName}`.trim() || 'Unknown User',
        timestamp: user.createdAt,
        userType: user.userType
      }))
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}