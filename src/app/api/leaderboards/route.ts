// home/ubuntu/impaktrweb/src/app/api/leaderboards/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const leaderboardQuerySchema = z.object({
  type: z.enum(['individuals', 'organizations', 'countries']).default('individuals'),
  period: z.enum(['all_time', 'yearly', 'monthly']).default('all_time'),
  sdg: z.string().transform((str) => parseInt(str)).optional(),
  country: z.string().optional(),
  limit: z.string().transform((str) => parseInt(str)).default('50'),
  page: z.string().transform((str) => parseInt(str)).default('1'),
});

interface RankingEntry {
  rank: number;
  id?: string;
  name: string;
  avatar?: string | null;
  logo?: string | null;
  location?: string | null;
  score: number;
  rank_title?: string;
  tier?: string;
  type?: string | null;
  badges?: Array<{
    sdg: string;
    tier: string;
    name: string;
    progress: number;
    earned: boolean;
  }>;
  stats?: Record<string, number>;
  country?: string;
  user_count?: number;
  avg_score?: number;
  total_score?: number;
  total_events?: number;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { type, period, sdg, country, limit, page } = leaderboardQuerySchema.parse(params);

    const skip = (page - 1) * limit;

    let rankings: RankingEntry[] = [];
    let total = 0;
    let currentUserRanking: RankingEntry | undefined = undefined;

    // Get current user for individual leaderboards
    const session = await getServerSession(authOptions);

    if (type === 'individuals') {
      // Individual leaderboard
      const where: Prisma.UserWhereInput = {};
      
      if (country) {
        where.country = {
          contains: country,
          mode: 'insensitive'
        };
      }

      // For SDG-specific leaderboard, filter by badge progress
      if (sdg) {
        where.badges = {
          some: {
            badge: {
              category: sdg.toString(), // Convert number to string for category field
            }
            // earnedAt has a default value and is not nullable, so no filter needed
          }
        };
      }

      // Apply period filter for score calculation
      let scoreFilter: Prisma.UserWhereInput = {};
      if (period === 'yearly') {
        const startOfYear = new Date();
        startOfYear.setMonth(0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        scoreFilter = {
          scoreHistory: {
            some: {
              createdAt: {
                gte: startOfYear,
              }
            }
          }
        };
      } else if (period === 'monthly') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        scoreFilter = {
          scoreHistory: {
            some: {
              createdAt: {
                gte: startOfMonth,
              }
            }
          }
        };
      }

      const users = await prisma.user.findMany({
        where: {
          ...where,
          ...scoreFilter,
        },
        include: {
          badges: {
            include: {
              badge: true,
            },
            where: sdg ? {
              badge: {
                category: { equals: sdg.toString() },
              }
            } : undefined,
          },
          _count: {
            select: {
              participations: {
                where: { status: 'VERIFIED' }
              },
            }
          }
        },
        orderBy: { impactScore: 'desc' },
        skip,
        take: limit,
      });

      total = await prisma.user.count({
        where: {
          ...where,
          ...scoreFilter,
        }
      });

      type UserWithRelations = typeof users[0];
      
      rankings = users.map((user: UserWithRelations, index) => ({
        rank: skip + index + 1,
        id: user.id,
        name: user.name || 'Anonymous User',
        avatar: user.image,
        location: user.location,
        score: user.impactScore,
        rank_title: user.tier,
        badges: user.badges?.map((ub) => ({
          sdg: ub.badge.category,
          tier: ub.badge.rarity,
          name: ub.badge.name,
          progress: 100, // Default progress since we don't have this field
          earned: !!ub.earnedAt,
        })),
        stats: {
          verified_hours: user._count?.participations || 0,
          certificates: 0,
        }
      }));

      // Find current user's ranking if logged in
      if (session?.user?.id) {
        const currentUserIndex = rankings.findIndex(r => r.id === session.user.id);
        if (currentUserIndex !== -1) {
          currentUserRanking = rankings[currentUserIndex];
        } else {
          // Current user not in current page, fetch their ranking separately
          const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
              badges: {
                include: { badge: true },
                where: sdg ? {
                  badge: { category: sdg.toString() }
                } : undefined,
              },
              _count: {
                select: {
                  participations: { where: { status: 'VERIFIED' } }
                }
              }
            }
          });

          if (currentUser) {
            // Calculate their rank by counting users with higher scores
            const higherScoreCount = await prisma.user.count({
              where: {
                ...where,
                ...scoreFilter,
                impactScore: { gt: currentUser.impactScore }
              }
            });

            currentUserRanking = {
              rank: higherScoreCount + 1,
              id: currentUser.id,
              name: currentUser.name || 'Anonymous User',
              avatar: currentUser.image,
              location: currentUser.location,
              score: currentUser.impactScore,
              rank_title: currentUser.tier,
              badges: currentUser.badges?.map((ub) => ({
                sdg: ub.badge.category,
                tier: ub.badge.rarity,
                name: ub.badge.name,
                progress: 100,
                earned: !!ub.earnedAt,
              })),
              stats: {
                verified_hours: currentUser._count?.participations || 0,
                certificates: 0,
              }
            };
          }
        }
      }
    } else if (type === 'organizations') {
      // Organization leaderboard
      const where: Prisma.OrganizationWhereInput = {};

      if (country) {
        // Filter by organization country
        where.country = country;
      }

      const organizations = await prisma.organization.findMany({
        where,
        include: {
          corporateBadges: {
            include: {
              badge: true,
            },
            where: sdg ? {
              badge: {
                category: { equals: sdg.toString() },
              }
            } : undefined,
          },
          members: true,
          events: {
            where: {
              status: 'COMPLETED',
            }
          },
        },
        orderBy: { esgScore: 'desc' },
        skip,
        take: limit,
      });

      total = await prisma.organization.count({ where });

      type OrgWithRelations = typeof organizations[0];

      rankings = organizations.map((org: OrgWithRelations, index) => ({
        rank: skip + index + 1,
        id: org.id,
        name: org.name,
        type: org.type,
        logo: org.logo,
        score: org.esgScore || 0,
        tier: org.subscriptionTier,
        badges: org.corporateBadges?.map((ob) => ({
          sdg: ob.badge.category,
          tier: ob.badge.tier,
          name: ob.badge.name,
          progress: 100, // Default progress
          earned: !!ob.earnedAt,
        })),
        stats: {
          members: org.members?.length || 0,
          events: org.events?.length || 0,
        }
      }));
    } else if (type === 'countries') {
      // Country leaderboard - aggregate by country
      interface CountryRow {
        country: string;
        user_count: bigint;
        avg_score: number;
        total_score: number;
        total_events: bigint;
      }
      
      const result = await prisma.$queryRaw<CountryRow[]>`
        SELECT 
          users.country as country,
          COUNT(DISTINCT users.id) as user_count,
          AVG(users."impactScore") as avg_score,
          SUM(users."impactScore") as total_score,
          COUNT(DISTINCT p.id) as total_events
        FROM users
        LEFT JOIN participations p ON users.id = p."userId" AND p.status = 'VERIFIED'
        WHERE users.country IS NOT NULL
        GROUP BY users.country
        ORDER BY total_score DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      rankings = result.map((row, index) => ({
        rank: skip + index + 1,
        name: row.country, // Use country as name for country leaderboards
        score: Number(row.total_score), // Use total_score as the main score
        country: row.country,
        user_count: Number(row.user_count),
        avg_score: Number(row.avg_score),
        total_score: Number(row.total_score),
        total_events: Number(row.total_events),
      }));

      total = rankings.length; // This is approximate
    }

    // Return different structure based on type
    if (type === 'individuals') {
      return NextResponse.json({
        type,
        period,
        sdg,
        country,
        users: rankings,
        currentUser: currentUserRanking,
        totalUsers: total,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } else {
      return NextResponse.json({
        type,
        period,
        sdg,
        country,
        rankings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}