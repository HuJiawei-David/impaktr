// home/ubuntu/impaktrweb/src/app/api/users/score/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateImpaktrScore, calculateOrganizationScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';
import { z } from 'zod';
import { OrganizationMember, User, Participation, Event, Verification, ScoreHistory, OrganizationScoreHistory } from '@prisma/client';

// Extended types for includes based on actual Prisma schema
type ParticipationWithEvent = Participation & {
  event: Event;
  verifications: Verification[];
};

type UserBadgeWithBadge = {
  id: string;
  badgeId: string;
  earnedAt: Date;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
  };
};

type UserWithRelations = User & {
  participations: ParticipationWithEvent[];
  scoreHistory: ScoreHistory[];
  badges: UserBadgeWithBadge[];
};

const scoreQuerySchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  includeBreakdown: z.string().transform(str => str === 'true').optional(),
  includeHistory: z.string().transform(str => str === 'true').optional(),
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional().default('all'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { userId, organizationId, includeBreakdown, includeHistory, period } = scoreQuerySchema.parse(params);

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine target user (default to current user)
    const targetUserId = userId || currentUser.id;

    // Check if user has permission to view the requested score
    if (targetUserId !== currentUser.id) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true }
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      // Note: Privacy checks would need to be implemented based on your privacy model
    }

    if (organizationId) {
      // Get organization score
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          members: {
            include: {
              user: {
                include: {
                  participations: {
                    where: { status: 'VERIFIED' },
                    include: { 
                      event: true,
                      verifications: true
                    }
                  }
                }
              }
            }
          },
          scoreHistory: {
            orderBy: { createdAt: 'desc' },
            take: includeHistory ? 50 : 10
          }
        }
      });

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      // Check permission for organization score
      const isMember = organization.members.some(member => member.userId === currentUser.id);
      if (!isMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const currentScore = await calculateOrganizationScore(organizationId);
      
      // Update organization score if it has changed
      if (currentScore !== organization.esgScore) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: { esgScore: currentScore }
        });
      }

      interface OrganizationScoreResponse {
        type: 'organization';
        organizationId: string;
        organizationName: string | null;
        currentScore: number;
        tier: string | null;
        lastUpdated: Date;
        breakdown?: {
          employeeParticipation: number;
          hoursPerEmployee: number;
          qualityRating: number;
          verificationRate: number;
          skillsImpact: number;
          causeDiversity: number;
          globalFairness: number;
          totalMembers: number;
          activeMembers: number;
          totalHours: number;
          uniqueSDGs: number;
        };
        history?: Array<{
          date: Date;
          score: number;
          change: number;
          components: {
            employeeParticipation: number;
            hoursPerEmployee: number;
            qualityRating: number;
            verificationRate: number;
            skillsImpact: number;
            causeDiversity: number;
            globalFairness: number;
          };
        }>;
      }

      const response: OrganizationScoreResponse = {
        type: 'organization',
        organizationId,
        organizationName: organization.name,
        currentScore,
        tier: organization.subscriptionTier,
        lastUpdated: new Date(),
      };

      if (includeBreakdown) {
        // Calculate detailed breakdown for organization
        const totalMembers = organization.members.length;
        const activeMembers = organization.members.filter(
          member => member.user.participations.length > 0
        ).length;

        const totalHours = organization.members.reduce((sum: number, member) => {
          return sum + member.user.participations.reduce((h: number, p: Participation) => 
            h + (p.hours || 0), 0);
        }, 0);

        const allParticipations = organization.members.flatMap(m => m.user.participations);
        const avgQuality = allParticipations.reduce((sum: number, p: ParticipationWithEvent) => 
          sum + 1.0, 0) / Math.max(allParticipations.length, 1); // Default quality since field doesn't exist

        const verificationRate = allParticipations.length / Math.max(
          organization.members.reduce((sum: number, member) => 
            sum + member.user.participations.length, 0), 1);

        const skilledParticipations = allParticipations.filter((p: ParticipationWithEvent) => 
          1.0 > 1.0).length; // Default since skillMultiplier doesn't exist
        const skillsImpact = skilledParticipations / Math.max(allParticipations.length, 1);

        const uniqueSDGs = new Set<string>();
        allParticipations.forEach((p: ParticipationWithEvent) => {
          if (p.event?.sdg) {
            uniqueSDGs.add(p.event.sdg);
          }
        });
        const causeDiversity = uniqueSDGs.size / 17;

        response.breakdown = {
          employeeParticipation: (activeMembers / totalMembers) * 100,
          hoursPerEmployee: totalHours / totalMembers,
          qualityRating: avgQuality,
          verificationRate: verificationRate * 100,
          skillsImpact: skillsImpact * 100,
          causeDiversity: causeDiversity * 100,
          globalFairness: 1.0,
          totalMembers,
          activeMembers,
          totalHours,
          uniqueSDGs: uniqueSDGs.size
        };
      }

      if (includeHistory) {
        response.history = organization.scoreHistory.map((entry: OrganizationScoreHistory) => ({
          date: entry.createdAt,
          score: entry.newScore,
          change: entry.change,
          components: {
            employeeParticipation: entry.employeeParticipation,
            hoursPerEmployee: entry.hoursPerEmployee,
            qualityRating: entry.qualityRating,
            verificationRate: entry.verificationRate,
            skillsImpact: entry.skillsImpact,
            causeDiversity: entry.causeDiversity,
            globalFairness: entry.globalFairness
          }
        }));
      }

      return NextResponse.json(response);
    } else {
      // Get individual user score
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          participations: {
            where: { status: 'VERIFIED' },
            include: {
              event: true,
              verifications: true
            }
          },
          scoreHistory: {
            orderBy: { createdAt: 'desc' },
            take: includeHistory ? 50 : 10
          },
          badges: {
            include: { badge: true }
          }
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const currentScore = await calculateImpaktrScore(targetUserId);
      
      // Update user score if it has changed
      if (currentScore !== user.impactScore) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { impactScore: currentScore }
        });

        // Check for new badges/achievements
        await checkAndAwardBadges(targetUserId);
      }

      interface IndividualScoreResponse {
        type: 'individual';
        userId: string;
        userName: string | null;
        currentScore: number;
        previousScore: number;
        rank: string;
        lastUpdated: Date;
        breakdown?: {
          hoursComponent: number;
          intensityComponent: number;
          skillComponent: number;
          qualityComponent: number;
          verificationComponent: number;
          locationComponent: number;
          totalHours: number;
          totalEvents: number;
          badgesEarned: number;
          uniqueSDGs: number;
        };
        history?: Array<{
          date: Date;
          score: number;
          change: number;
          reason: string | null;
          components: {
            hours: number;
            intensity: number;
            skill: number;
            quality: number;
            verification: number;
            location: number;
          };
          eventId: string | null;
          participationId: string | null;
        }>;
        nextRank?: {
          name: string;
          threshold: number;
          progress: number;
          pointsNeeded: number;
        };
      }

      const response: IndividualScoreResponse = {
        type: 'individual',
        userId: targetUserId,
        userName: user.name || user.email,
        currentScore,
        previousScore: user.scoreHistory[0]?.oldScore || 0,
        rank: user.tier,
        lastUpdated: new Date(),
      };

      if (includeBreakdown) {
        // Calculate detailed breakdown for individual
        let totalHours = 0;
        let avgIntensity = 0;
        let avgSkill = 0;
        let avgQuality = 0;
        let avgVerification = 0;
        let locationMultiplier = 1.0;

        if (user.participations.length > 0) {
          totalHours = user.participations.reduce((sum: number, p: ParticipationWithEvent) => 
            sum + (p.hours || 0), 0);

          avgIntensity = user.participations.reduce((sum: number, p: ParticipationWithEvent) => 
            sum + 1.0, 0) / user.participations.length; // Default intensity since field doesn't exist

          avgSkill = user.participations.reduce((sum: number, p: ParticipationWithEvent) => 
            sum + 1.0, 0) / user.participations.length; // Default skill multiplier

          avgQuality = user.participations.reduce((sum: number, p: ParticipationWithEvent) => 
            sum + 1.0, 0) / user.participations.length; // Default quality rating

          avgVerification = user.participations.reduce((sum: number, p: ParticipationWithEvent) => {
            let vFactor = 0.8; // Self verification
            if (p.verifications?.some((v: Verification) => v.type === 'ORGANIZER')) vFactor = 1.0;
            else if (p.verifications?.some((v: Verification) => v.type === 'PEER')) vFactor = 1.1;
            else if (p.verifications?.some((v: Verification) => v.type === 'GPS')) vFactor = 1.05;
            return sum + vFactor;
          }, 0) / user.participations.length;

          // Location multiplier based on user's location
          const location = user.location;
          if (location && typeof location === 'string') {
            // Apply location-based multiplier (from scoring.ts)
            const countryMultipliers: { [key: string]: number } = {
              'Malaysia': 1.1, 'Indonesia': 1.2, 'Philippines': 1.2,
              'Thailand': 1.1, 'Vietnam': 1.2, 'Singapore': 1.0,
              'United States': 1.0, 'United Kingdom': 1.0,
            };
            // Extract country from location string if it contains country info
            const country = user.country || 'Unknown';
            locationMultiplier = countryMultipliers[country] || 1.0;
          }
        }

        response.breakdown = {
          hoursComponent: Math.log10(totalHours + 1) * 100,
          intensityComponent: avgIntensity,
          skillComponent: avgSkill,
          qualityComponent: avgQuality,
          verificationComponent: avgVerification,
          locationComponent: locationMultiplier,
          totalHours,
          totalEvents: user.participations.length,
          badgesEarned: user.badges.length,
          uniqueSDGs: new Set(user.participations.flatMap((p: ParticipationWithEvent) => p.event?.sdg ? [p.event.sdg] : [])).size
        };
      }

      if (includeHistory) {
        response.history = user.scoreHistory.map((entry: ScoreHistory) => ({
          date: entry.createdAt,
          score: entry.newScore,
          change: entry.change,
          reason: entry.reason,
          components: {
            hours: entry.hoursComponent,
            intensity: entry.intensityComponent,
            skill: entry.skillComponent,
            quality: entry.qualityComponent,
            verification: entry.verificationComponent,
            location: entry.locationComponent
          },
          eventId: entry.eventId,
          participationId: entry.participationId
        }));
      }

      // Calculate progress to next rank
      const rankThresholds = {
        'HELPER': 0, 'SUPPORTER': 50, 'CONTRIBUTOR': 100, 'BUILDER': 200,
        'ADVOCATE': 350, 'CHANGEMAKER': 500, 'MENTOR': 650, 'LEADER': 800,
        'AMBASSADOR': 900, 'GLOBAL_CITIZEN': 950
      };

      const currentRankThreshold = rankThresholds[user.tier as keyof typeof rankThresholds] || 0;
      const nextRankEntry = Object.entries(rankThresholds).find(([_, threshold]) => 
        threshold > currentRankThreshold);
      
      if (nextRankEntry) {
        const [nextRank, nextThreshold] = nextRankEntry;
        response.nextRank = {
          name: nextRank,
          threshold: nextThreshold,
          progress: Math.min(((currentScore - currentRankThreshold) / (nextThreshold - currentRankThreshold)) * 100, 100),
          pointsNeeded: Math.max(nextThreshold - currentScore, 0)
        };
      }

      return NextResponse.json(response);
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Recalculate and update score
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, organizationId, forceRecalculate } = body;

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (organizationId) {
      // Recalculate organization score
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { members: true }
      });

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      // Check permission
      const isMember = organization.members.some(member => member.userId === currentUser.id);
      const isOwner = organization.members.some((member: OrganizationMember) => member.userId === currentUser.id && member.role === 'owner');
      
      if (!isMember && !isOwner) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const oldScore = organization.esgScore;
      const newScore = await calculateOrganizationScore(organizationId);

      // Update organization score
      await prisma.organization.update({
        where: { id: organizationId },
        data: { esgScore: newScore }
      });

      // Create score history entry
      if (oldScore !== newScore || forceRecalculate) {
        await prisma.organizationScoreHistory.create({
          data: {
            organizationId,
            oldScore: oldScore || 0,
            newScore,
            change: newScore - (oldScore || 0),
            // Additional breakdown would be calculated here
            employeeParticipation: 0, // Calculated in breakdown
            hoursPerEmployee: 0,
            qualityRating: 0,
            verificationRate: 0,
            skillsImpact: 0,
            causeDiversity: 0,
            globalFairness: 1.0
          }
        });
      }

      return NextResponse.json({
        success: true,
        organizationId,
        oldScore,
        newScore,
        change: newScore - (oldScore || 0),
        updated: oldScore !== newScore
      });

    } else {
      // Recalculate individual score
      const targetUserId = userId || currentUser.id;
      
      if (targetUserId !== currentUser.id) {
        return NextResponse.json({ error: 'Can only recalculate own score' }, { status: 403 });
      }

      const oldScore = currentUser.impactScore;
      const newScore = await calculateImpaktrScore(targetUserId);

      // Update user score
      await prisma.user.update({
        where: { id: targetUserId },
        data: { impactScore: newScore }
      });

      // Check for new badges/achievements
      await checkAndAwardBadges(targetUserId);

      // Create score history entry
      if (oldScore !== newScore || forceRecalculate) {
        await prisma.scoreHistory.create({
          data: {
            userId: targetUserId,
            oldScore,
            newScore,
            change: newScore - oldScore,
            reason: forceRecalculate ? 'manual_recalculation' : 'automatic_update',
            // Breakdown components would be calculated here
            hoursComponent: 0,
            intensityComponent: 0,
            skillComponent: 0,
            qualityComponent: 0,
            verificationComponent: 0,
            locationComponent: 0
          }
        });
      }

      return NextResponse.json({
        success: true,
        userId: targetUserId,
        oldScore,
        newScore,
        change: newScore - oldScore,
        updated: oldScore !== newScore
      });
    }

  } catch (error) {
    console.error('Error recalculating score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}