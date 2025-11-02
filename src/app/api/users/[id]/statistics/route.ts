import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    console.log('📊 Statistics API called for userId:', userId);
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('range') || '12months';
    console.log('📊 Time range:', timeRange);

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (timeRange) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '12months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        impactScore: true,
        tier: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all participations in time range
    const participations = await prisma.participation.findMany({
      where: {
        userId,
        joinedAt: { gte: startDate }
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
            sdg: true,
            startDate: true,
            skills: true,
            organization: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    // Calculate verified hours
    const verifiedParticipations = participations.filter(p => 
      p.status === 'VERIFIED' || p.status === 'ATTENDED'
    );
    const totalHours = verifiedParticipations.reduce((sum, p) => sum + (p.hours || 0), 0);
    const verifiedHours = participations
      .filter(p => p.status === 'VERIFIED')
      .reduce((sum, p) => sum + (p.hours || 0), 0);

    // Count unique events
    const uniqueEvents = new Set(participations.map(p => p.eventId)).size;

    // Fetch badges - count total badges for overview, but only badges earned in time range for achievements
    const allBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: {
        id: true,
        earnedAt: true
      }
    });
    
    const badgesInPeriod = await prisma.userBadge.findMany({
      where: { 
        userId, 
        earnedAt: { gte: startDate } 
      },
      include: {
        badge: {
          select: {
            id: true,
            name: true,
            sdgNumber: true,
            tier: true
          }
        }
      }
    });

    // Calculate monthly activity
    const monthlyActivityMap = new Map<string, { hours: number; events: Set<string>; score: number }>();
    
    verifiedParticipations.forEach((p) => {
      if (!p.joinedAt) return; // Skip if no joinedAt date
      const month = new Date(p.joinedAt).toLocaleString('default', { month: 'short' });
      const existing = monthlyActivityMap.get(month) || { hours: 0, events: new Set(), score: 0 };
      existing.hours += p.hours || 0;
      existing.events.add(p.eventId);
      // Estimate score contribution (simplified - actual scoring is more complex)
      existing.score += (p.hours || 0) * 2; // Rough estimate
      monthlyActivityMap.set(month, existing);
    });

    // Get score history for better score calculation
    // Get ALL scoreHistory entries (not filtered by date) to ensure we capture all participations
    // The date filter is only applied later for monthly activity, but org/event scores need all entries
    const allScoreHistory = await prisma.scoreHistory.findMany({
      where: {
        userId,
        participationId: { not: null }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // Filter scoreHistory by date range for monthly activity, but keep all for org/event scores
    const scoreHistory = allScoreHistory.filter(sh => sh.createdAt >= startDate);

    // Recalculate monthly scores from score history
    monthlyActivityMap.forEach((value, month) => {
      // Reset score, will recalculate from score history
      value.score = 0;
    });

    scoreHistory.forEach((sh) => {
      const month = new Date(sh.createdAt).toLocaleString('default', { month: 'short' });
      const existing = monthlyActivityMap.get(month);
      if (existing) {
        existing.score += sh.change || 0;
      }
    });

    // Format monthly activity (get last 12 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyActivity = months.map((month, idx) => {
      const monthIndex = (now.getMonth() - (11 - idx) + 12) % 12;
      const monthKey = months[monthIndex];
      const data = monthlyActivityMap.get(monthKey) || { hours: 0, events: new Set(), score: 0 };
      return {
        month: monthKey,
        hours: data.hours,
        events: data.events.size,
        score: data.score || 0
      };
    }).filter(m => {
      // Only include months that have data or are recent
      return m.hours > 0 || m.events > 0 || m.score > 0;
    });

    // SDG Distribution
    const sdgMap = new Map<number, { hours: number; events: Set<string> }>();
    verifiedParticipations.forEach((p) => {
      if (!p.event) return;
      
      // Handle different SDG formats (string, number, array)
      let sdgNumbers: number[] = [];
      const rawSdg = p.event.sdg;
      
      if (rawSdg) {
        if (typeof rawSdg === 'number') {
          sdgNumbers = [rawSdg];
        } else if (typeof rawSdg === 'string') {
          try {
            const parsed = JSON.parse(rawSdg);
            if (Array.isArray(parsed)) {
              sdgNumbers = parsed
                .map((s: unknown) => (typeof s === 'number' ? s : parseInt(String(s))))
                .filter((n: number) => !isNaN(n) && n >= 1 && n <= 17);
            } else {
              const n = parseInt(rawSdg);
              if (!isNaN(n) && n >= 1 && n <= 17) {
                sdgNumbers = [n];
              }
            }
          } catch {
            const n = parseInt(rawSdg);
            if (!isNaN(n) && n >= 1 && n <= 17) {
              sdgNumbers = [n];
            }
          }
        } else if (Array.isArray(rawSdg)) {
          sdgNumbers = (rawSdg as unknown[])
            .map((s: unknown) => (typeof s === 'number' ? s : parseInt(String(s))))
            .filter((n: number) => !isNaN(n) && n >= 1 && n <= 17);
        }
      }
      
      // Add hours and events for each SDG
      sdgNumbers.forEach((sdg) => {
        const existing = sdgMap.get(sdg) || { hours: 0, events: new Set() };
        existing.hours += p.hours || 0;
        existing.events.add(p.eventId);
        sdgMap.set(sdg, existing);
      });
    });
    
    console.log('📊 SDG Distribution calculation:', {
      verifiedParticipations: verifiedParticipations.length,
      sdgMapSize: sdgMap.size,
      sdgMapEntries: Array.from(sdgMap.entries())
    });

    const totalHoursForSDG = Array.from(sdgMap.values()).reduce((sum, v) => sum + v.hours, 0);
    const sdgDistribution = Array.from(sdgMap.entries())
      .map(([sdgNumber, data]) => ({
        sdgNumber,
        hours: data.hours,
        events: data.events.size,
        percentage: totalHoursForSDG > 0 ? Math.round((data.hours / totalHoursForSDG) * 100) : 0
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Organization Impact Breakdown
    const organizationMap = new Map<string, { 
      id: string; 
      name: string; 
      logo: string | null; 
      hours: number; 
      events: Set<string>; 
      score: number;
      lastParticipated: Date | null;
    }>();
    
    verifiedParticipations.forEach((p) => {
      if (p.event?.organization) {
        const orgId = p.event.organization.id;
        const existing = organizationMap.get(orgId) || {
          id: orgId,
          name: p.event.organization.name,
          logo: p.event.organization.logo,
          hours: 0,
          events: new Set(),
          score: 0,
          lastParticipated: null
        };
      existing.hours += p.hours || 0;
        existing.events.add(p.eventId);
        // Don't estimate score here - will use scoreHistory for accuracy
        if (p.joinedAt && (!existing.lastParticipated || p.joinedAt > existing.lastParticipated)) {
          existing.lastParticipated = p.joinedAt;
        }
        organizationMap.set(orgId, existing);
      }
    });
    
    // Use scoreHistory to get accurate scores per organization
    // Use ALL scoreHistory (not filtered by date) to get accurate org/event scores
    // Group scoreHistory by participationId - use LATEST entry per participation (not sum)
    // This matches the profile API behavior and avoids double-counting
    const participationScoreMap = new Map<string, { change: number; createdAt: Date }>();
    allScoreHistory.forEach((sh) => {
      if (sh.participationId && sh.change) {
        const existing = participationScoreMap.get(sh.participationId);
        // Keep the most recent entry per participation
        if (!existing || sh.createdAt > existing.createdAt) {
          participationScoreMap.set(sh.participationId, {
            change: sh.change,
            createdAt: sh.createdAt
          });
        }
      }
    });
    
    // Convert to simple score map
    const participationScoreValueMap = new Map<string, number>();
    participationScoreMap.forEach((value, participationId) => {
      participationScoreValueMap.set(participationId, value.change);
    });
    
    // Apply scores to organizations from scoreHistory
    verifiedParticipations.forEach((p) => {
      if (p.event?.organization) {
        const orgId = p.event.organization.id;
        const existing = organizationMap.get(orgId);
        if (existing && participationScoreValueMap.has(p.id)) {
          const scoreFromHistory = participationScoreValueMap.get(p.id) || 0;
          existing.score += scoreFromHistory;
        }
      }
    });
    
    // Fallback: If NO scoreHistory entries exist at all, use user's actual impactScore
    // This handles legacy users whose scores weren't logged to scoreHistory
    if (participationScoreValueMap.size === 0 && verifiedParticipations.length > 0) {
      console.log('⚠️ No scoreHistory found, using user impactScore as fallback:', user.impactScore);
      
      if (user.impactScore > 0) {
        // Distribute the score proportionally by hours across organizations
        const totalHours = verifiedParticipations.reduce((sum, p) => sum + (p.hours || 0), 0);
        
        verifiedParticipations.forEach((p) => {
          if (p.event?.organization && p.hours && totalHours > 0) {
            const orgId = p.event.organization.id;
            const existing = organizationMap.get(orgId);
            if (existing) {
              // Proportional score based on hours
              const proportion = p.hours / totalHours;
              existing.score += user.impactScore * proportion;
            }
          }
        });
      }
    }
    
    console.log('📊 Organization Impact Debug:', {
      totalScoreHistory: allScoreHistory.length,
      participationScoreMapSize: participationScoreMap.size,
      participationScoreMapEntries: Array.from(participationScoreMap.entries()).slice(0, 3),
      participationScoreValueMapEntries: Array.from(participationScoreValueMap.entries()),
      organizationImpactScores: Array.from(organizationMap.values()).map(org => ({
        name: org.name,
        score: org.score,
        hours: org.hours
      }))
    });
    
    const organizationImpact = Array.from(organizationMap.values())
      .map(org => ({
        id: org.id,
        name: org.name,
        logo: org.logo,
        hours: Math.round(org.hours * 10) / 10,
        events: org.events.size,
        score: Math.round(org.score * 10) / 10,
        lastParticipated: org.lastParticipated?.toISOString() || null
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);
    
    // Top Events (most impactful)
    const eventMap = new Map<string, {
      id: string;
      title: string;
      hours: number;
      score: number;
      date: Date | null;
      organization: { id: string; name: string; logo: string | null } | null;
      sdg: number | null;
    }>();
    
    verifiedParticipations.forEach((p) => {
      if (p.event) {
        const eventId = p.event.id;
        const existing = eventMap.get(eventId) || {
          id: eventId,
          title: p.event.title,
          hours: 0,
          score: 0,
          date: p.event.startDate,
          organization: p.event.organization,
          sdg: null
        };
        existing.hours += p.hours || 0;
        
        // Parse SDG (handle string/array/number formats)
        if (p.event.sdg && !existing.sdg) {
          if (typeof p.event.sdg === 'number') {
            existing.sdg = p.event.sdg;
          } else if (typeof p.event.sdg === 'string') {
            try {
              const parsed = JSON.parse(p.event.sdg);
              existing.sdg = Array.isArray(parsed) ? parsed[0] : parseInt(String(parsed)) || null;
            } catch {
              const num = parseInt(p.event.sdg);
              existing.sdg = isNaN(num) ? null : num;
            }
          } else if (Array.isArray(p.event.sdg) && (p.event.sdg as unknown[]).length > 0) {
            const sdgArray = p.event.sdg as unknown[];
            existing.sdg = typeof sdgArray[0] === 'number' ? sdgArray[0] : parseInt(String(sdgArray[0])) || null;
          }
        }
        
        eventMap.set(eventId, existing);
      }
    });
    
    // Add scores from scoreHistory (sum all score changes for each event)
    const eventScoreMap = new Map<string, number>();
    const participationEventMap = new Map<string, string>(); // participationId -> eventId
    
    // First, map participations to events
    verifiedParticipations.forEach((p) => {
      if (p.eventId) {
        participationEventMap.set(p.id, p.eventId);
      }
    });
    
    // Then, map scoreHistory to events via participations
    // Use ALL scoreHistory (not filtered by date) to get accurate event scores
    // Use the LATEST scoreHistory entry per participation (not sum) to match profile API
    const eventParticipationScoreMap = new Map<string, Map<string, { change: number; createdAt: Date }>>();
    
    allScoreHistory.forEach((sh) => {
      if (sh.participationId && participationEventMap.has(sh.participationId) && sh.change) {
        const eventId = participationEventMap.get(sh.participationId)!;
        if (!eventParticipationScoreMap.has(eventId)) {
          eventParticipationScoreMap.set(eventId, new Map());
        }
        const eventParticipations = eventParticipationScoreMap.get(eventId)!;
        const existing = eventParticipations.get(sh.participationId);
        // Keep the most recent entry per participation
        if (!existing || sh.createdAt > existing.createdAt) {
          eventParticipations.set(sh.participationId, {
            change: sh.change,
            createdAt: sh.createdAt
          });
        }
      }
    });
    
    // Sum scores per event (each participation contributes once with its latest score)
    eventParticipationScoreMap.forEach((participations, eventId) => {
      let totalScore = 0;
      participations.forEach((value) => {
        totalScore += value.change;
      });
      eventScoreMap.set(eventId, totalScore);
    });
    
    // Apply scores to events from scoreHistory
    eventScoreMap.forEach((score, eventId) => {
      const existing = eventMap.get(eventId);
      if (existing) {
        existing.score = score;
      }
    });
    
    // Fallback: If NO scoreHistory entries exist at all, use user's actual impactScore
    // This was already handled in the organization fallback above, so events get the same treatment
    if (eventScoreMap.size === 0 && verifiedParticipations.length > 0) {
      console.log('⚠️ No scoreHistory for events, using user impactScore as fallback:', user.impactScore);
      
      if (user.impactScore > 0) {
        const totalHours = verifiedParticipations.reduce((sum, p) => sum + (p.hours || 0), 0);
        
        verifiedParticipations.forEach((p) => {
          if (p.event && p.hours && totalHours > 0) {
            const existing = eventMap.get(p.event.id);
            if (existing) {
              const proportion = p.hours / totalHours;
              existing.score = user.impactScore * proportion;
            }
          }
        });
      }
    }
    
    console.log('📊 Top Events Debug:', {
      totalScoreHistory: allScoreHistory.length,
      eventScoreMapSize: eventScoreMap.size,
      eventScoreMapEntries: Array.from(eventScoreMap.entries()),
      topEventsScores: Array.from(eventMap.values()).slice(0, 3).map(evt => ({
        title: evt.title,
        score: evt.score,
        hours: evt.hours
      }))
    });
    
    const topEvents = Array.from(eventMap.values())
      .map(event => ({
        ...event,
        date: event.date?.toISOString() || null,
        score: Math.round(event.score * 10) / 10,
        hours: Math.round(event.hours * 10) / 10
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Event Types Breakdown
    const eventTypesMap = new Map<string, { count: number; hours: number }>();
    verifiedParticipations.forEach((p) => {
      if (p.event?.type) {
        const eventType = p.event.type;
        const existing = eventTypesMap.get(eventType) || { count: 0, hours: 0 };
        existing.count += 1;
        existing.hours += p.hours || 0;
        eventTypesMap.set(eventType, existing);
      }
    });

    const eventTypes = Array.from(eventTypesMap.entries())
      .map(([type, data]) => ({
        type,
        count: data.count,
        hours: Math.round(data.hours * 10) / 10
      }))
      .sort((a, b) => b.hours - a.hours);

    // Skills Impact
    const skillsMap = new Map<string, { hours: number; events: Set<string> }>();
    verifiedParticipations.forEach((p) => {
      const skills = p.event?.skills || [];
      skills.forEach((skill: string) => {
        const existing = skillsMap.get(skill) || { hours: 0, events: new Set() };
        existing.hours += p.hours || 0;
        existing.events.add(p.eventId);
        skillsMap.set(skill, existing);
      });
    });

    // Get skill multipliers (default 1.0, could be enhanced with actual multipliers)
    const skillsImpact = Array.from(skillsMap.entries())
      .map(([skill, data]) => ({
        skill,
        hours: data.hours,
        multiplier: 1.2, // Default multiplier, could be enhanced
        events: data.events.size
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Recent Achievements (from badges and score history)
    const recentBadges = badgesInPeriod.slice(0, 4).map(b => ({
      id: b.id,
      type: 'badge',
      name: b.badge.name,
      earnedAt: b.earnedAt.toISOString(),
      points: 25 // Default badge points
    }));

    // Calculate rank progress
    const rankTiers = ['HELPER', 'ADVOCATE', 'BUILDER', 'CHAMPION', 'GUARDIAN'];
    const currentRankIndex = rankTiers.indexOf(user.tier || 'HELPER');
    const nextRankIndex = currentRankIndex < rankTiers.length - 1 ? currentRankIndex + 1 : -1;
    let rankProgress = 100;
    if (nextRankIndex > 0) {
      // Simplified progress calculation
      rankProgress = Math.min(100, Math.round((user.impactScore || 0) / 100)); // Rough estimate
    }

    // Compare to Average (simplified - would need platform averages)
    const allUsers = await prisma.user.findMany({
      where: { userType: 'INDIVIDUAL' },
      select: { impactScore: true }
    });
    
    const avgScore = allUsers.length > 0 
      ? allUsers.reduce((sum, u) => sum + (u.impactScore || 0), 0) / allUsers.length 
      : user.impactScore || 0;
    
    const avgHours = allUsers.length > 0 ? 50 : totalHours; // Rough estimate

    const hoursVsAverage = avgHours > 0 ? Math.round((totalHours / avgHours) * 100) : 100;
    const scoreVsAverage = avgScore > 0 ? Math.round(((user.impactScore || 0) / avgScore) * 100) : 100;
    
    // Calculate percentile (simplified)
    const usersWithLowerScore = allUsers.filter(u => (u.impactScore || 0) < (user.impactScore || 0)).length;
    const rankPercentile = allUsers.length > 0 
      ? Math.round((usersWithLowerScore / allUsers.length) * 100)
      : 50;

    // Score Progression (from scoreHistory)
    const scoreProgression = scoreHistory.map(sh => ({
      date: sh.createdAt.toISOString(),
      score: sh.newScore,
      change: sh.change || 0,
      reason: sh.reason
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Create monthlyHours from monthlyActivity (just month and hours)
    const monthlyHours = monthlyActivity.map(activity => ({
      month: activity.month,
      hours: activity.hours
    }));

    const statistics = {
      overview: {
        totalHours: Math.round(totalHours * 10) / 10,
        verifiedHours: Math.round(verifiedHours * 10) / 10,
        totalEvents: uniqueEvents,
        badgesEarned: badgesInPeriod.length, // Badges earned in the selected time period
        totalBadges: allBadges.length, // Total badges all time
        impaktrScore: Math.round((user.impactScore || 0) * 10) / 10,
        currentRank: user.tier || 'HELPER',
        rankProgress,
        joinedDate: user.createdAt.toISOString()
      },
      monthlyActivity,
      monthlyHours,
      sdgDistribution,
      organizationImpact,
      topEvents,
      scoreProgression,
      skillsImpact,
      achievements: recentBadges,
      compareToAverage: {
        hoursVsAverage,
        scoreVsAverage,
        rankPercentile
      },
      eventTypes,
      topSkills: skillsImpact.map(s => ({
        skill: s.skill,
        hours: s.hours
      }))
    };

    console.log('📊 Statistics calculated successfully:', {
      totalHours: statistics.overview.totalHours,
      totalEvents: statistics.overview.totalEvents,
      badgesEarned: statistics.overview.badgesEarned
    });
    return NextResponse.json(statistics);
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Error stack:', errorStack);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: errorMessage },
      { status: 500 }
    );
  }
}

