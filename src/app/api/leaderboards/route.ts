// home/ubuntu/impaktrweb/src/app/api/leaderboards/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const leaderboardQuerySchema = z.object({
  type: z.enum(['individuals', 'organizations', 'countries']).default('individuals'),
  period: z.enum(['all_time', 'yearly', 'monthly']).default('all_time'),
  sdg: z.string().transform((str) => parseInt(str)).optional(),
  country: z.string().optional(),
  limit: z.string().transform((str) => parseInt(str)).default('50'),
  page: z.string().transform((str) => parseInt(str)).default('1'),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { type, period, sdg, country, limit, page } = leaderboardQuerySchema.parse(params);

    const skip = (page - 1) * limit;

    let rankings: any[] = [];
    let total = 0;

    if (type === 'individuals') {
      // Individual leaderboard
      const where: any = {};
      
      if (country) {
        where.profile = {
          location: {
            path: ['country'],
            string_contains: country,
          }
        };
      }

      // For SDG-specific leaderboard, filter by badge progress
      if (sdg) {
        where.badges = {
          some: {
            badge: {
              sdgNumber: sdg,
            },
            progress: {
              gt: 0,
            }
          }
        };
      }

      // Apply period filter for score calculation
      let scoreFilter = {};
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
          userType: 'INDIVIDUAL',
        },
        include: {
          profile: true,
          badges: {
            include: {
              badge: true,
            },
            where: sdg ? {
              badge: {
                sdgNumber: sdg,
              }
            } : undefined,
          },
          _count: {
            select: {
              participations: {
                where: { status: 'VERIFIED' }
              },
              certificates: true,
            }
          }
        },
        orderBy: { impaktrScore: 'desc' },
        skip,
        take: limit,
      });

      total = await prisma.user.count({
        where: {
          ...where,
          ...scoreFilter,
          userType: 'INDIVIDUAL',
        }
      });

      rankings = users.map((user, index) => ({
        rank: skip + index + 1,
        id: user.id,
        name: user.profile?.displayName || `${user.profile?.firstName} ${user.profile?.lastName}`.trim(),
        avatar: user.profile?.avatar,
        location: user.profile?.location,
        score: user.impaktrScore,
        rank_title: user.currentRank,
        badges: user.badges.map(ub => ({
          sdg: ub.badge.sdgNumber,
          tier: ub.badge.tier,
          name: ub.badge.name,
          progress: ub.progress,
          earned: !!ub.earnedAt,
        })),
        stats: {
          verified_hours: user._count.participations,
          certificates: user._count.certificates,
        }
      }));
    } else if (type === 'organizations') {
      // Organization leaderboard
      const where: any = {};

      if (country) {
        // This would need to be implemented based on organization location
        // For now, we'll filter by owner's location
        where.owner = {
          profile: {
            location: {
              path: ['country'],
              string_contains: country,
            }
          }
        };
      }

      const organizations = await prisma.organization.findMany({
        where,
        include: {
          owner: {
            include: {
              profile: true,
            }
          },
          badges: {
            include: {
              badge: true,
            },
            where: sdg ? {
              badge: {
                sdgNumber: sdg,
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
        orderBy: { impaktrScore: 'desc' },
        skip,
        take: limit,
      });

      total = await prisma.organization.count({ where });

      rankings = organizations.map((org, index) => ({
        rank: skip + index + 1,
        id: org.id,
        name: org.name,
        type: org.type,
        logo: org.owner.profile?.logo,
        score: org.impaktrScore,
        tier: org.tier,
        badges: org.badges.map(ob => ({
          sdg: ob.badge.sdgNumber,
          tier: ob.badge.tier,
          name: ob.badge.name,
          progress: ob.progress,
          earned: !!ob.earnedAt,
        })),
        stats: {
          members: org.members.length,
          events: org.events.length,
        }
      }));
    } else if (type === 'countries') {
      // Country leaderboard - aggregate by country
      const result = await prisma.$queryRaw`
        SELECT 
          (profile.location->>'country') as country,
          COUNT(DISTINCT users.id) as user_count,
          AVG(users.impaktr_score) as avg_score,
          SUM(users.impaktr_score) as total_score,
          COUNT(DISTINCT p.id) as total_events
        FROM users
        LEFT JOIN user_profiles profile ON users.id = profile.user_id
        LEFT JOIN participations p ON users.id = p.user_id AND p.status = 'VERIFIED'
        WHERE users.user_type = 'INDIVIDUAL'
          AND profile.location->>'country' IS NOT NULL
        GROUP BY (profile.location->>'country')
        ORDER BY total_score DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      rankings = (result as any[]).map((row, index) => ({
        rank: skip + index + 1,
        country: row.country,
        user_count: parseInt(row.user_count),
        avg_score: parseFloat(row.avg_score),
        total_score: parseFloat(row.total_score),
        total_events: parseInt(row.total_events),
      }));

      total = rankings.length; // This is approximate
    }

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