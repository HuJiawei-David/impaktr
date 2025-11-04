import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';

export async function GET(request: NextRequest) {
  console.log('📥 [API] GET /api/users/profile - Request received');
  try {
    console.log('🔐 [API] Fetching session...');
    const session = await getSession();
    console.log('🔐 [API] Session fetched:', session ? `User ID: ${session.user?.id}` : 'No session');
    
    if (!session?.user?.id) {
      console.log('❌ [API] Unauthorized - No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('id') || session.user.id;
    console.log(`👤 [API] Fetching profile for user: ${userId}`);

    // Fetch user with related data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          volunteerProfile: {
            select: {
              interests: true,
              skills: true,
            }
          },
          badges: {
            orderBy: { earnedAt: 'desc' },
            take: 20,
            include: {
              badge: {
                select: {
                  id: true,
                  name: true,
                  sdgNumber: true,
                  tier: true,
                }
              }
            }
          },
          participations: {
            where: { 
              status: { in: ['VERIFIED', 'ATTENDED'] } // Include both VERIFIED and ATTENDED statuses
            },
            orderBy: { createdAt: 'desc' },
            take: 20, // Fetch more to filter by date
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  sdg: true,
                  startDate: true,
                  endDate: true,
                  status: true,
                  type: true,
                  skills: true,
                  intensity: true,
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      logo: true
                    }
                  }
                }
              }
            }
          },
          scoreHistory: {
            where: {
              participationId: { not: null },
              reason: { in: ['participation_verified', 'event_completion', 'participation_granted_approval'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              participationId: true,
              eventId: true,
              change: true,
              createdAt: true
            }
          },
          followers: {
            where: { followerId: session.user.id }
          },
          _count: {
            select: {
              followers: true,
              following: true,
            }
          }
        }
      });
    } catch (userFetchError) {
      console.error('Error fetching user data:', userFetchError);
      console.error('Error type:', userFetchError instanceof Error ? userFetchError.constructor.name : typeof userFetchError);
      console.error('Error message:', userFetchError instanceof Error ? userFetchError.message : String(userFetchError));
      console.error('Error stack:', userFetchError instanceof Error ? userFetchError.stack : 'No stack trace');
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate and normalize impactScore
    if (!Number.isFinite(user.impactScore) || isNaN(user.impactScore)) {
      console.warn(`Invalid impactScore for user ${user.id}: ${user.impactScore}, setting to 0`);
      user.impactScore = 0;
    }

    // Check if profile is public or if the current user has permission to view
    if (!user.isPublic && user.id !== session.user.id) {
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
    }

    // Recalculate impact score and tier dynamically (no hardcoding)
    if (user.userType === 'INDIVIDUAL') {
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
              console.error(`Error updating impactScore for user ${user.id}:`, updateError);
              // Continue without updating score
            }
          }
        } else {
          console.warn(`Invalid calculatedScore for user ${user.id}: ${calculatedScore}, skipping update`);
        }

        // Update tier/rank based on actual requirements (score, hours, badges)
        // This will be done by checkAndAwardBadges which calls updateUserRank
        try {
          await checkAndAwardBadges(user.id);
        } catch (badgeError) {
          console.error(`Error checking/awarding badges for user ${user.id}:`, badgeError);
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
          console.error(`Error fetching updated user ${user.id}:`, fetchError);
          // Continue with existing values
        }
      } catch (error) {
        console.error(`Error recalculating score for user ${user.id}:`, error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        // Use existing score - don't update, don't throw
        // Continue with existing score/tier if recalculation fails
      }
    }

    // Get ALL participations for accurate counting (not just VERIFIED)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allParticipations: any[] = [];
    try {
      allParticipations = await prisma.participation.findMany({
        where: { userId },
        select: {
          eventId: true,
          status: true,
          hours: true,
          event: {
            select: {
              status: true,
              endDate: true,
            }
          }
        }
      });
    } catch (participationError) {
      console.error('Error fetching all participations:', participationError);
      allParticipations = [];
    }
    
    // Also fetch all participations for stats (including past ones)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allParticipationsForOrgsForStats: any[] = [];
    try {
      allParticipationsForOrgsForStats = await prisma.participation.findMany({
        where: { userId },
        include: {
          event: {
            select: {
              id: true,
              status: true,
              endDate: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  logo: true
                }
              }
            }
          }
        }
      });
    } catch (participationError) {
      console.error('Error fetching all participations for orgs:', participationError);
      allParticipationsForOrgsForStats = [];
    }

    const currentDate = new Date();
    
    // Helper function to check if event has ended
    const eventHasEnded = (event: { status: string; endDate: Date }) => {
      return event.status === 'COMPLETED' || new Date(event.endDate) < currentDate;
    };

    // Calculate stats - only count participations from events that have ended
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pastEventParticipations = allParticipations.filter((p: any) => {
      if (!p.event) return false;
      return eventHasEnded(p.event);
    });
    
    const volunteerHours = pastEventParticipations
      .filter((p: { status: string; hours: number | null }) => p.status === 'VERIFIED' || p.status === 'ATTENDED')
      .reduce((sum: number, p: { hours: number | null }) => sum + (p.hours || 0), 0);
    
    // Events joined = unique events user participated in that have ended
    const eventsJoined = new Set(
      pastEventParticipations.map((p: { eventId: string }) => p.eventId)
    ).size;
    
    // Events completed = events with ATTENDED or VERIFIED status from past events
    const eventsCompleted = new Set(
      pastEventParticipations
        .filter((p: { status: string; eventId: string }) => p.status === 'ATTENDED' || p.status === 'VERIFIED')
        .map((p: { eventId: string }) => p.eventId)
    ).size;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const badgesEarned = user.badges.filter((b: any) => b.earnedAt).length;

    // Get user's global rank (using recalculated score)
    // Ensure currentScore is a valid finite number (convert from Decimal if needed)
    let currentScore = 0;
    if (user.userType === 'INDIVIDUAL') {
      const rawScore = user.impactScore;
      // Convert to number if it's a Decimal or string
      const numScore = typeof rawScore === 'number' ? rawScore : Number(rawScore);
      if (Number.isFinite(numScore) && !isNaN(numScore) && numScore >= 0) {
        currentScore = numScore;
      } else {
        console.warn(`Invalid impactScore for user ${user.id}: ${rawScore}, using 0 for rank calculation`);
        currentScore = 0;
      }
    }
    
    let rank: number | undefined = undefined;
    if (user.userType === 'INDIVIDUAL') {
      try {
        const higherScoreCount = await prisma.user.count({
          where: {
            impactScore: { gt: currentScore },
            userType: 'INDIVIDUAL'
          }
        });
        rank = higherScoreCount + 1;
      } catch (rankError) {
        console.error('Error calculating user rank:', rankError);
        console.error('Current score value:', currentScore, typeof currentScore);
        // Continue without rank
      }
    }

    // Get user's local rank (same country)
    let localRank: number | undefined = undefined;
    let localTotal: number | undefined = undefined;
    if (user.userType === 'INDIVIDUAL' && user.country && typeof user.country === 'string' && user.country.trim() !== '') {
      try {
        const localHigherCount = await prisma.user.count({
          where: {
            userType: 'INDIVIDUAL',
            country: user.country.trim(),
            impactScore: { gt: currentScore }
          }
        });
        const localTotalCount = await prisma.user.count({
          where: {
            userType: 'INDIVIDUAL',
            country: user.country.trim()
          }
        });
        localRank = localHigherCount + 1;
        localTotal = localTotalCount;
      } catch (localRankError) {
        console.error('Error calculating local rank:', localRankError);
        console.error('Current score value:', currentScore, typeof currentScore);
        console.error('Country value:', user.country, typeof user.country);
        // Continue without local rank
      }
    }

    // Create maps for score lookup (by participationId and eventId as fallback)
    const scoreMapByParticipation = new Map<string, number>();
    const scoreMapByEvent = new Map<string, number>();
    // Create map for score breakdown by participationId
    const scoreBreakdownMap = new Map<string, {
      hoursComponent: number;
      intensityComponent: number;
      skillComponent: number;
      qualityComponent: number;
      verificationComponent: number;
      locationComponent: number;
      change: number;
    }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user.scoreHistory || []).forEach((sh: any) => {
      if (sh.change) {
        if (sh.participationId) {
          scoreMapByParticipation.set(sh.participationId, sh.change);
          // Store breakdown for this participation
          scoreBreakdownMap.set(sh.participationId, {
            hoursComponent: sh.hoursComponent || 0,
            intensityComponent: sh.intensityComponent || 0,
            skillComponent: sh.skillComponent || 0,
            qualityComponent: sh.qualityComponent || 0,
            verificationComponent: sh.verificationComponent || 0,
            locationComponent: sh.locationComponent || 0,
            change: sh.change || 0
          });
        }
        if (sh.eventId) {
          // If multiple entries for same event, use the latest/max
          const existing = scoreMapByEvent.get(sh.eventId) || 0;
          scoreMapByEvent.set(sh.eventId, Math.max(existing, sh.change));
        }
      }
    });

    console.log(`🔍 ScoreHistory entries: ${user.scoreHistory?.length || 0}`);
    console.log(`🔍 ScoreMap by participation:`, Array.from(scoreMapByParticipation.entries()));
    console.log(`🔍 ScoreMap by event:`, Array.from(scoreMapByEvent.entries()));
    console.log(`🔍 ScoreBreakdownMap size:`, scoreBreakdownMap.size);
    console.log(`🔍 ScoreBreakdownMap entries:`, Array.from(scoreBreakdownMap.entries()).slice(0, 3));

    // Filter participations to only include events that have ended
    const activitiesDate = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allPastParticipations = (user.participations || []).filter((p: any) => {
      if (!p.event) return false;
      const eventHasEnded = p.event.status === 'COMPLETED' || 
                           (p.event.endDate && new Date(p.event.endDate) < activitiesDate);
      return eventHasEnded;
    });
    const pastParticipations = allPastParticipations.slice(0, 10); // Take top 10 for activities display
    
    // Format recent activities with score points (only from past events)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentActivities = pastParticipations.map((p: any) => {
      let sdgNumber: number | undefined = undefined;
      let sdgNumbers: number[] = [];
      if (p.event?.sdg) {
        const raw = p.event.sdg as unknown;
        try {
          if (typeof raw === 'string') {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                sdgNumbers = parsed
                  .map((s: unknown) => (typeof s === 'number' ? s : parseInt(String(s))))
                  .filter((n: number) => !isNaN(n) && n >= 1 && n <= 17);
              } else {
                const n = parseInt(String(parsed));
                if (!isNaN(n)) sdgNumbers = [n];
              }
            } catch {
              const n = parseInt(raw);
              if (!isNaN(n)) sdgNumbers = [n];
            }
          } else if (Array.isArray(raw)) {
            sdgNumbers = raw
              .map((s: unknown) => (typeof s === 'number' ? s : parseInt(String(s))))
              .filter((n: number) => !isNaN(n) && n >= 1 && n <= 17);
          } else if (typeof raw === 'number') {
            sdgNumbers = [raw];
          }
        } catch {
          sdgNumbers = [];
        }
        sdgNumber = sdgNumbers[0];
      }

      // Get score points from scoreHistory (try participationId first, then eventId)
      let points = scoreMapByParticipation.get(p.id) || 0;
      if (points === 0 && p.eventId) {
        points = scoreMapByEvent.get(p.eventId) || 0;
      }
      
      // If still no points, try to calculate or estimate
      // If this is the only participation and we have an impact score, use that
      if (points === 0 && user.participations.length === 1 && user.impactScore > 0) {
        points = Math.round(user.impactScore * 10) / 10;
      } else if (points === 0 && p.hours) {
        // Fallback: estimate based on hours (simplified scoring formula)
        // This is a rough estimate - actual scoring uses multiple multipliers
        const hours = p.hours || 0;
        const baseScore = Math.log10(hours + 1) * 100;
        // Apply typical multipliers (conservative estimate)
        points = Math.round((baseScore * 0.8 * 1.0 * 1.0 * 1.0) * 10) / 10;
      }

      // Map participation status to activity type
      // VERIFIED or ATTENDED = completed, others = joined
      let activityType: string = 'event_joined';
      if (p.status === 'VERIFIED' || p.status === 'ATTENDED') {
        activityType = 'event_completed';
      } else if (p.status === 'PENDING' || p.status === 'CONFIRMED') {
        activityType = 'event_joined';
      }

      // Get score breakdown for this participation (only if completed/verified)
      let scoreBreakdown = null;
      if (activityType === 'event_completed') {
        // First try to get from ScoreHistory
        if (scoreBreakdownMap.has(p.id)) {
          const storedBreakdown = scoreBreakdownMap.get(p.id);
          // Only use if it has valid hoursComponent (log-scaled, should be > 0)
          if (storedBreakdown && storedBreakdown.hoursComponent > 0) {
            scoreBreakdown = storedBreakdown;
          }
        }
        
        // If no valid breakdown from ScoreHistory, calculate it from participation data
        if (!scoreBreakdown && p.hours && p.hours > 0) {
          const hours = p.hours || 0;
          // Calculate H component (log-scaled hours)
          const H = Math.log10(hours + 1) * 100;
          
          // Get multipliers from event (with defaults)
          const I = p.event?.intensity || 1.0;
          const S = 1.0; // Skill multiplier - would need user skills vs event skills
          const Q = 1.0; // Quality - would need verification rating
          const V = p.status === 'VERIFIED' ? 1.1 : 1.0; // Verification factor
          const L = 1.0; // Location - would need user location
          
          scoreBreakdown = {
            hoursComponent: H,
            intensityComponent: I,
            skillComponent: S,
            qualityComponent: Q,
            verificationComponent: V,
            locationComponent: L,
            change: points // Use the points we already calculated
          };
        }
      }

      const result = {
        id: p.id,
        type: activityType,
        title: p.event?.title,
        date: p.event?.startDate || p.createdAt,
        sdg: sdgNumber,
        sdgs: sdgNumbers,
        points: Math.round(points * 10) / 10, // Round to 1 decimal
        hours: p.hours || 0,
        scoreBreakdown: scoreBreakdown
      };
      
      // Debug logging for completed events
      if (activityType === 'event_completed') {
        console.log(`📊 Activity ${p.id} (${p.event?.title}):`, {
          hasBreakdown: !!scoreBreakdown,
          points: result.points,
          hours: result.hours,
          status: p.status,
          breakdown: scoreBreakdown
        });
      }
      
      return result;
    });

    // Format badges
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const badges = user.badges.map((ub: any) => ({
      id: ub.badgeId,
      name: ub.badge.name,
      sdgNumber: ub.badge.sdgNumber,
      tier: ub.badge.tier,
      earnedAt: ub.earnedAt
    }));

    // Aggregate organizations worked with (only from COMPLETED/past events)
    // Fetch ALL verified or attended participations for organizations aggregation (not just recent 10)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allParticipationsForOrgAggregation: any[] = [];
    try {
      allParticipationsForOrgAggregation = await prisma.participation.findMany({
        where: {
          userId: userId,
          status: { in: ['VERIFIED', 'ATTENDED'] }
        },
        select: {
          hours: true,
          event: {
            select: {
              id: true,
              status: true,
              endDate: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  logo: true
                }
              }
            }
          }
        }
      });
    } catch (orgAggError) {
      console.error('Error fetching participations for org aggregation:', orgAggError);
      allParticipationsForOrgAggregation = [];
    }
    
    const now = new Date();
    const organizationsMap = new Map<string, { name: string; logo: string | null; events: number; hours: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allParticipationsForOrgsForStats.forEach((p: any) => {
      // Only count organizations from events that have ended
      const eventHasEnded = p.event?.status === 'COMPLETED' || 
                           (p.event?.endDate && new Date(p.event.endDate) < now);
      
      if (p.event && p.event.organization && eventHasEnded) {
        const orgId = p.event.organization.id;
        const existing = organizationsMap.get(orgId);
        if (existing) {
          existing.events += 1;
          existing.hours += p.hours || 0;
        } else {
          organizationsMap.set(orgId, {
            name: p.event.organization.name,
            logo: p.event.organization.logo,
            events: 1,
            hours: p.hours || 0
          });
        }
      }
    });
    const organizationsWorkedWith = Array.from(organizationsMap.entries()).map(([id, data]) => ({
      id,
      ...data
    })).sort((a, b) => b.hours - a.hours); // Sort by hours descending

    // Aggregate SDG breakdown (only from past events)
    // Handle multiple SDGs per event (same logic as sdgParticipations)
    const sdgMap = new Map<number, { events: number; hours: number; badges: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Note: This section processes simple single SDG events, allPastParticipations handles multiple SDGs below
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allPastParticipations.forEach((p: any) => {
      if (p.event && p.event.sdg) {
        const sdgNum = parseInt(p.event.sdg);
        const existing = sdgMap.get(sdgNum);
        if (existing) {
          existing.events += 1;
          existing.hours += p.hours || 0;
        } else {
          sdgMap.set(sdgNum, {
            events: 1,
            hours: p.hours || 0,
            badges: 0
          });
        }
      }
    });
    
    // Process past participations for SDG stats (handling multiple SDGs per event)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allPastParticipations.forEach((p: any) => {
      if (p.event?.sdg) {
        let sdgNumbers: number[] = [];
        
        // SDG can be stored as JSON string "[1,2,3]" or actual array or single number
        if (typeof p.event.sdg === 'string') {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(p.event.sdg);
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
            const num = parseInt(p.event.sdg);
            if (!isNaN(num)) {
              sdgNumbers = [num];
            }
          }
        } else if (Array.isArray(p.event.sdg)) {
          sdgNumbers = p.event.sdg.map((s: unknown) => {
            if (typeof s === 'number') return s;
            const n = parseInt(String(s));
            return isNaN(n) ? 0 : n;
          }).filter((n: number) => n > 0);
        } else if (typeof p.event.sdg === 'number') {
          sdgNumbers = [p.event.sdg];
        }
        
        // Count each SDG from this participation
        sdgNumbers.forEach((sdgNum: number) => {
          if (sdgNum >= 1 && sdgNum <= 17) {
            const existing = sdgMap.get(sdgNum);
            if (existing) {
              existing.events += 1;
              existing.hours += p.hours || 0;
            } else {
              sdgMap.set(sdgNum, {
                events: 1,
                hours: p.hours || 0,
                badges: 0
              });
            }
          }
        });
      }
    });
    // Add badge counts to SDG breakdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user.badges.forEach((ub: any) => {
      if (ub.badge.sdgNumber) {
        const existing = sdgMap.get(ub.badge.sdgNumber);
        if (existing) {
          existing.badges += 1;
        }
      }
    });
    const sdgBreakdown = Array.from(sdgMap.entries()).map(([sdgNumber, data]) => ({
      sdgNumber,
      ...data
    })).sort((a, b) => b.hours - a.hours); // All SDGs with activity

    // Auto-tag skills based on SDG and event participation (only from past events)
    const skillsMap = new Map<string, number>();
    const sdgParticipationMap = new Map<number, number>();
    
    // Use allPastParticipations for skills and SDG aggregation (not just the 10 for activities)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allPastParticipations.forEach((p: any) => {
      // Skip if event is null
      if (!p.event) return;
      // Use the actual skills set by the organization when creating the event
      if (p.event.skills && Array.isArray(p.event.skills) && p.event.skills.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p.event.skills.forEach((skill: any) => {
          skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
        });
      }
      
      // Count SDG participations (handle both string and array formats)
      if (p.event.sdg) {
        let sdgNumbers: number[] = [];
        
        // SDG can be stored as JSON string "[1,2,3]" or actual array or single number
        if (typeof p.event.sdg === 'string') {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(p.event.sdg);
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
            const num = parseInt(p.event.sdg);
            if (!isNaN(num)) {
              sdgNumbers = [num];
            }
          }
        } else if (Array.isArray(p.event.sdg)) {
          sdgNumbers = p.event.sdg.map((s: unknown) => {
            if (typeof s === 'number') return s;
            const n = parseInt(String(s));
            return isNaN(n) ? 0 : n;
          }).filter((n: number) => n > 0);
        } else if (typeof p.event.sdg === 'number') {
          sdgNumbers = [p.event.sdg];
        }
        
        sdgNumbers.forEach((sdgNum: number) => {
          if (sdgNum >= 1 && sdgNum <= 17) {
            sdgParticipationMap.set(sdgNum, (sdgParticipationMap.get(sdgNum) || 0) + 1);
          }
        });
      }
    });
    
    const autoTaggedSkills = Array.from(skillsMap.entries())
      .map(([skill, eventCount]) => ({ skill, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10); // Top 10 skills
    
    const sdgParticipations = Array.from(sdgParticipationMap.entries())
      .map(([sdgNumber, eventCount]) => ({ sdgNumber, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount);

    // Fetch certificates with event relation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let certificates: any[] = [];
    let certificateCount = 0;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawCertificates = await prisma.certificate.findMany({
        where: { userId },
        orderBy: { issuedAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  logo: true
                }
              }
            }
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      
      // Filter and safely process certificates, handling missing event or organization data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      certificates = rawCertificates.map((cert: any) => {
        try {
          // Ensure event data exists, provide defaults if missing
          if (!cert.event) {
            console.warn(`⚠️ Certificate ${cert.id} has no event data`);
            return {
              ...cert,
              event: {
                id: cert.eventId || 'unknown',
                title: cert.title || 'Unknown Event',
                organization: null
              }
            };
          }
          
          // Ensure organization data exists, provide defaults if missing
          if (!cert.event.organization) {
            console.warn(`⚠️ Certificate ${cert.id} event has no organization data`);
            return {
              ...cert,
              event: {
                ...cert.event,
                organization: {
                  id: 'unknown',
                  name: 'Unknown Organization',
                  logo: null
                }
              }
            };
          }
          
          return cert;
        } catch (certError) {
          console.error(`❌ Error processing certificate ${cert.id}:`, certError);
          // Return a safe default structure
          return {
            ...cert,
            event: {
              id: cert.eventId || 'unknown',
              title: cert.title || 'Unknown Event',
              organization: {
                id: 'unknown',
                name: 'Unknown Organization',
                logo: null
              }
            }
          };
        }
      });
      
      certificateCount = certificates.length;
      console.log(`✅ Fetched ${certificateCount} certificates for user ${userId}`);
      if (certificateCount > 0) {
        console.log('Certificate sample:', JSON.stringify(certificates[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Error fetching certificates:', error);
      console.error('Error type:', error?.constructor?.name || typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Continue without certificates if there's an error
      certificates = [];
      certificateCount = 0;
    }

    // Check connection status between current user and profile user
    let connectionStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null = null;
    let connectionId: string | null = null;
    let isConnectionRequester = false;
    
    if (userId !== session.user.id && session.user.id) {
      try {
        const connection = await prisma.connection.findFirst({
          where: {
            OR: [
              { requesterId: session.user.id, addresseeId: userId },
              { requesterId: userId, addresseeId: session.user.id }
            ]
          }
        });
        
        if (connection) {
          connectionStatus = connection.status as 'PENDING' | 'ACCEPTED' | 'REJECTED';
          connectionId = connection.id;
          isConnectionRequester = connection.requesterId === session.user.id;
        }
      } catch (error) {
        console.error('Error fetching connection status:', error);
        // Continue without connection status
      }
    }

    // Count accepted connections for the profile user
    let connectionCount = 0;
    try {
      connectionCount = await prisma.connection.count({
        where: {
          AND: [
            {
              OR: [
                { requesterId: userId },
                { addresseeId: userId }
              ]
            },
            { status: 'ACCEPTED' }
          ]
        }
      });
    } catch (error) {
      console.error('Error counting connections:', error);
      // Continue with 0 connections
    }

    // Check if current user is following this user (for backward compatibility)
    const isFollowing = user.followers.length > 0;

    const profileData = {
      id: user.id,
      name: user.name,
      email: user.isPublic ? user.email : undefined,
      image: user.image,
      bio: user.bio,
      city: user.city,
      state: user.state,
      country: user.country,
      website: user.website,
      phone: user.phone,
      occupation: user.occupation,
      organization: user.organization,
      languages: user.languages,
      tier: user.tier,
      impactScore: user.impactScore,
      volunteerHours,
      eventsJoined,
      badgesEarned,
      isFollowing,
      connectionStatus,
      connectionId,
      isConnectionRequester,
      badges,
      recentActivities,
      stats: {
        followers: user._count.followers,
        following: user._count.following,
        connections: connectionCount,
        rank,
        localRank,
        localTotal
      },
      // New employer-focused data
      activeSince: user.createdAt,
      organizationsWorkedWith,
      sdgBreakdown,
      autoTaggedSkills,
      sdgParticipations,
      certificateCount,
      certificates,
      // Add SDG focus for profile page
      sdgFocus: user.sdgFocus || []
    };

    // If requesting current user's profile (no id param), return in dashboard format
    if (!url.searchParams.get('id')) {
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          userType: user.userType,
          tier: user.tier,
          impactScore: user.impactScore,
          createdAt: user.createdAt,
          profile: {
            sdgFocus: user.sdgFocus || [],
            interests: user.volunteerProfile?.interests || [],
            skills: user.volunteerProfile?.skills || [],
            bio: user.bio,
            city: user.city,
            state: user.state,
            country: user.country,
            website: user.website,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            gender: user.gender,
            nationality: user.nationality,
            occupation: user.occupation,
            organization: user.organization,
            dateOfBirth: user.dateOfBirth,
            languages: user.languages,
            isPublic: user.isPublic,
            showEmail: user.showEmail,
            showProgress: user.showProgress,
            allowMessages: user.allowMessages
          },
          stats: {
            volunteerHours,
            eventsJoined,
            eventsCompleted,
            badgesEarned,
            followers: user._count.followers,
            following: user._count.following,
            rank,
            localRank,
            localTotal
          },
          badges,
          recentActivities,
          sdgBreakdown,
          // Add analytics sections to match profile detail page
          organizationsWorkedWith,
          autoTaggedSkills,
          sdgParticipations,
          certificateCount,
          certificates
        }
      });
    }

    // For other users' profiles, return in profile page format
    console.log(`📤 Returning profile data for ${userId} with ${profileData.certificateCount} certificates`);
    console.log(`📋 Certificates array length: ${profileData.certificates?.length || 0}`);
    if (profileData.certificates && profileData.certificates.length > 0) {
      console.log('First certificate:', JSON.stringify(profileData.certificates[0], null, 2));
    }
    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Ensure we always return a valid JSON response
    let errorMessage = 'Failed to fetch user profile';
    let errorDetails = 'Unknown error';
    
    try {
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        errorDetails = error.stack || error.message || errorDetails;
      } else if (typeof error === 'string') {
        errorDetails = error;
      } else {
        errorDetails = JSON.stringify(error);
      }
    } catch (serializationError) {
      console.error('Error serializing error object:', serializationError);
      errorDetails = 'Unable to serialize error details';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Define updateData in outer scope so it's available in catch block
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updateData: any = {};
  
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract fields from FormData - handle empty strings as null
    const getField = (field: string) => {
      const value = formData.get(field) as string | null;
      return value && value.trim() !== '' ? value : null;
    };
    
    const firstName = getField('firstName');
    const lastName = getField('lastName');
    const displayName = getField('displayName');
    const bio = getField('bio');
    const dateOfBirthStr = getField('dateOfBirth');
    const dateOfBirth = dateOfBirthStr ? new Date(dateOfBirthStr) : undefined;
    const gender = getField('gender');
    const nationality = getField('nationality');
    const city = getField('city');
    const state = getField('state');
    const country = getField('country');
    const occupation = getField('occupation');
    const organization = getField('organization');
    const website = getField('website');
    const phone = getField('phone');
    
    // Handle boolean fields - check if they exist and are not empty
    // Only include fields that exist in the Prisma schema
    const isPublicStr = formData.get('isPublic');
    const isPublic = isPublicStr !== null && isPublicStr !== '' ? isPublicStr === 'true' : undefined;
    
    const showEmailStr = formData.get('showEmail');
    const showEmail = showEmailStr !== null && showEmailStr !== '' ? showEmailStr === 'true' : undefined;
    
    const showProgressStr = formData.get('showProgress');
    const showProgress = showProgressStr !== null && showProgressStr !== '' ? showProgressStr === 'true' : undefined;
    
    const allowMessagesStr = formData.get('allowMessages');
    const allowMessages = allowMessagesStr !== null && allowMessagesStr !== '' ? allowMessagesStr === 'true' : undefined;
    
    // Parse JSON fields
    const sdgFocusStr = formData.get('sdgFocus') as string | null;
    let sdgFocus = undefined;
    if (sdgFocusStr && sdgFocusStr.trim() !== '') {
      try {
        sdgFocus = JSON.parse(sdgFocusStr);
      } catch (e) {
        console.error('Error parsing sdgFocus:', e);
      }
    }
    
    const interestsStr = formData.get('interests') as string | null;
    let interests = undefined;
    if (interestsStr && interestsStr.trim() !== '') {
      try {
        interests = JSON.parse(interestsStr);
      } catch (e) {
        console.error('Error parsing interests:', e);
      }
    }
    
    const skillsStr = formData.get('skills') as string | null;
    let skills = undefined;
    if (skillsStr && skillsStr.trim() !== '') {
      try {
        skills = JSON.parse(skillsStr);
      } catch (e) {
        console.error('Error parsing skills:', e);
      }
    }
    
    const languagesStr = formData.get('languages') as string | null;
    let languages = undefined;
    if (languagesStr && languagesStr.trim() !== '') {
      try {
        languages = JSON.parse(languagesStr);
      } catch (e) {
        console.error('Error parsing languages:', e);
      }
    }

    // Build update data object, only including defined fields that actually exist in the schema
    updateData = {};
    
    // String fields - can be null (empty strings converted to null by getField)
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (gender !== undefined) updateData.gender = gender;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (organization !== undefined) updateData.organization = organization;
    if (website !== undefined) updateData.website = website;
    if (phone !== undefined) updateData.phone = phone;
    
    // Date fields
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    
    // Boolean fields - must be boolean, not undefined
    if (isPublic !== undefined && typeof isPublic === 'boolean') {
      updateData.isPublic = isPublic;
    }
    if (showEmail !== undefined && typeof showEmail === 'boolean') {
      updateData.showEmail = showEmail;
    }
    if (showProgress !== undefined && typeof showProgress === 'boolean') {
      updateData.showProgress = showProgress;
    }
    if (allowMessages !== undefined && typeof allowMessages === 'boolean') {
      updateData.allowMessages = allowMessages;
    }
    
    // JSON fields
    if (sdgFocus !== undefined) updateData.sdgFocus = sdgFocus;
    if (languages !== undefined) updateData.languages = languages;

    console.log('📝 Profile update data:', JSON.stringify(updateData, null, 2));
    console.log('👤 Updating user:', session.user.id);

    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      console.log('⚠️ No fields to update, skipping database update');
      // Return current user data
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      // Return response with current user data (same format as successful update)
      return NextResponse.json({
        success: true,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image,
          userType: currentUser.userType,
          bio: currentUser.bio,
          phone: currentUser.phone,
          occupation: currentUser.occupation,
          organization: currentUser.organization,
          website: currentUser.website,
          city: currentUser.city,
          state: currentUser.state,
          country: currentUser.country,
          languages: currentUser.languages,
          sdgFocus: currentUser.sdgFocus,
          isPublic: currentUser.isPublic,
          showEmail: currentUser.showEmail,
          showProgress: currentUser.showProgress,
          allowMessages: currentUser.allowMessages,
          profile: {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            displayName: currentUser.displayName,
            bio: currentUser.bio,
          city: currentUser.city,
          state: currentUser.state,
          country: currentUser.country,
          website: currentUser.website,
          phone: currentUser.phone,
          occupation: currentUser.occupation,
            organization: currentUser.organization,
            languages: currentUser.languages,
            sdgFocus: currentUser.sdgFocus,
            isPublic: currentUser.isPublic,
            showEmail: currentUser.showEmail,
            showProgress: currentUser.showProgress,
            allowMessages: currentUser.allowMessages
          }
        }
      });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    });

    // Update volunteer profile if interests or skills provided
    if (interests || skills) {
      await prisma.volunteerProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          interests: interests || [],
          skills: skills || []
        },
        update: {
          interests: interests || [],
          skills: skills || []
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        userType: updatedUser.userType,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        occupation: updatedUser.occupation,
        organization: updatedUser.organization,
        website: updatedUser.website,
        city: updatedUser.city,
        state: updatedUser.state,
        country: updatedUser.country,
        languages: updatedUser.languages,
        sdgFocus: updatedUser.sdgFocus,
        isPublic: updatedUser.isPublic,
        showEmail: updatedUser.showEmail,
        showProgress: updatedUser.showProgress,
        allowMessages: updatedUser.allowMessages,
        profile: {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          displayName: updatedUser.displayName,
          bio: updatedUser.bio,
          city: updatedUser.city,
          state: updatedUser.state,
          country: updatedUser.country,
          website: updatedUser.website,
          phone: updatedUser.phone,
          occupation: updatedUser.occupation,
          organization: updatedUser.organization,
          languages: updatedUser.languages,
          sdgFocus: updatedUser.sdgFocus
        }
      }
    });
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Log the update data that caused the error
    console.error('Failed update data was:', JSON.stringify(updateData, null, 2));
    
    return NextResponse.json(
      { 
        error: 'Failed to update user profile',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
