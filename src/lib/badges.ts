// home/ubuntu/impaktrweb/src/lib/badges.ts

import { prisma } from './prisma';
import { BadgeTier, IndividualRank, OrganizationTier, ParticipationStatus } from '@prisma/client';

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

const RANK_REQUIREMENTS: Record<IndividualRank, RankRequirements> = {
  [IndividualRank.HELPER]: { minScore: 0, minHours: 0, minBadges: 0 },
  [IndividualRank.SUPPORTER]: { minScore: 50, minHours: 10, minBadges: 1 },
  [IndividualRank.CONTRIBUTOR]: { minScore: 100, minHours: 25, minBadges: 3 },
  [IndividualRank.BUILDER]: { minScore: 200, minHours: 50, minBadges: 6 },
  [IndividualRank.ADVOCATE]: { minScore: 350, minHours: 100, minBadges: 10 },
  [IndividualRank.CHANGEMAKER]: { minScore: 500, minHours: 200, minBadges: 15 },
  [IndividualRank.MENTOR]: { minScore: 700, minHours: 350, minBadges: 22 },
  [IndividualRank.LEADER]: { minScore: 850, minHours: 500, minBadges: 30 },
  [IndividualRank.AMBASSADOR]: { minScore: 950, minHours: 750, minBadges: 40 },
  [IndividualRank.GLOBAL_CITIZEN]: { minScore: 1000, minHours: 1000, minBadges: 50 },
};

const ORGANIZATION_TIER_REQUIREMENTS: Record<OrganizationTier, OrganizationTierRequirements> = {
  [OrganizationTier.REGISTERED]: { minEmployeeParticipation: 0, minAverageScore: 0, minEvents: 0, minSDGDiversity: 0 },
  [OrganizationTier.PARTICIPANT]: { minEmployeeParticipation: 5, minAverageScore: 10, minEvents: 1, minSDGDiversity: 1 },
  [OrganizationTier.COMMUNITY_ALLY]: { minEmployeeParticipation: 10, minAverageScore: 15, minEvents: 3, minSDGDiversity: 2 },
  [OrganizationTier.CONTRIBUTOR]: { minEmployeeParticipation: 20, minAverageScore: 25, minEvents: 5, minSDGDiversity: 3 },
  [OrganizationTier.CSR_PRACTITIONER]: { minEmployeeParticipation: 35, minAverageScore: 40, minEvents: 10, minSDGDiversity: 5 },
  [OrganizationTier.CSR_LEADER]: { minEmployeeParticipation: 50, minAverageScore: 55, minEvents: 20, minSDGDiversity: 7 },
  [OrganizationTier.ESG_CHAMPION]: { minEmployeeParticipation: 65, minAverageScore: 70, minEvents: 35, minSDGDiversity: 10 },
  [OrganizationTier.TRUSTED_PARTNER]: { minEmployeeParticipation: 75, minAverageScore: 80, minEvents: 50, minSDGDiversity: 12 },
  [OrganizationTier.INDUSTRY_BENCHMARK]: { minEmployeeParticipation: 85, minAverageScore: 90, minEvents: 75, minSDGDiversity: 15 },
  [OrganizationTier.GLOBAL_IMPACT_LEADER]: { minEmployeeParticipation: 95, minAverageScore: 95, minEvents: 100, minSDGDiversity: 17 },
};

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
function groupParticipationsBySDG(participations: any[]): Record<number, any[]> {
  const sdgGroups: Record<number, any[]> = {};
  
  participations.forEach(participation => {
    participation.event.sdgTags.forEach((sdg: number) => {
      if (!sdgGroups[sdg]) {
        sdgGroups[sdg] = [];
      }
      sdgGroups[sdg].push(participation);
    });
  });

  return sdgGroups;
}

/**
 * Check and award SDG-specific badges
 */
async function checkSDGBadges(userId: string, sdgNumber: number, participations: any[]): Promise<void> {
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
function calculateSDGStats(participations: any[]) {
  const totalHours = participations.reduce((sum, p) => 
    sum + (p.hoursActual || p.hoursCommitted), 0);
  
  const totalActivities = participations.length;
  
  const totalQuality = participations.reduce((sum, p) => 
    sum + (p.qualityRating || 1.0), 0);
  const averageQuality = totalQuality / Math.max(totalActivities, 1);

  const uniqueSkills = new Set();
  participations.forEach(p => {
    p.event.skills?.forEach((skill: string) => uniqueSkills.add(skill));
  });

  const verificationTypes = participations.reduce((acc, p) => {
    p.verifications.forEach((v: any) => {
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
      new Date(b.verifiedAt || b.updatedAt).getTime() - new Date(a.verifiedAt || a.updatedAt).getTime()
    )[0]
  };
}

/**
 * Award an SDG badge to a user
 */
async function awardSDGBadge(userId: string, sdgNumber: number, tier: BadgeTier, stats: any): Promise<void> {
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
        minHours: BADGE_REQUIREMENTS[tier].minHours,
        minActivities: BADGE_REQUIREMENTS[tier].minActivities,
        minQuality: BADGE_REQUIREMENTS[tier].minQuality,
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
        progress: 100,
        earnedAt: new Date(),
      }
    });

    // Create achievement record
    await prisma.achievement.create({
      data: {
        userId,
        type: 'badge_earned',
        name: `${badge.name} Earned`,
        description: `Congratulations! You've earned the ${badge.name} badge for your contributions to ${getSDGName(sdgNumber)}.`,
        icon: badge.icon,
        data: {
          sdgNumber,
          tier,
          stats
        }
      }
    });

  } else if (!existingUserBadge.earnedAt) {
    // Update existing badge to earned
    await prisma.userBadge.update({
      where: { id: existingUserBadge.id },
      data: {
        progress: 100,
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
  stats: any, 
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
        minHours: requirements.minHours,
        minActivities: requirements.minActivities,
        minQuality: requirements.minQuality,
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
    update: { progress: totalProgress },
    create: {
      userId,
      badgeId: badge.id,
      progress: totalProgress,
    }
  });
}

/**
 * Update user's rank based on their achievements
 */
async function updateUserRank(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: {
        where: { earnedAt: { not: null } },
        include: { badge: true }
      },
      participations: {
        where: { status: ParticipationStatus.VERIFIED }
      }
    }
  });

  if (!user) return;

  const earnedBadges = user.badges.length;
  const verifiedHours = user.participations.reduce((sum, p) => 
    sum + (p.hoursActual || p.hoursCommitted), 0);
  const impaktrScore = user.impaktrScore;

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
  if (newRank !== user.currentRank) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentRank: newRank }
    });

    // Create rank achievement
    await prisma.achievement.create({
      data: {
        userId,
        type: 'rank_up',
        name: `Promoted to ${getRankDisplayName(newRank)}`,
        description: `Congratulations! You've been promoted to ${getRankDisplayName(newRank)} for your outstanding social impact contributions.`,
        icon: getRankIcon(newRank),
        data: {
          oldRank: user.currentRank,
          newRank,
          score: impaktrScore,
          hours: verifiedHours,
          badges: earnedBadges,
        }
      }
    });
  }
}

/**
 * Check for milestone achievements
 */
async function checkMilestoneAchievements(userId: string, participations: any[]): Promise<void> {
  const totalHours = participations.reduce((sum, p) => 
    sum + (p.hoursActual || p.hoursCommitted), 0);

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
      // Check if achievement already exists
      const existing = await prisma.achievement.findFirst({
        where: {
          userId,
          type: 'hours_milestone',
          data: {
            path: ['hours'],
            equals: milestone.hours
          }
        }
      });

      if (!existing) {
        await prisma.achievement.create({
          data: {
            userId,
            type: 'hours_milestone',
            name: milestone.name,
            description: milestone.description,
            icon: '⏰',
            data: {
              hours: milestone.hours,
              totalHours,
              achievedAt: new Date()
            }
          }
        });
      }
    }
  }

  // SDG diversity achievements
  const uniqueSDGs = new Set();
  participations.forEach(p => {
    p.event.sdgTags.forEach((sdg: number) => uniqueSDGs.add(sdg));
  });

  const sdgMilestones = [
    { count: 3, name: 'SDG Explorer', description: 'Contributed to 3 different SDGs' },
    { count: 5, name: 'SDG Advocate', description: 'Made impact across 5 different SDGs' },
    { count: 10, name: 'SDG Champion', description: 'Contributed to 10 different SDGs' },
    { count: 17, name: 'SDG Master', description: 'Contributed to all 17 SDGs - incredible dedication!' }
  ];

  for (const milestone of sdgMilestones) {
    if (uniqueSDGs.size >= milestone.count) {
      const existing = await prisma.achievement.findFirst({
        where: {
          userId,
          type: 'sdg_diversity',
          data: {
            path: ['sdgCount'],
            equals: milestone.count
          }
        }
      });

      if (!existing) {
        await prisma.achievement.create({
          data: {
            userId,
            type: 'sdg_diversity',
            name: milestone.name,
            description: milestone.description,
            icon: '🌍',
            data: {
              sdgCount: milestone.count,
              totalSDGs: uniqueSDGs.size,
              achievedAt: new Date()
            }
          }
        });
      }
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
    member => member.user.participations.length > 0
  ).length;
  
  const employeeParticipationRate = (activeMembers / totalMembers) * 100;
  
  const totalScore = organization.members.reduce((sum, member) => 
    sum + member.user.impaktrScore, 0);
  const averageScore = totalScore / totalMembers;

  const totalEvents = organization.events.length;

  const uniqueSDGs = new Set();
  organization.members.forEach(member => {
    member.user.participations.forEach(p => {
      p.event.sdgTags.forEach(sdg => uniqueSDGs.add(sdg));
    });
  });
  const sdgDiversity = uniqueSDGs.size;

  // Find highest tier that organization qualifies for
  let newTier: OrganizationTier = OrganizationTier.REGISTERED;
  
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

function getSDGBadgeName(sdgNumber: number, tier: BadgeTier): string {
  const sdgName = getSDGName(sdgNumber);
  const tierNames = {
    [BadgeTier.SUPPORTER]: 'Supporter',
    [BadgeTier.BUILDER]: 'Builder', 
    [BadgeTier.CHAMPION]: 'Champion',
    [BadgeTier.GUARDIAN]: 'Guardian'
  };
  return `${sdgName} ${tierNames[tier]}`;
}

function getSDGBadgeDescription(sdgNumber: number, tier: BadgeTier): string {
  const sdgName = getSDGName(sdgNumber);
  const descriptions = {
    [BadgeTier.SUPPORTER]: `Beginning your impact journey in ${sdgName}`,
    [BadgeTier.BUILDER]: `Building meaningful change in ${sdgName}`,
    [BadgeTier.CHAMPION]: `Leading impactful initiatives in ${sdgName}`,
    [BadgeTier.GUARDIAN]: `Protecting and advancing ${sdgName} with exceptional dedication`
  };
  return descriptions[tier];
}

function getSDGBadgeIcon(sdgNumber: number, tier: BadgeTier): string {
  return `/icons/sdg-${sdgNumber}-${tier.toLowerCase()}.svg`;
}

function getRankDisplayName(rank: IndividualRank): string {
  const displayNames = {
    [IndividualRank.HELPER]: 'Helper',
    [IndividualRank.SUPPORTER]: 'Supporter', 
    [IndividualRank.CONTRIBUTOR]: 'Contributor',
    [IndividualRank.BUILDER]: 'Builder',
    [IndividualRank.ADVOCATE]: 'Advocate',
    [IndividualRank.CHANGEMAKER]: 'Changemaker',
    [IndividualRank.MENTOR]: 'Mentor',
    [IndividualRank.LEADER]: 'Leader',
    [IndividualRank.AMBASSADOR]: 'Ambassador',
    [IndividualRank.GLOBAL_CITIZEN]: 'Global Citizen'
  };
  return displayNames[rank];
}

function getRankIcon(rank: IndividualRank): string {
  return `/icons/rank-${rank.toLowerCase()}.svg`;
}