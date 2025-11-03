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
  localRank?: number | null;
  localTotal?: number | null;
  id?: string;
  name: string;
  image?: string | null;
  avatar?: string | null;
  logo?: string | null;
  location?: string | { city?: string; country?: string } | null;
  score?: number;
  impactScore?: number;
  volunteerHours?: number;
  eventsJoined?: number;
  badgesEarned?: number;
  rank_title?: string;
  tier?: string | { toString(): string };
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
      const where: Prisma.UserWhereInput = {
        userType: 'INDIVIDUAL', // Only show actual individual users, not organizations
      };
      
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

      let users: any[] = [];
      try {
        users = await prisma.user.findMany({
          where,
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
            participations: {
              where: { 
                status: { in: ['VERIFIED', 'ATTENDED'] } // Include both VERIFIED and ATTENDED statuses
              },
              include: {
                event: true,
              }
            },
            _count: {
              select: {
                participations: {
                  where: { status: { in: ['VERIFIED', 'ATTENDED'] } } // Include both statuses
                },
              }
            }
          },
          orderBy: { impactScore: 'desc' },
          skip,
          take: limit,
        });
      } catch (queryError) {
        console.error('Error fetching users for leaderboard:', queryError);
        console.error('Error details:', queryError instanceof Error ? queryError.message : String(queryError));
        // Return empty results rather than 500 error
        return NextResponse.json({
          type,
          period,
          sdg,
          country,
          users: [],
          currentUser: undefined,
          totalUsers: 0,
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }

      try {
        total = await prisma.user.count({ where });
      } catch (countError) {
        console.error('Error counting users for leaderboard:', countError);
        total = users.length; // Fallback to result count
      }

      type UserWithRelations = typeof users[0];
      
      // Calculate volunteer hours and unique events
      rankings = users.map((user: UserWithRelations, index) => {
        try {
          // Handle null/undefined participations
          if (!user.participations) {
            return {
              rank: skip + index + 1,
              id: user.id,
              name: user.name || 'Anonymous User',
              image: user.image,
              impactScore: user.impactScore || 0,
              volunteerHours: 0,
              eventsJoined: 0,
              badgesEarned: 0,
              tier: user.tier,
              location: user.city && user.country ? {
                city: user.city,
                country: user.country,
              } : (user.location || undefined),
            };
          }

          // Filter to only count completed participations (VERIFIED or ATTENDED)
          const completedParticipations = user.participations.filter(
            (p: { status: string; hours?: number | null; eventId: string }) => p.status === 'VERIFIED' || p.status === 'ATTENDED'
          );
          
          const volunteerHours = completedParticipations.reduce((sum: number, p: { hours?: number | null }) => sum + (p.hours || 0), 0);
          const uniqueEvents = new Set(completedParticipations.map((p: { eventId: string }) => p.eventId)).size;
          const badgesEarned = user.badges?.filter((b: { earnedAt?: Date | null }) => b.earnedAt).length || 0;
          
          // Validate impactScore is a valid number
          let validImpactScore = user.impactScore || 0;
          if (!Number.isFinite(validImpactScore) || isNaN(validImpactScore)) {
            console.warn(`Invalid impactScore for user ${user.id}: ${user.impactScore}, setting to 0`);
            validImpactScore = 0;
          }
          
          return {
            rank: skip + index + 1,
            id: user.id,
            name: user.name || 'Anonymous User',
            image: user.image,
            impactScore: validImpactScore,
            volunteerHours,
            eventsJoined: uniqueEvents,
            badgesEarned,
            tier: user.tier,
            location: user.city && user.country ? {
              city: user.city,
              country: user.country,
            } : (user.location || undefined),
          };
        } catch (userError) {
          console.error(`Error processing user ${user.id} for leaderboard:`, userError);
          // Return a safe default for this user
          // Validate impactScore is a valid number
          let validImpactScore = 0;
          if (user.impactScore) {
            validImpactScore = Number.isFinite(user.impactScore) && !isNaN(user.impactScore) 
              ? user.impactScore : 0;
          }
          
          return {
            rank: skip + index + 1,
            id: user.id,
            name: user.name || 'Anonymous User',
            image: user.image,
            impactScore: validImpactScore,
            volunteerHours: 0,
            eventsJoined: 0,
            badgesEarned: 0,
            tier: user.tier,
            location: user.city && user.country ? {
              city: user.city,
              country: user.country,
            } : undefined,
          };
        }
      });

      // Find current user's ranking if logged in
      if (session?.user?.id) {
        const currentUserIndex = rankings.findIndex(r => r.id === session.user.id);
        if (currentUserIndex !== -1) {
          currentUserRanking = rankings[currentUserIndex];
        } else {
          // Current user not in current page, fetch their ranking separately
          let currentUser: any = null;
          try {
            currentUser = await prisma.user.findUnique({
              where: { id: session.user.id },
              include: {
                badges: {
                  include: { badge: true },
                  where: sdg ? {
                    badge: { category: sdg.toString() }
                  } : undefined,
                },
                participations: {
                  where: { 
                    status: { in: ['VERIFIED', 'ATTENDED'] } // Include both statuses
                  },
                  include: { event: true }
                },
                _count: {
                  select: {
                    participations: { 
                      where: { status: { in: ['VERIFIED', 'ATTENDED'] } } // Include both statuses
                    }
                  }
                }
              }
            });
          } catch (currentUserError) {
            console.error('Error fetching current user for leaderboard:', currentUserError);
            // Continue without current user ranking if query fails
          }

          if (currentUser) {
            // Validate current user's impactScore is a valid number
            if (!Number.isFinite(currentUser.impactScore) || isNaN(currentUser.impactScore)) {
              console.warn(`Invalid impactScore for current user ${currentUser.id}: ${currentUser.impactScore}, setting to 0`);
              currentUser.impactScore = 0;
            }
            
            // Calculate their global rank by counting users with higher scores
            let higherScoreCount = 0;
            try {
              higherScoreCount = await prisma.user.count({
                where: {
                  ...where,
                  impactScore: { gt: currentUser.impactScore }
                }
              });
            } catch (rankError) {
              console.error('Error calculating current user rank:', rankError);
              // Continue with 0, will result in rank 1
            }

            // Calculate local rank (same country)
            let localRank = null;
            let localTotal = null;
            if (currentUser.country) {
              try {
                const localHigherCount = await prisma.user.count({
                  where: {
                    userType: 'INDIVIDUAL',
                    country: currentUser.country,
                    impactScore: { gt: currentUser.impactScore }
                  }
                });
                const localTotalCount = await prisma.user.count({
                  where: {
                    userType: 'INDIVIDUAL',
                    country: currentUser.country
                  }
                });
                localRank = localHigherCount + 1;
                localTotal = localTotalCount;
              } catch (localRankError) {
                console.error('Error calculating local rank:', localRankError);
              }
            }

            // Handle null/undefined participations - filter to only count completed participations (VERIFIED or ATTENDED)
            let volunteerHours = 0;
            let uniqueEvents = 0;
            if (currentUser.participations) {
              const completedParticipations = currentUser.participations.filter(
                (p: { status: string; hours?: number | null; eventId: string }) => p.status === 'VERIFIED' || p.status === 'ATTENDED'
              );
              volunteerHours = completedParticipations.reduce((sum: number, p: { hours?: number | null }) => sum + (p.hours || 0), 0);
              uniqueEvents = new Set(completedParticipations.map((p: { eventId: string }) => p.eventId)).size;
            }
            const badgesEarned = currentUser.badges?.filter((b: { earnedAt?: Date | null }) => b.earnedAt).length || 0;

            // Validate impactScore for currentUserRanking
            let validCurrentUserImpactScore = currentUser.impactScore || 0;
            if (!Number.isFinite(validCurrentUserImpactScore) || isNaN(validCurrentUserImpactScore)) {
              console.warn(`Invalid impactScore for current user ${currentUser.id}: ${currentUser.impactScore}, setting to 0`);
              validCurrentUserImpactScore = 0;
            }
            
            currentUserRanking = {
              rank: higherScoreCount + 1,
              localRank,
              localTotal,
              id: currentUser.id,
              name: currentUser.name || 'Anonymous User',
              image: currentUser.image,
              impactScore: validCurrentUserImpactScore,
              volunteerHours,
              eventsJoined: uniqueEvents,
              badgesEarned,
              tier: currentUser.tier,
              location: currentUser.city && currentUser.country ? {
                city: currentUser.city,
                country: currentUser.country,
              } : (currentUser.location || undefined),
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

      let organizations: any[] = [];
      try {
        organizations = await prisma.organization.findMany({
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
      } catch (orgError) {
        console.error('Error fetching organizations for leaderboard:', orgError);
        organizations = [];
      }

      try {
        total = await prisma.organization.count({ where });
      } catch (countError) {
        console.error('Error counting organizations:', countError);
        total = organizations.length;
      }

      type OrgWithRelations = typeof organizations[0];

      rankings = organizations.map((org: OrgWithRelations, index) => ({
        rank: skip + index + 1,
        id: org.id,
        name: org.name,
        type: org.type,
        logo: org.logo,
        score: org.esgScore || 0,
        tier: org.subscriptionTier,
        badges: org.corporateBadges?.map((ob: { badge: { category: string; tier: string; name: string }; earnedAt?: Date | null }) => ({
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
      
      let result: CountryRow[] = [];
      try {
        result = await prisma.$queryRaw<CountryRow[]>`
          SELECT 
            users.country as country,
            COUNT(DISTINCT users.id) as user_count,
            AVG(users."impactScore") as avg_score,
            SUM(users."impactScore") as total_score,
            COUNT(DISTINCT p.id) as total_events
          FROM users
          LEFT JOIN participations p ON users.id = p."userId" AND p.status IN ('VERIFIED', 'ATTENDED')
          WHERE users.country IS NOT NULL
          GROUP BY users.country
          ORDER BY total_score DESC
          LIMIT ${limit}
          OFFSET ${skip}
        `;
      } catch (countryError) {
        console.error('Error fetching country leaderboard:', countryError);
        result = [];
      }

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