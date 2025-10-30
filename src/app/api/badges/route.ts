// API route for fetching badge system data
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import {
  INDIVIDUAL_RANK_BADGES,
  ORGANIZATION_TIER_BADGES,
  SDG_BADGE_CONFIGS,
  getSDGBadgeRequirements
} from '@/lib/badge-config';
import { BadgeTier, ParticipationStatus } from '@prisma/client';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'public', 'individual', 'organization'
    const userId = url.searchParams.get('userId');
    const organizationId = url.searchParams.get('organizationId');

    // Public badge glossary - no authentication required
    if (type === 'public') {
      return NextResponse.json({
        individualRanks: INDIVIDUAL_RANK_BADGES.map(badge => ({
          rank: badge.rank,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          requirements: {
            minScore: badge.minScore,
            minHours: badge.minHours,
            minBadges: badge.minBadges
          },
          color: badge.color
        })),
        organizationTiers: ORGANIZATION_TIER_BADGES.map(badge => ({
          tier: badge.tier,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          requirements: {
            minEmployeeParticipation: badge.minEmployeeParticipation,
            minAverageScore: badge.minAverageScore,
            minEvents: badge.minEvents,
            minSDGDiversity: badge.minSDGDiversity
          },
          color: badge.color
        })),
        sdgBadges: SDG_BADGE_CONFIGS.map(sdg => ({
          sdgNumber: sdg.sdgNumber,
          sdgName: sdg.sdgName,
          icon: sdg.icon,
          color: sdg.color,
          tiers: Object.entries(sdg.tiers).map(([tier, config]) => ({
            tier,
            individual: {
              name: config.individual.name,
              description: config.individual.description,
              minHours: config.individual.minHours,
              minActivities: config.individual.minActivities
            },
            organization: {
              name: config.organization.name,
              description: config.organization.description,
              minHours: config.organization.minHours,
              minActivities: config.organization.minActivities
            }
          }))
        }))
      });
    }

    // Authenticated individual badge data
    if (type === 'individual' && userId) {
      const session = await getServerSession(authOptions);
      if (!session || session.user.id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          badges: {
            include: {
              badge: true
            }
          },
          participations: {
            where: { status: ParticipationStatus.VERIFIED },
            include: {
              event: true
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Recalculate impact score and tier dynamically (no hardcoding)
      try {
        const calculatedScore = await calculateImpaktrScore(user.id);
        
        // Update score if it has changed
        if (calculatedScore !== user.impactScore) {
          await prisma.user.update({
            where: { id: user.id },
            data: { impactScore: calculatedScore }
          });
          user.impactScore = calculatedScore;
        }

        // Update tier/rank based on actual requirements (score, hours, badges)
        await checkAndAwardBadges(user.id);
        
        // Re-fetch user to get updated tier
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { tier: true, impactScore: true }
        });
        if (updatedUser) {
          user.tier = updatedUser.tier;
          user.impactScore = updatedUser.impactScore;
        }
      } catch (error) {
        console.error('Error recalculating score/tier in badges API:', error);
        // Continue with existing score/tier if recalculation fails
      }

      // Calculate progress for each SDG
      const sdgProgress = await calculateSDGProgress(userId, user.participations);

      // Calculate rank progress
      const currentRankIndex = INDIVIDUAL_RANK_BADGES.findIndex(b => b.rank === user.tier);
      const nextRank = INDIVIDUAL_RANK_BADGES[currentRankIndex + 1];

      const verifiedHours = user.participations.reduce((sum, p) => sum + (p.hours || 0), 0);
      const earnedBadges = user.badges.length;

      return NextResponse.json({
        currentRank: {
          rank: user.tier,
          name: INDIVIDUAL_RANK_BADGES[currentRankIndex]?.name,
          icon: INDIVIDUAL_RANK_BADGES[currentRankIndex]?.icon
        },
        nextRank: nextRank ? {
          rank: nextRank.rank,
          name: nextRank.name,
          requirements: {
            minScore: nextRank.minScore,
            minHours: nextRank.minHours,
            minBadges: nextRank.minBadges
          },
          progress: {
            score: Math.min((user.impactScore / nextRank.minScore) * 100, 100),
            hours: Math.min((verifiedHours / nextRank.minHours) * 100, 100),
            badges: Math.min((earnedBadges / nextRank.minBadges) * 100, 100)
          }
        } : null,
        currentProgress: {
          score: user.impactScore,
          hours: verifiedHours,
          badges: earnedBadges
        },
        allRanks: INDIVIDUAL_RANK_BADGES.map(badge => ({
          ...badge,
          earned: INDIVIDUAL_RANK_BADGES.findIndex(b => b.rank === user.tier) >= INDIVIDUAL_RANK_BADGES.findIndex(b => b.rank === badge.rank),
          current: badge.rank === user.tier
        })),
        sdgBadges: sdgProgress,
        stats: {
          recentlyEarned: user.badges
            .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
            .slice(0, 5)
            .map(ub => ({
              name: ub.badge.name,
              earnedAt: ub.earnedAt,
              icon: ub.badge.icon
            })),
          closeToEarning: await getCloseToEarningBadges(userId, sdgProgress)
        }
      });
    }

    // Authenticated organization badge data
    if (type === 'organization' && organizationId) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          members: {
            include: {
              user: {
                include: {
                  participations: {
                    where: { status: ParticipationStatus.VERIFIED },
                    include: { event: true }
                  }
                }
              }
            }
          },
          badges: true,
          events: true
        }
      });

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      // Calculate SDG progress for organization
      const orgSDGProgress = await calculateOrgSDGProgress(organizationId, organization);

      const currentTierIndex = ORGANIZATION_TIER_BADGES.findIndex(b => b.tier === organization.tier);
      const nextTier = ORGANIZATION_TIER_BADGES[currentTierIndex + 1];

      const totalMembers = organization.members.length;
      const activeMembers = organization.members.filter(m => m.user.participations.length > 0).length;
      const participationRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;

      const totalScore = organization.members.reduce((sum, m) => sum + m.user.impactScore, 0);
      const avgScore = totalMembers > 0 ? totalScore / totalMembers : 0;

      const uniqueSDGs = new Set(
        organization.members.flatMap(m =>
          m.user.participations
            .filter(p => p.event.sdg)
            .map(p => parseInt(p.event.sdg!))
        )
      );

      return NextResponse.json({
        currentTier: {
          tier: organization.tier,
          name: ORGANIZATION_TIER_BADGES[currentTierIndex]?.name,
          icon: ORGANIZATION_TIER_BADGES[currentTierIndex]?.icon
        },
        nextTier: nextTier ? {
          tier: nextTier.tier,
          name: nextTier.name,
          requirements: {
            minEmployeeParticipation: nextTier.minEmployeeParticipation,
            minAverageScore: nextTier.minAverageScore,
            minEvents: nextTier.minEvents,
            minSDGDiversity: nextTier.minSDGDiversity
          },
          progress: {
            participation: Math.min((participationRate / nextTier.minEmployeeParticipation) * 100, 100),
            averageScore: Math.min((avgScore / nextTier.minAverageScore) * 100, 100),
            events: Math.min((organization.events.length / nextTier.minEvents) * 100, 100),
            sdgDiversity: Math.min((uniqueSDGs.size / nextTier.minSDGDiversity) * 100, 100)
          }
        } : null,
        currentProgress: {
          participationRate,
          averageScore: avgScore,
          totalEvents: organization.events.length,
          sdgDiversity: uniqueSDGs.size
        },
        allTiers: ORGANIZATION_TIER_BADGES.map(badge => ({
          ...badge,
          earned: ORGANIZATION_TIER_BADGES.findIndex(b => b.tier === organization.tier) >= ORGANIZATION_TIER_BADGES.findIndex(b => b.tier === badge.tier),
          current: badge.tier === organization.tier
        })),
        sdgBadges: orgSDGProgress,
        stats: {
          recentlyEarned: organization.badges
            .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
            .slice(0, 5)
            .map(ob => ({
              name: ob.badgeName,
              earnedAt: ob.earnedAt,
              type: ob.badgeType
            })),
          closeToEarning: await getOrgCloseToEarningBadges(organizationId, orgSDGProgress)
        }
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching badge data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate SDG progress for individuals
async function calculateSDGProgress(userId: string, participations: Array<{ hours: number | null; event: { sdg: string | null } }>) {
  const sdgStats: Record<number, { hours: number; activities: number }> = {};

  participations.forEach(p => {
    if (p.event.sdg) {
      const sdgNum = parseInt(p.event.sdg);
      if (!sdgStats[sdgNum]) {
        sdgStats[sdgNum] = { hours: 0, activities: 0 };
      }
      sdgStats[sdgNum].hours += p.hours || 0;
      sdgStats[sdgNum].activities += 1;
    }
  });

  return SDG_BADGE_CONFIGS.map(sdg => {
    const stats = sdgStats[sdg.sdgNumber] || { hours: 0, activities: 0 };
    
    const tiers = Object.entries(sdg.tiers).map(([tierKey, tierConfig]) => {
      const tier = tierKey as BadgeTier;
      const requirements = tierConfig.individual;
      const earned = stats.hours >= requirements.minHours && stats.activities >= requirements.minActivities;
      
      const hoursProgress = Math.min((stats.hours / requirements.minHours) * 100, 100);
      const activitiesProgress = Math.min((stats.activities / requirements.minActivities) * 100, 100);
      const overallProgress = (hoursProgress + activitiesProgress) / 2;

      return {
        tier,
        name: tierConfig.individual.name,
        description: tierConfig.individual.description,
        requirements: {
          minHours: requirements.minHours,
          minActivities: requirements.minActivities
        },
        progress: {
          hours: stats.hours,
          activities: stats.activities,
          percentage: overallProgress
        },
        earned
      };
    });

    return {
      sdgNumber: sdg.sdgNumber,
      sdgName: sdg.sdgName,
      icon: sdg.icon,
      color: sdg.color,
      tiers
    };
  });
}

// Helper function to calculate SDG progress for organizations
async function calculateOrgSDGProgress(
  organizationId: string, 
  organization: {
    members: Array<{
      user: {
        participations: Array<{
          hours: number | null;
          event: { sdg: string | null };
        }>;
      };
    }>;
  }
) {
  const sdgStats: Record<number, { hours: number; activities: number }> = {};

  organization.members.forEach(member => {
    member.user.participations.forEach(p => {
      if (p.event.sdg) {
        const sdgNum = parseInt(p.event.sdg);
        if (!sdgStats[sdgNum]) {
          sdgStats[sdgNum] = { hours: 0, activities: 0 };
        }
        sdgStats[sdgNum].hours += p.hours || 0;
        sdgStats[sdgNum].activities += 1;
      }
    });
  });

  return SDG_BADGE_CONFIGS.map(sdg => {
    const stats = sdgStats[sdg.sdgNumber] || { hours: 0, activities: 0 };
    
    const tiers = Object.entries(sdg.tiers).map(([tierKey, tierConfig]) => {
      const tier = tierKey as BadgeTier;
      const requirements = tierConfig.organization;
      const earned = stats.hours >= requirements.minHours && stats.activities >= requirements.minActivities;
      
      const hoursProgress = Math.min((stats.hours / requirements.minHours) * 100, 100);
      const activitiesProgress = Math.min((stats.activities / requirements.minActivities) * 100, 100);
      const overallProgress = (hoursProgress + activitiesProgress) / 2;

      return {
        tier,
        name: tierConfig.organization.name,
        description: tierConfig.organization.description,
        requirements: {
          minHours: requirements.minHours,
          minActivities: requirements.minActivities
        },
        progress: {
          hours: stats.hours,
          activities: stats.activities,
          percentage: overallProgress
        },
        earned
      };
    });

    return {
      sdgNumber: sdg.sdgNumber,
      sdgName: sdg.sdgName,
      icon: sdg.icon,
      color: sdg.color,
      tiers
    };
  });
}

// Helper to get badges close to earning (>= 70% progress)
async function getCloseToEarningBadges(
  userId: string, 
  sdgProgress: Array<{
    sdgNumber: number;
    sdgName: string;
    tiers: Array<{
      tier: BadgeTier;
      name: string;
      progress: { percentage: number };
      earned: boolean;
    }>;
  }>
) {
  const closeToEarning = [];

  for (const sdg of sdgProgress) {
    for (const tier of sdg.tiers) {
      if (!tier.earned && tier.progress.percentage >= 70) {
        closeToEarning.push({
          sdgNumber: sdg.sdgNumber,
          sdgName: sdg.sdgName,
          tierName: tier.name,
          progress: tier.progress.percentage
        });
      }
    }
  }

  return closeToEarning.sort((a, b) => b.progress - a.progress).slice(0, 5);
}

// Helper to get org badges close to earning
async function getOrgCloseToEarningBadges(
  organizationId: string,
  sdgProgress: Array<{
    sdgNumber: number;
    sdgName: string;
    tiers: Array<{
      tier: BadgeTier;
      name: string;
      progress: { percentage: number };
      earned: boolean;
    }>;
  }>
) {
  const closeToEarning = [];

  for (const sdg of sdgProgress) {
    for (const tier of sdg.tiers) {
      if (!tier.earned && tier.progress.percentage >= 70) {
        closeToEarning.push({
          sdgNumber: sdg.sdgNumber,
          sdgName: sdg.sdgName,
          tierName: tier.name,
          progress: tier.progress.percentage
        });
      }
    }
  }

  return closeToEarning.sort((a, b) => b.progress - a.progress).slice(0, 5);
}


