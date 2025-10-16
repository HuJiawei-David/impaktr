import { prisma } from '@/lib/prisma';

/**
 * Calculate organization KPIs
 */
export async function calculateOrganizationKPIs(orgId: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        activities: true,
        events: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const totalMembers = organization.members.length;
    const activeMembers = organization.members.filter(
      (m) => m.status === 'active'
    ).length;
    const participationRate = totalMembers > 0
      ? (activeMembers / totalMembers) * 100
      : 0;

    const totalImpactScore = organization.members.reduce(
      (sum, m) => sum + m.user.impactScore,
      0
    );
    const averageImpactScore = totalMembers > 0
      ? totalImpactScore / totalMembers
      : 0;

    // Update organization
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        participationRate: Math.round(participationRate * 10) / 10,
        averageImpactScore: Math.round(averageImpactScore),
        eventCount: organization.events.length,
      },
    });

    return {
      totalMembers,
      activeMembers,
      participationRate,
      averageImpactScore,
      eventCount: organization.events.length,
      volunteerHours: organization.volunteerHours,
    };
  } catch (error) {
    console.error('Calculate KPIs error:', error);
    throw error;
  }
}

/**
 * Calculate ESG score from metrics
 */
export async function calculateESGScore(orgId: string, period: string) {
  try {
    const metrics = await prisma.eSGMetric.findMany({
      where: {
        organizationId: orgId,
        period,
      },
    });

    if (metrics.length === 0) {
      return 0;
    }

    // Calculate weighted score by category
    const categories = ['environmental', 'social', 'governance'];
    const categoryScores: Record<string, number> = {};

    categories.forEach((category) => {
      const categoryMetrics = metrics.filter((m) => m.category === category);
      if (categoryMetrics.length > 0) {
        const avgScore =
          categoryMetrics.reduce((sum: number, m) => sum + m.value, 0) /
          categoryMetrics.length;
        categoryScores[category] = avgScore;
      }
    });

    // Overall score (equal weighting)
    const overallScore =
      Object.values(categoryScores).reduce((sum, score) => sum + score, 0) /
      Object.keys(categoryScores).length;

    // Update organization
    await prisma.organization.update({
      where: { id: orgId },
      data: { esgScore: Math.round(overallScore * 10) / 10 },
    });

    return overallScore;
  } catch (error) {
    console.error('Calculate ESG score error:', error);
    throw error;
  }
}

/**
 * Award corporate badges based on criteria
 */
export async function awardCorporateBadges(orgId: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: true,
        esgMetrics: true,
        corporateBadges: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const allBadges = await prisma.corporateBadge.findMany();

    const earnedBadges = [];
    for (const badge of allBadges) {
      const alreadyEarned = organization.corporateBadges?.some(
        (eb: { badgeId: string }) => eb.badgeId === badge.id
      );
      if (alreadyEarned) continue;

      // Check badge criteria
      const criteria = badge.criteria as Record<string, number>;
      let meetsAll = true;

      if (criteria.esgScore && organization.esgScore) {
        meetsAll = meetsAll && organization.esgScore >= criteria.esgScore;
      }
      if (criteria.participationRate) {
        meetsAll =
          meetsAll && organization.participationRate >= criteria.participationRate;
      }
      if (criteria.eventCount) {
        meetsAll = meetsAll && organization.eventCount >= criteria.eventCount;
      }
      if (criteria.volunteerHours) {
        meetsAll =
          meetsAll && organization.volunteerHours >= criteria.volunteerHours;
      }

      if (meetsAll) {
        await prisma.corporateBadgeEarned.create({
          data: {
            organizationId: orgId,
            badgeId: badge.id,
          },
        });
        earnedBadges.push(badge);
      }
    }

    return earnedBadges;
  } catch (error) {
    console.error('Award badges error:', error);
    throw error;
  }
}

/**
 * Generate organization leaderboard
 */
export async function generateLeaderboard(period: string, category: string) {
  try {
    let whereClause: Record<string, unknown> = {};

    if (category.startsWith('sdg-')) {
      // Filter by SDG focus (not implemented in this schema)
      whereClause = {};
    } else if (category === 'industry') {
      // Filter by industry (all industries)
      whereClause = { industry: { not: null } };
    }

    const organizations = await prisma.organization.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        logo: true,
        esgScore: true,
        industry: true,
        type: true,
      },
      orderBy: {
        esgScore: 'desc',
      },
      take: 100,
    });

    const rankings = organizations.map((org, index) => ({
      orgId: org.id,
      rank: index + 1,
      name: org.name,
      logo: org.logo,
      score: org.esgScore || 0,
      industry: org.industry || 'Not specified',
      trend: 0, // Would need historical data
    }));

    await prisma.corporateLeaderboard.upsert({
      where: {
        period_category: {
          period,
          category,
        },
      },
      create: {
        period,
        category,
        rankings: rankings,
      },
      update: {
        rankings: rankings,
      },
    });

    return rankings;
  } catch (error) {
    console.error('Generate leaderboard error:', error);
    throw error;
  }
}

/**
 * Update organization tier based on points
 */
export async function updateOrganizationTier(orgId: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const tiers = [
      { name: 'REGISTERED', threshold: 0 },
      { name: 'PARTICIPANT', threshold: 100 },
      { name: 'COMMUNITY_ALLY', threshold: 500 },
      { name: 'CONTRIBUTOR', threshold: 1000 },
      { name: 'CSR_PRACTITIONER', threshold: 2500 },
      { name: 'CSR_LEADER', threshold: 5000 },
      { name: 'ESG_CHAMPION', threshold: 10000 },
      { name: 'TRUSTED_PARTNER', threshold: 25000 },
      { name: 'INDUSTRY_BENCHMARK', threshold: 50000 },
      { name: 'GLOBAL_IMPACT_LEADER', threshold: 100000 },
    ];

    let newTier = tiers[0].name;
    let nextThreshold = tiers[1].threshold;

    for (let i = tiers.length - 1; i >= 0; i--) {
      if (organization.tierPoints >= tiers[i].threshold) {
        newTier = tiers[i].name;
        nextThreshold = i < tiers.length - 1 ? tiers[i + 1].threshold : organization.nextTierAt;
        break;
      }
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionTier: newTier,
        nextTierAt: nextThreshold,
      },
    });

    return {
      tier: newTier,
      points: organization.tierPoints,
      nextTierAt: nextThreshold,
    };
  } catch (error) {
    console.error('Update tier error:', error);
    throw error;
  }
}
