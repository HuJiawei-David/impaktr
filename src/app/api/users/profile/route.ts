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

    // Calculate stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const volunteerHours = user.participations.reduce((sum: number, p: any) => sum + (p.hours || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventsJoined = new Set(user.participations.map((p: any) => p.eventId)).size;
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

    // Format recent activities
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

      return {
        id: p.id,
        type: p.event?.type,
        title: p.event?.title,
        date: p.event?.startDate || p.createdAt,
        sdg: sdgNumber,
        sdgs: sdgNumbers
      };
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
    const connectionStatus = null;
    const connectionId = null;
    const isConnectionRequester = false;
    
    // TODO: Fix connection functionality when Prisma client is properly generated
    // if (userId !== session.user.id && session.user.id) {
    //   try {
    //     const connection = await prisma.connection.findFirst({
    //       where: {
    //         OR: [
    //           { requesterId: session.user.id, addresseeId: userId },
    //           { requesterId: userId, addresseeId: session.user.id }
    //         ]
    //       }
    //     });
    //     
    //     if (connection) {
    //       connectionStatus = connection.status;
    //       connectionId = connection.id;
    //       isConnectionRequester = connection.requesterId === session.user.id;
    //     }
    //   } catch (error) {
    //     console.error('Error fetching connection status:', error);
    //     // Continue without connection status
    //   }
    // }

    // Count accepted connections for both users
    const connectionCount = 0;
    // TODO: Fix connection functionality when Prisma client is properly generated
    // try {
    //   connectionCount = await prisma.connection.count({
    //     where: {
    //       AND: [
    //         {
    //           OR: [
    //             { requesterId: userId },
    //             { addresseeId: userId }
    //           ]
    //         },
    //         { status: 'ACCEPTED' }
    //       ]
    //     }
    //   });
    // } catch (error) {
    //   console.error('Error counting connections:', error);
    //   // Continue with 0 connections
    // }

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
          profile: {
            sdgFocus: user.sdgFocus || [],
            interests: user.volunteerProfile?.interests || [],
            skills: user.volunteerProfile?.skills || [],
            bio: user.bio,
            city: user.city,
            state: user.state,
            country: user.country,
            website: user.website,
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
            showEmail: user.showEmail
          },
          stats: {
            volunteerHours,
            eventsJoined,
            badgesEarned,
            followers: user._count.followers,
            following: user._count.following,
            rank
          },
          badges,
          recentActivities,
          sdgBreakdown
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
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract fields from FormData
    const firstName = formData.get('firstName') as string | null;
    const lastName = formData.get('lastName') as string | null;
    const displayName = formData.get('displayName') as string | null;
    const bio = formData.get('bio') as string | null;
    const dateOfBirth = formData.get('dateOfBirth') as string | null;
    const gender = formData.get('gender') as string | null;
    const nationality = formData.get('nationality') as string | null;
    const city = formData.get('city') as string | null;
    const state = formData.get('state') as string | null;
    const country = formData.get('country') as string | null;
    const occupation = formData.get('occupation') as string | null;
    const organization = formData.get('organization') as string | null;
    const website = formData.get('website') as string | null;
    const isPublic = formData.get('isPublic') === 'true';
    const showEmail = formData.get('showEmail') === 'true';
    
    // Parse JSON fields
    const sdgFocusStr = formData.get('sdgFocus') as string | null;
    const sdgFocus = sdgFocusStr ? JSON.parse(sdgFocusStr) : undefined;
    
    const interestsStr = formData.get('interests') as string | null;
    const interests = interestsStr ? JSON.parse(interestsStr) : undefined;
    
    const skillsStr = formData.get('skills') as string | null;
    const skills = skillsStr ? JSON.parse(skillsStr) : undefined;
    
    const languagesStr = formData.get('languages') as string | null;
    const languages = languagesStr ? JSON.parse(languagesStr) : undefined;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        displayName,
        bio,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        nationality,
        city,
        state,
        country,
        occupation,
        organization,
        website,
        sdgFocus,
        isPublic,
        showEmail,
        languages
      }
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
        profile: {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          displayName: updatedUser.displayName,
          bio: updatedUser.bio,
          city: updatedUser.city,
          country: updatedUser.country,
          website: updatedUser.website
        }
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
