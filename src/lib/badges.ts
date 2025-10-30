// home/ubuntu/impaktrweb/src/lib/badges.ts

import { prisma } from './prisma';
import { BadgeTier, IndividualRank, OrganizationTier, ParticipationStatus } from '@prisma/client';
import { 
  INDIVIDUAL_RANK_BADGES, 
  ORGANIZATION_TIER_BADGES,
  SDG_BADGE_CONFIGS,
  getIndividualSDGBadgeName,
  getIndividualSDGBadgeDescription,
  getOrganizationSDGBadgeName,
  getOrganizationSDGBadgeDescription,
  getSDGBadgeRequirements
} from './badge-config';

// Badge progression requirements for each SDG tier
interface BadgeRequirements {
  minHours: number;
  minActivities: number;
  minQuality: number;
}

// Individual rank progression requirements
interface RankRequirements {
  minScore: number;
  minHours: number;
  minBadges: number;
}

// Organization tier progression requirements
interface OrganizationTierRequirements {
  minEmployeeParticipation: number;
  minAverageScore: number;
  minEvents: number;
  minSDGDiversity: number;
}

const BADGE_REQUIREMENTS: Record<BadgeTier, BadgeRequirements> = {
  [BadgeTier.SUPPORTER]: { minHours: 10, minActivities: 2, minQuality: 0.6 },
  [BadgeTier.BUILDER]: { minHours: 50, minActivities: 8, minQuality: 0.75 },
  [BadgeTier.CHAMPION]: { minHours: 150, minActivities: 20, minQuality: 0.85 },
  [BadgeTier.GUARDIAN]: { minHours: 400, minActivities: 50, minQuality: 0.9 },
};

// Build RANK_REQUIREMENTS from configuration
const RANK_REQUIREMENTS: Record<IndividualRank, RankRequirements> = INDIVIDUAL_RANK_BADGES.reduce((acc, badge) => {
  acc[badge.rank] = {
    minScore: badge.minScore,
    minHours: badge.minHours,
    minBadges: badge.minBadges
  };
  return acc;
}, {} as Record<IndividualRank, RankRequirements>);

// Build ORGANIZATION_TIER_REQUIREMENTS from configuration
const ORGANIZATION_TIER_REQUIREMENTS: Record<OrganizationTier, OrganizationTierRequirements> = ORGANIZATION_TIER_BADGES.reduce((acc, badge) => {
  acc[badge.tier] = {
    minEmployeeParticipation: badge.minEmployeeParticipation,
    minAverageScore: badge.minAverageScore,
    minEvents: badge.minEvents,
    minSDGDiversity: badge.minSDGDiversity
  };
  return acc;
}, {} as Record<OrganizationTier, OrganizationTierRequirements>);

/**
 * Main function to check and award badges after a user's participation is verified
 */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  try {
  // Get user's verified participations grouped by SDG
  const participations = await prisma.participation.findMany({
    where: {
      userId,
      status: ParticipationStatus.VERIFIED,
    },
    include: {
      event: true,
        verifications: true,
    },
  });

  // Group participations by SDG
    const sdgParticipations = groupParticipationsBySDG(participations);

    // Check each SDG for badge eligibility
    for (const [sdgNumber, sdgEvents] of Object.entries(sdgParticipations)) {
      await checkSDGBadges(userId, parseInt(sdgNumber), sdgEvents);
    }

    // Update user rank based on badges and score
    await updateUserRank(userId);

    // Create achievements for significant milestones
    await checkMilestoneAchievements(userId, participations);

  } catch (error) {
    console.error('Error checking and awarding badges:', error);
    throw error;
  }
}

/**
 * Group participations by SDG tags
 */
function groupParticipationsBySDG(participations: Array<{ hours: number | null; createdAt: Date; event: { sdg: string | null; skills?: string[] }; verifications: Array<{ type: string }> }>): Record<number, Array<{ hours: number | null; createdAt: Date; event: { sdg: string | null; skills?: string[] }; verifications: Array<{ type: string }> }>> {
  const sdgGroups: Record<number, Array<{ hours: number | null; createdAt: Date; event: { sdg: string | null; skills?: string[] }; verifications: Array<{ type: string }> }>> = {};
  
  participations.forEach(participation => {
    if (participation.event.sdg) {
      const sdg = parseInt(participation.event.sdg);
      if (!sdgGroups[sdg]) {
        sdgGroups[sdg] = [];
      }
      sdgGroups[sdg].push(participation);
    }
  });

  return sdgGroups;
}

/**
 * Check and award SDG-specific badges
 */
async function checkSDGBadges(userId: string, sdgNumber: number, participations: Array<{ hours: number | null; createdAt: Date; event: { sdg: string | null; skills?: string[] }; verifications: Array<{ type: string }> }>): Promise<void> {
  const stats = calculateSDGStats(participations);

  // Check each badge tier for this SDG
  for (const [tier, requirements] of Object.entries(BADGE_REQUIREMENTS)) {
    const badgeTier = tier as BadgeTier;
    
    if (stats.totalHours >= requirements.minHours && 
        stats.totalActivities >= requirements.minActivities && 
        stats.averageQuality >= requirements.minQuality) {
      
      await awardSDGBadge(userId, sdgNumber, badgeTier, stats);
    } else {
      // Update progress for badges not yet earned
      await updateBadgeProgress(userId, sdgNumber, badgeTier, stats, requirements);
    }
  }
}

/**
 * Calculate statistics for a specific SDG
 */
function calculateSDGStats(participations: Array<{ hours: number | null; createdAt: Date; event: { sdg: string | null; skills?: string[] }; verifications: Array<{ type: string }> }>) {
  const totalHours = participations.reduce((sum, p) => 
    sum + (p.hours || 0), 0);
  
  const totalActivities = participations.length;
  
  const totalQuality = participations.reduce((sum, p) => 
    sum + 1.0, 0); // Default quality rating since it's not directly on Participation
  const averageQuality = totalQuality / Math.max(totalActivities, 1);

  const uniqueSkills = new Set();
  participations.forEach(p => {
    p.event.skills?.forEach((skill: string) => uniqueSkills.add(skill));
  });

  const verificationTypes = participations.reduce((acc, p) => {
    p.verifications.forEach((v: { type: string }) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    totalHours,
    totalActivities,
    averageQuality,
    uniqueSkills: uniqueSkills.size,
    verificationTypes,
    latestActivity: participations.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )[0]
  };
}

/**
 * Award an SDG badge to a user
 */
async function awardSDGBadge(userId: string, sdgNumber: number, tier: BadgeTier, stats: { totalHours: number; totalActivities: number; averageQuality: number; uniqueSkills: number; verificationTypes: Record<string, number> }): Promise<void> {
  // Find or create the badge
  let badge = await prisma.badge.findUnique({
    where: {
      sdgNumber_tier: {
        sdgNumber,
        tier,
      }
    }
  });

  if (!badge) {
    badge = await prisma.badge.create({
      data: {
        sdgNumber,
        tier,
        name: getSDGBadgeName(sdgNumber, tier),
        description: getSDGBadgeDescription(sdgNumber, tier),
        icon: getSDGBadgeIcon(sdgNumber, tier),
        category: sdgNumber.toString(),
        requirement: {
          minHours: BADGE_REQUIREMENTS[tier].minHours,
          minActivities: BADGE_REQUIREMENTS[tier].minActivities,
          minQuality: BADGE_REQUIREMENTS[tier].minQuality,
        },
      }
    });
  }

  // Check if user already has this badge
  const existingUserBadge = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id,
      }
    }
  });

  if (!existingUserBadge) {
    // Award new badge
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        earnedAt: new Date(),
      }
    });

    // Create achievement record
    await prisma.achievement.create({
      data: {
        userId,
        type: 'badge_earned',
        title: `${badge.name} Earned`,
        description: `Congratulations! You've earned the ${badge.name} badge for your contributions to ${getSDGName(sdgNumber)}.`,
        points: 10,
        verifiedAt: new Date(),
      }
    });

  } else if (!existingUserBadge.earnedAt) {
    // Update existing badge to earned
    await prisma.userBadge.update({
      where: { id: existingUserBadge.id },
      data: {
        earnedAt: new Date(),
      }
    });
  }
}

/**
 * Update badge progress for badges not yet earned
 */
async function updateBadgeProgress(
  userId: string, 
  sdgNumber: number, 
  tier: BadgeTier, 
  stats: { totalHours: number; totalActivities: number; averageQuality: number; uniqueSkills: number; verificationTypes: Record<string, number> }, 
  requirements: BadgeRequirements
): Promise<void> {
  // Calculate progress percentage
  const hoursProgress = Math.min((stats.totalHours / requirements.minHours) * 100, 100);
  const activitiesProgress = Math.min((stats.totalActivities / requirements.minActivities) * 100, 100);
  const qualityProgress = Math.min((stats.averageQuality / requirements.minQuality) * 100, 100);
  
  // Weight the progress components
  const totalProgress = Math.min(
    (hoursProgress * 0.5 + activitiesProgress * 0.3 + qualityProgress * 0.2),
    99 // Never reach 100 unless all requirements are met
  );

  // Find or create badge
  let badge = await prisma.badge.findUnique({
    where: {
      sdgNumber_tier: { sdgNumber, tier }
    }
  });

  if (!badge) {
    badge = await prisma.badge.create({
      data: {
        sdgNumber,
        tier,
        name: getSDGBadgeName(sdgNumber, tier),
        description: getSDGBadgeDescription(sdgNumber, tier),
        icon: getSDGBadgeIcon(sdgNumber, tier),
        category: sdgNumber.toString(),
        requirement: {
          minHours: requirements.minHours,
          minActivities: requirements.minActivities,
          minQuality: requirements.minQuality,
        },
      }
    });
  }

  // Update or create user badge progress
  await prisma.userBadge.upsert({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id,
      }
    },
    update: { earnedAt: new Date() },
    create: {
      userId,
      badgeId: badge.id,
      earnedAt: new Date(),
    }
  });
}

/**
 * Update user's rank based on their achievements
 */
async function updateUserRank(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: {
          include: { badge: true }
        },
        participations: {
          where: { status: ParticipationStatus.VERIFIED }
        }
      }
    });

    if (!user) {
      console.error(`updateUserRank: User not found for userId ${userId}`);
      return;
    }

    const earnedBadges = user.badges.length;
    const verifiedHours = user.participations.reduce((sum: number, p: { hours: number | null }) => 
      sum + (p.hours || 0), 0);
    const impaktrScore = user.impactScore;

    let newRank: IndividualRank = IndividualRank.HELPER;

    // Find highest rank that user qualifies for
    const rankEntries = Object.entries(RANK_REQUIREMENTS) as [IndividualRank, RankRequirements][];
    for (const [rank, requirements] of rankEntries) {
      if (impaktrScore >= requirements.minScore &&
          verifiedHours >= requirements.minHours &&
          earnedBadges >= requirements.minBadges) {
        newRank = rank;
      }
    }

    // Update user rank if it changed
    if (newRank !== user.tier) {
      console.log(`updateUserRank: Updating ${userId} from ${user.tier} to ${newRank} (score: ${impaktrScore}, hours: ${verifiedHours}, badges: ${earnedBadges})`);
      
      await prisma.user.update({
        where: { id: userId },
        data: { tier: newRank }
      });

      // Create rank achievement (only if rank increased, not decreased)
      const currentRankIndex = INDIVIDUAL_RANK_BADGES.findIndex(b => b.rank === user.tier);
      const newRankIndex = INDIVIDUAL_RANK_BADGES.findIndex(b => b.rank === newRank);
      
      if (newRankIndex > currentRankIndex) {
        await prisma.achievement.create({
          data: {
            userId,
            type: 'rank_up',
            title: `Promoted to ${getRankDisplayName(newRank)}`,
            description: `Congratulations! You've been promoted to ${getRankDisplayName(newRank)} for your outstanding social impact contributions.`,
            points: 25,
            verifiedAt: new Date(),
          }
        });
      }
    } else {
      console.log(`updateUserRank: ${userId} rank unchanged (${user.tier}) - score: ${impaktrScore}, hours: ${verifiedHours}, badges: ${earnedBadges}`);
    }
  } catch (error) {
    console.error(`updateUserRank: Error updating rank for userId ${userId}:`, error);
    throw error;
  }
}

/**
 * Check for milestone achievements
 */
async function checkMilestoneAchievements(userId: string, participations: Array<{ hours: number | null; createdAt: Date; event: { sdg: string | null } }>): Promise<void> {
  const totalHours = participations.reduce((sum, p) => 
    sum + (p.hours || 0), 0);

  const milestones = [
    { hours: 10, name: 'First Steps', description: 'Completed your first 10 hours of verified impact' },
    { hours: 25, name: 'Getting Started', description: 'Reached 25 hours of social impact' },
    { hours: 50, name: 'Half Century', description: 'Achieved 50 hours of verified volunteering' },
    { hours: 100, name: 'Century Club', description: 'Completed 100 hours of social impact' },
    { hours: 250, name: 'Quarter Thousand', description: 'Reached 250 hours of community service' },
    { hours: 500, name: 'Half Thousand', description: 'Achieved 500 hours of verified impact' },
    { hours: 1000, name: 'Thousand Hours', description: 'Completed 1000 hours - truly exceptional dedication' }
  ];

  for (const milestone of milestones) {
    if (totalHours >= milestone.hours) {
      // Create milestone achievement
        await prisma.achievement.create({
          data: {
            userId,
            type: 'hours_milestone',
            title: milestone.name,
            description: milestone.description,
            points: 10,
            verifiedAt: new Date(),
          }
        });
    }
  }

  // SDG diversity achievements
  const uniqueSDGs = new Set();
  participations.forEach(p => {
    if (p.event.sdg) {
      uniqueSDGs.add(parseInt(p.event.sdg));
    }
  });

  const sdgMilestones = [
    { count: 3, name: 'SDG Explorer', description: 'Contributed to 3 different SDGs' },
    { count: 5, name: 'SDG Advocate', description: 'Made impact across 5 different SDGs' },
    { count: 10, name: 'SDG Champion', description: 'Contributed to 10 different SDGs' },
    { count: 17, name: 'SDG Master', description: 'Contributed to all 17 SDGs - incredible dedication!' }
  ];

  for (const milestone of sdgMilestones) {
    if (uniqueSDGs.size >= milestone.count) {
      await prisma.achievement.create({
        data: {
          userId,
          type: 'sdg_diversity',
          title: milestone.name,
          description: milestone.description,
          points: 15,
          verifiedAt: new Date(),
        }
      });
    }
  }
}

/**
 * Update organization tier based on member activity
 */
export async function updateOrganizationTier(organizationId: string): Promise<void> {
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
      events: {
        include: {
          participations: {
            where: { status: ParticipationStatus.VERIFIED }
          }
        }
      }
    }
  });

  if (!organization) return;

  const totalMembers = organization.members.length;
  if (totalMembers === 0) return;

  // Calculate organization metrics
  const activeMembers = organization.members.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (member: any) => member.user.participations.length > 0
  ).length;
  
  const employeeParticipationRate = (activeMembers / totalMembers) * 100;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalScore = organization.members.reduce((sum: number, member: any) => 
    sum + member.user.impactScore, 0);
  const averageScore = totalScore / totalMembers;

  const totalEvents = organization.events.length;

  const uniqueSDGs = new Set();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organization.members.forEach((member: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    member.user.participations.forEach((p: any) => {
      if (p.event.sdg) {
        uniqueSDGs.add(parseInt(p.event.sdg));
      }
    });
  });
  const sdgDiversity = uniqueSDGs.size;

  // Find highest tier that organization qualifies for
  let newTier: OrganizationTier = OrganizationTier.IMPACT_STARTER;
  
  const tierEntries = Object.entries(ORGANIZATION_TIER_REQUIREMENTS) as [OrganizationTier, OrganizationTierRequirements][];
  for (const [tier, requirements] of tierEntries) {
    if (employeeParticipationRate >= requirements.minEmployeeParticipation &&
        averageScore >= requirements.minAverageScore &&
        totalEvents >= requirements.minEvents &&
        sdgDiversity >= requirements.minSDGDiversity) {
      newTier = tier;
    }
  }

  // Update organization tier if it changed
  if (newTier !== organization.tier) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { tier: newTier }
    });
  }
}

// Helper functions for badge names and descriptions
function getSDGName(sdgNumber: number): string {
  const sdgNames: { [key: number]: string } = {
    1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health and Well-being', 4: 'Quality Education',
    5: 'Gender Equality', 6: 'Clean Water and Sanitation', 7: 'Affordable and Clean Energy',
    8: 'Decent Work and Economic Growth', 9: 'Industry, Innovation and Infrastructure',
    10: 'Reduced Inequalities', 11: 'Sustainable Cities and Communities',
    12: 'Responsible Consumption and Production', 13: 'Climate Action', 14: 'Life Below Water',
    15: 'Life on Land', 16: 'Peace, Justice and Strong Institutions', 17: 'Partnerships for the Goals'
  };
  return sdgNames[sdgNumber] || `SDG ${sdgNumber}`;
}

function getSDGBadgeName(sdgNumber: number, tier: BadgeTier, isOrganization: boolean = false): string {
  if (isOrganization) {
    return getOrganizationSDGBadgeName(sdgNumber, tier);
  }
  return getIndividualSDGBadgeName(sdgNumber, tier);
}

function getSDGBadgeDescription(sdgNumber: number, tier: BadgeTier, isOrganization: boolean = false): string {
  if (isOrganization) {
    return getOrganizationSDGBadgeDescription(sdgNumber, tier);
  }
  return getIndividualSDGBadgeDescription(sdgNumber, tier);
}

function getSDGBadgeIcon(sdgNumber: number, tier: BadgeTier): string {
  return `/icons/sdg-${sdgNumber}-${tier.toLowerCase()}.svg`;
}

function getRankDisplayName(rank: IndividualRank): string {
  const badge = INDIVIDUAL_RANK_BADGES.find(b => b.rank === rank);
  return badge?.name || rank.toString();
}

function getRankIcon(rank: IndividualRank): string {
  return `/icons/rank-${rank.toLowerCase()}.svg`;
}