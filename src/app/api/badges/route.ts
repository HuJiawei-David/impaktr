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
import { ParticipationStatus } from '@/types/enums';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';

// Type definitions
type BadgeTier = 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN';

interface UserParticipation {
  id: string;
  hours: number | null;
  event: {
    id: string;
    sdg: string | null;
  };
}

interface UserBadge {
  earnedAt: Date;
  badge: {
    name: string;
    icon: string;
  };
}

interface OrganizationBadge {
  earnedAt: Date;
  badgeName: string;
  badgeType: string;
}

interface OrganizationMember {
  user: {
    impactScore: number;
    participations: Array<{
      hours: number | null;
      event: { sdg: string | null };
    }>;
  };
}

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

    // Authenticated individual badge data (allows viewing own or others' profiles)
    if (type === 'individual' && userId) {
      const session = await getServerSession(authOptions);
      // Allow authenticated users to view badge progress (own or public profiles)
      if (!session) {
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
            where: { 
              status: { in: [ParticipationStatus.VERIFIED, ParticipationStatus.ATTENDED] }
            },
            select: {
              id: true,
              hours: true,
              event: {
                select: {
                  id: true,
                  sdg: true,
                  status: true,
                  endDate: true
                }
              }
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
        
        // Validate calculatedScore is a valid finite number
        if (Number.isFinite(calculatedScore) && !isNaN(calculatedScore) && calculatedScore >= 0) {
          // Update score if it has changed
          if (calculatedScore !== user.impactScore) {
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: { impactScore: calculatedScore }
              });
              user.impactScore = calculatedScore;
            } catch (updateError) {
              console.error('Error updating impactScore in badges API:', updateError);
              // Continue without updating score
            }
          }
        } else {
          console.warn(`Invalid calculatedScore for user ${user.id}: ${calculatedScore}, skipping update`);
        }

        // Update tier/rank based on actual requirements (score, hours, badges)
        try {
          await checkAndAwardBadges(user.id);
        } catch (badgeError) {
          console.error('Error checking/awarding badges in badges API:', badgeError);
          // Continue without updating badges
        }
        
        // Re-fetch user to get updated tier
        try {
          const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { tier: true, impactScore: true }
          });
          if (updatedUser) {
            user.tier = updatedUser.tier;
            user.impactScore = updatedUser.impactScore;
          }
        } catch (fetchError) {
          console.error('Error fetching updated user in badges API:', fetchError);
          // Continue with existing values
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

      const verifiedHours = user.participations.reduce((sum: number, p: UserParticipation) => sum + (p.hours || 0), 0);
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
            .sort((a: UserBadge, b: UserBadge) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
            .slice(0, 5)
            .map((ub: UserBadge) => ({
              name: ub.badge.name,
              earnedAt: ub.earnedAt,
              icon: ub.badge.icon
            })),
          closeToEarning: await getCloseToEarningBadges(userId, sdgProgress)
        }
      });
    }

    // Organization badge data (authenticated only - for organization members)
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
                select: {
                  id: true,
                  impactScore: true,
                  participations: {
                    where: { 
                      status: { in: [ParticipationStatus.VERIFIED, ParticipationStatus.ATTENDED] }
                    },
                    include: { 
                      event: {
                        select: {
                          id: true,
                          sdg: true,
                          status: true,
                          endDate: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          badges: true,
          events: {
            select: {
              id: true,
              sdg: true,
              status: true,
              endDate: true,
              participations: {
                where: {
                  status: { in: [ParticipationStatus.VERIFIED, ParticipationStatus.ATTENDED] }
                },
                select: {
                  hours: true,
                  status: true
                }
              }
            }
          }
        }
      });

      console.log(`[Badge Progress] Organization ${organizationId} fetched:`, {
        memberCount: organization?.members.length || 0,
        totalParticipations: organization?.members.reduce((sum, m) => sum + (m.user.participations?.length || 0), 0) || 0,
        totalEvents: organization?.events.length || 0,
        eventsWithParticipations: organization?.events.filter(e => e.participations.length > 0).length || 0
      });

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      // Calculate SDG progress for organization - use ALL participations in organization events, not just members
      let orgSDGProgress;
      try {
        orgSDGProgress = await calculateOrgSDGProgress(organizationId, organization);
      } catch (error) {
        console.error(`[Badge Progress] Error calculating org SDG progress:`, error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        return NextResponse.json(
          { 
            error: 'Failed to calculate badge progress',
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        );
      }

      const currentTierIndex = ORGANIZATION_TIER_BADGES.findIndex(b => b.tier === organization.tier);
      const nextTier = ORGANIZATION_TIER_BADGES[currentTierIndex + 1];

      const totalMembers = organization.members.length;
      const activeMembers = organization.members.filter((m: OrganizationMember) => {
        return m.user?.participations && m.user.participations.length > 0;
      }).length;
      const participationRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;

      const totalScore = organization.members.reduce((sum: number, m: OrganizationMember) => {
        const score = m.user?.impactScore || 0;
        return sum + (typeof score === 'number' ? score : 0);
      }, 0);
      const avgScore = totalMembers > 0 ? totalScore / totalMembers : 0;

      const uniqueSDGs = new Set(
        organization.members.flatMap((m: OrganizationMember) => {
          if (!m.user?.participations) return [];
          return m.user.participations
            .filter(p => p.event?.sdg)
            .map(p => {
              const sdg = p.event.sdg;
              if (typeof sdg === 'string') {
                const parsed = parseInt(sdg);
                return isNaN(parsed) ? null : parsed;
              }
              return typeof sdg === 'number' ? sdg : null;
            })
            .filter((sdg): sdg is number => sdg !== null);
        })
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
            .sort((a: OrganizationBadge, b: OrganizationBadge) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
            .slice(0, 5)
            .map((ob: OrganizationBadge) => ({
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
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate SDG progress for individuals
async function calculateSDGProgress(userId: string, participations: Array<{ id?: string; hours: number | null; event: { id?: string; sdg: string | null; status?: string; endDate?: Date } }>) {
  const sdgStats: Record<number, { hours: number; activities: number }> = {};
  const processedParticipationIds = new Set<string>();

  // Filter to only include participations from events that have ended
  const now = new Date();
  const pastParticipations = participations.filter((p: { event?: { status?: string; endDate?: Date } }) => {
    if (!p.event) return false;
    const eventHasEnded = p.event.status === 'COMPLETED' || 
                         (p.event.endDate && new Date(p.event.endDate) < now);
    return eventHasEnded;
  });

  pastParticipations.forEach((p: { id?: string; hours: number | null; event: { id?: string; sdg: string | null } }) => {
    // Skip duplicate participations (shouldn't happen, but safety check)
    if (p.id && processedParticipationIds.has(p.id)) {
      return;
    }
    if (p.id) {
      processedParticipationIds.add(p.id);
    }
    if (p.event.sdg) {
      let sdgNumbers: number[] = [];
      
      // Debug logging for Alan Greenspan
      if (userId.includes('alan') || userId.includes('greenspan')) {
        console.log(`[Badge Progress] Processing participation: eventId=${p.event.id}, hours=${p.hours}, sdg=${p.event.sdg}, sdgType=${typeof p.event.sdg}`);
      }
      
      // SDG can be stored as JSON string "[1,2,3]" or actual array or single number
      if (typeof p.event.sdg === 'string') {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(p.event.sdg);
          if (Array.isArray(parsed)) {
            sdgNumbers = Array.from(new Set(parsed.map((s: unknown) => {
              if (typeof s === 'number') return s;
              const n = parseInt(String(s));
              return isNaN(n) ? 0 : n;
            }).filter((n: number) => n > 0)));
          } else {
            const num = parseInt(parsed.toString());
            if (!isNaN(num)) {
              sdgNumbers = [num];
            }
          }
        } catch {
          // If JSON parse fails, try direct parseInt
          const num = parseInt(p.event.sdg);
          if (!isNaN(num)) {
            sdgNumbers = [num];
          }
        }
      } else if (Array.isArray(p.event.sdg)) {
        const sdgArray: unknown[] = p.event.sdg;
        sdgNumbers = Array.from(new Set(sdgArray.map((s: unknown): number => {
          if (typeof s === 'number') return s;
          const n = parseInt(String(s));
          return isNaN(n) ? 0 : n;
        }).filter((n: number) => n > 0)));
      } else if (typeof p.event.sdg === 'number') {
        sdgNumbers = [p.event.sdg];
      }
      
      // Remove duplicates to ensure each SDG is only counted once per participation
      const uniqueSdgNumbers = Array.from(new Set(sdgNumbers));
      uniqueSdgNumbers.forEach((sdgNum: number) => {
        if (sdgNum >= 1 && sdgNum <= 17) {
          if (!sdgStats[sdgNum]) {
            sdgStats[sdgNum] = { hours: 0, activities: 0 };
          }
          sdgStats[sdgNum].hours += p.hours || 0;
          sdgStats[sdgNum].activities += 1;
        }
      });
    }
  });

  // Debug: Log final stats for troubleshooting
  console.log(`[Badge Progress] User ${userId} - Final SDG Stats:`, JSON.stringify(Object.fromEntries(Object.entries(sdgStats).map(([k, v]) => [k, { hours: v.hours, activities: v.activities }]))));

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
          event: { 
            sdg: string | number | number[] | null;
            status?: string;
            endDate?: Date;
          };
        }>;
      };
    }>;
    events: Array<{
      id: string;
      sdg: string | number | number[] | null;
      status: string;
      endDate: Date | null;
      participations: Array<{
        hours: number | null;
        status: string;
      }>;
    }>;
  }
) {
  try {
    const sdgStats: Record<number, { hours: number; activities: number }> = {};
    const now = new Date();
    let totalParticipationsProcessed = 0;
    let participationsFromPastEvents = 0;

    console.log(`[Badge Progress] Starting calculation for org ${organizationId}, ${organization.events.length} events`);

    // Use ALL participations from organization events (not just members)
    // This counts all volunteer hours and activities from events hosted by the organization
    organization.events.forEach(event => {
      // Filter to only include events that have ended
      const eventHasEnded = event.status === 'COMPLETED' || 
                           (event.endDate && new Date(event.endDate) < now);
      if (!eventHasEnded) {
        console.log(`[Badge Progress] Event ${event.id} has not ended (status: ${event.status}, endDate: ${event.endDate})`);
        return;
      }

      console.log(`[Badge Progress] Processing event ${event.id} with ${event.participations.length} participations`);

      // Count participations from this event
      event.participations.forEach(p => {
        totalParticipationsProcessed++;
        participationsFromPastEvents++;
        
        if (event.sdg) {
        let sdgNumbers: number[] = [];
        
        // Handle SDG in multiple formats: JSON string, array, or single number
        if (typeof event.sdg === 'string') {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(event.sdg);
            if (Array.isArray(parsed)) {
              sdgNumbers = parsed.map((s: unknown) => {
                if (typeof s === 'number') return s;
                const n = parseInt(String(s));
                return isNaN(n) ? 0 : n;
              }).filter((n: number) => n > 0);
            } else {
              const num = parseInt(parsed.toString());
              if (!isNaN(num)) {
                sdgNumbers = [num];
              }
            }
          } catch {
            // If JSON parse fails, try direct parseInt
            const num = parseInt(event.sdg);
            if (!isNaN(num)) {
              sdgNumbers = [num];
            }
          }
        } else if (Array.isArray(event.sdg)) {
          sdgNumbers = event.sdg.map((s: unknown) => {
            if (typeof s === 'number') return s;
            const n = parseInt(String(s));
            return isNaN(n) ? 0 : n;
          }).filter((n: number) => n > 0);
        } else if (typeof event.sdg === 'number') {
          sdgNumbers = [event.sdg];
        }

        // Count each SDG from this participation
        sdgNumbers.forEach((sdgNum: number) => {
          if (sdgNum >= 1 && sdgNum <= 17) {
            if (!sdgStats[sdgNum]) {
              sdgStats[sdgNum] = { hours: 0, activities: 0 };
            }
            sdgStats[sdgNum].hours += p.hours || 0;
            sdgStats[sdgNum].activities += 1;
          }
        });
      }
    });
  });

    console.log(`[Badge Progress] Organization ${organizationId}: Processed ${totalParticipationsProcessed} participations, ${participationsFromPastEvents} from past events`);
    console.log(`[Badge Progress] SDG Stats:`, JSON.stringify(sdgStats));
  
  // Debug: Log first few SDG badge progress entries
  const sampleBadgeProgress = SDG_BADGE_CONFIGS.slice(0, 3).map(sdg => {
    const stats = sdgStats[sdg.sdgNumber] || { hours: 0, activities: 0 };
    const supporterTier = sdg.tiers['SUPPORTER' as keyof typeof sdg.tiers];
    return {
      sdgNumber: sdg.sdgNumber,
      stats,
      firstTier: {
        tier: 'SUPPORTER',
        hours: stats.hours,
        activities: stats.activities,
        minHours: supporterTier?.organization.minHours || 0,
        minActivities: supporterTier?.organization.minActivities || 0
      }
    };
  });
  console.log(`[Badge Progress] Sample badge progress:`, JSON.stringify(sampleBadgeProgress, null, 2));

  const badgeProgress = SDG_BADGE_CONFIGS.map(sdg => {
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

    console.log(`[Badge Progress] Organization ${organizationId}: Returning ${badgeProgress.length} SDG badges`);
    return badgeProgress;
  } catch (error) {
    console.error(`[Badge Progress] Error in calculateOrgSDGProgress:`, error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error; // Re-throw to be caught by caller
  }
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


