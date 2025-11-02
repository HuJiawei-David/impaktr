import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('id') || session.user.id;

    // Fetch user with related data
    const user = await prisma.user.findUnique({
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
          where: { status: 'VERIFIED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            event: {
              select: {
                id: true,
                title: true,
                sdg: true,
                startDate: true,
                type: true,
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
          }
        },
        scoreHistory: {
          where: {
            participationId: { not: null },
            reason: { in: ['participation_verified', 'event_completion'] }
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if profile is public or if the current user has permission to view
    if (!user.isPublic && user.id !== session.user.id) {
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
    }

    // Recalculate impact score and tier dynamically (no hardcoding)
    if (user.userType === 'INDIVIDUAL') {
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
        // This will be done by checkAndAwardBadges which calls updateUserRank
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
        console.error(`Error recalculating score/tier for user ${user.id}:`, error);
        // Continue with existing score/tier if recalculation fails
        // But log the error so we can debug issues
      }
    }

    // Get ALL participations for accurate counting (not just VERIFIED)
    const allParticipations = await prisma.participation.findMany({
      where: { userId },
      select: {
        eventId: true,
        status: true,
        hours: true,
      }
    });

    // Calculate stats
    const volunteerHours = allParticipations
      .filter((p) => p.status === 'VERIFIED' || p.status === 'ATTENDED')
      .reduce((sum: number, p) => sum + (p.hours || 0), 0);
    
    // Events joined = all unique events user participated in
    const eventsJoined = new Set(allParticipations.map((p: { eventId: string }) => p.eventId)).size;
    
    // Events completed = events with ATTENDED or VERIFIED status
    const eventsCompleted = new Set(
      allParticipations
        .filter((p: { status: string; eventId: string }) => p.status === 'ATTENDED' || p.status === 'VERIFIED')
        .map((p: { eventId: string }) => p.eventId)
    ).size;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const badgesEarned = user.badges.filter((b: any) => b.earnedAt).length;

    // Get user's global rank (using recalculated score)
    const currentScore = user.userType === 'INDIVIDUAL' ? user.impactScore : 0;
    const rank = user.userType === 'INDIVIDUAL' ? await prisma.user.count({
      where: {
        impactScore: { gt: currentScore },
        userType: 'INDIVIDUAL'
      }
    }) + 1 : undefined;

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

    // Format recent activities with score points
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentActivities = user.participations.map((p: any) => {
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

    // Aggregate organizations worked with
    const organizationsMap = new Map<string, { name: string; logo: string | null; events: number; hours: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user.participations.forEach((p: any) => {
      if (p.event.organization) {
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

    // Aggregate SDG breakdown
    const sdgMap = new Map<number, { events: number; hours: number; badges: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user.participations.forEach((p: any) => {
      if (p.event.sdg) {
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
    })).sort((a, b) => b.hours - a.hours).slice(0, 3); // Top 3 SDGs

    // Auto-tag skills based on SDG and event participation
    const skillsMap = new Map<string, number>();
    const sdgParticipationMap = new Map<number, number>();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user.participations.forEach((p: any) => {
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
      certificates = await prisma.certificate.findMany({
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
      
      certificateCount = certificates.length;
      console.log(`✅ Fetched ${certificateCount} certificates for user ${userId}`);
      if (certificateCount > 0) {
        console.log('Certificate sample:', certificates[0]);
      }
    } catch (error) {
      console.error('❌ Error fetching certificates:', error);
      console.error('Full error:', error);
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
        rank
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
            rank
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
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
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
