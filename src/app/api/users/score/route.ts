// home/ubuntu/impaktrweb/src/app/api/users/score/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateImpaktrScore, calculateOrganizationScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';
import { z } from 'zod';

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
        include: { profile: true }
      });

      if (!targetUser || !targetUser.profile?.isPublic) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (organizationId) {
      // Get organization score
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          owner: true,
          members: {
            include: {
              user: {
                include: {
                  participations: {
                    where: { status: 'VERIFIED' },
                    include: { event: true }
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
      if (!isMember && organization.ownerId !== currentUser.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const currentScore = await calculateOrganizationScore(organizationId);
      
      // Update organization score if it has changed
      if (currentScore !== organization.impaktrScore) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: { impaktrScore: currentScore }
        });
      }

      const response: any = {
        type: 'organization',
        organizationId,
        organizationName: organization.name,
        currentScore,
        tier: organization.tier,
        lastUpdated: new Date(),
      };

      if (includeBreakdown) {
        // Calculate detailed breakdown for organization
        const totalMembers = organization.members.length;
        const activeMembers = organization.members.filter(
          member => member.user.participations.length > 0
        ).length;

        const totalHours = organization.members.reduce((sum, member) => {
          return sum + member.user.participations.reduce((h, p) => 
            h + (p.hoursActual || p.hoursCommitted), 0);
        }, 0);

        const allParticipations = organization.members.flatMap(m => m.user.participations);
        const avgQuality = allParticipations.reduce((sum, p) => 
          sum + (p.qualityRating || 1.0), 0) / Math.max(allParticipations.length, 1);

        const verificationRate = allParticipations.length / Math.max(
          organization.members.reduce((sum, member) => 
            sum + member.user.participations.length, 0), 1);

        const skilledParticipations = allParticipations.filter(p => 
          (p.skillMultiplier || 1.0) > 1.0).length;
        const skillsImpact = skilledParticipations / Math.max(allParticipations.length, 1);

        const uniqueSDGs = new Set();
        allParticipations.forEach(p => {
          p.event.sdgTags.forEach(sdg => uniqueSDGs.add(sdg));
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
        response.history = organization.scoreHistory.map(entry => ({
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
          profile: true,
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
            include: { badge: true },
            where: { earnedAt: { not: null } }
          }
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const currentScore = await calculateImpaktrScore(targetUserId);
      
      // Update user score if it has changed
      if (currentScore !== user.impaktrScore) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { impaktrScore: currentScore }
        });

        // Check for new badges/achievements
        await checkAndAwardBadges(targetUserId);
      }

      const response: any = {
        type: 'individual',
        userId: targetUserId,
        userName: user.profile?.displayName || `${user.profile?.firstName} ${user.profile?.lastName}`.trim(),
        currentScore,
        previousScore: user.scoreHistory[0]?.oldScore || 0,
        rank: user.currentRank,
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
          totalHours = user.participations.reduce((sum, p) => 
            sum + (p.hoursActual || p.hoursCommitted), 0);

          avgIntensity = user.participations.reduce((sum, p) => 
            sum + (p.event.intensity || 1.0), 0) / user.participations.length;

          avgSkill = user.participations.reduce((sum, p) => 
            sum + (p.skillMultiplier || 1.0), 0) / user.participations.length;

          avgQuality = user.participations.reduce((sum, p) => 
            sum + (p.qualityRating || 1.0), 0) / user.participations.length;

          avgVerification = user.participations.reduce((sum, p) => {
            let vFactor = 0.8; // Self verification
            if (p.verifications.some(v => v.type === 'ORGANIZER')) vFactor = 1.0;
            else if (p.verifications.some(v => v.type === 'PEER')) vFactor = 1.1;
            else if (p.verifications.some(v => v.type === 'GPS')) vFactor = 1.05;
            return sum + vFactor;
          }, 0) / user.participations.length;

          // Location multiplier based on user's location
          const location = user.profile?.location as any;
          if (location?.country) {
            // Apply location-based multiplier (from scoring.ts)
            const countryMultipliers: { [key: string]: number } = {
              'Malaysia': 1.1, 'Indonesia': 1.2, 'Philippines': 1.2,
              'Thailand': 1.1, 'Vietnam': 1.2, 'Singapore': 1.0,
              'United States': 1.0, 'United Kingdom': 1.0,
            };
            locationMultiplier = countryMultipliers[location.country] || 1.0;
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
          uniqueSDGs: new Set(user.participations.flatMap(p => p.event.sdgTags)).size
        };
      }

      if (includeHistory) {
        response.history = user.scoreHistory.map(entry => ({
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

      const currentRankThreshold = rankThresholds[user.currentRank as keyof typeof rankThresholds] || 0;
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
      const isOwner = organization.ownerId === currentUser.id;
      
      if (!isMember && !isOwner) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const oldScore = organization.impaktrScore;
      const newScore = await calculateOrganizationScore(organizationId);

      // Update organization score
      await prisma.organization.update({
        where: { id: organizationId },
        data: { impaktrScore: newScore }
      });

      // Create score history entry
      if (oldScore !== newScore || forceRecalculate) {
        await prisma.organizationScoreHistory.create({
          data: {
            organizationId,
            oldScore,
            newScore,
            change: newScore - oldScore,
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
        change: newScore - oldScore,
        updated: oldScore !== newScore
      });

    } else {
      // Recalculate individual score
      const targetUserId = userId || currentUser.id;
      
      if (targetUserId !== currentUser.id) {
        return NextResponse.json({ error: 'Can only recalculate own score' }, { status: 403 });
      }

      const oldScore = currentUser.impaktrScore;
      const newScore = await calculateImpaktrScore(targetUserId);

      // Update user score
      await prisma.user.update({
        where: { id: targetUserId },
        data: { impaktrScore: newScore }
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