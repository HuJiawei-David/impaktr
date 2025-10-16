import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'events'; // events, opportunities, users
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Get user's profile and preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        volunteerProfile: true,
        participations: {
          include: {
            event: true
          }
        },
        badges: {
          include: {
            badge: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let recommendations: any[] = [];

    if (type === 'events') {
      // Event recommendations based on user's interests, location, and past participations
      const userSkills = user.volunteerProfile?.skills || [];
      const userInterests = user.volunteerProfile?.interests || [];
      const userLocation = user.city || user.country;
      const pastEventTypes = user.participations.map((p: any) => p.event.type);
      const pastSDGs = user.participations.map((p: any) => p.event.sdg).filter(Boolean);

      const events = await prisma.event.findMany({
        where: {
          status: 'UPCOMING',
          isPublic: true,
          startDate: { gte: new Date() },
          OR: [
            // Match by skills
            ...(userSkills.length > 0 ? [{ 
              description: { 
                contains: userSkills.join(' '), 
                mode: 'insensitive' as const 
              } 
            }] : []),
            // Match by interests
            ...(userInterests.length > 0 ? [{ 
              description: { 
                contains: userInterests.join(' '), 
                mode: 'insensitive' as const 
              } 
            }] : []),
            // Match by past event types
            ...(pastEventTypes.length > 0 ? [{ 
              type: { in: pastEventTypes } 
            }] : []),
            // Match by SDGs
            ...(pastSDGs.length > 0 ? [{ 
              sdg: { in: pastSDGs.filter(sdg => sdg !== null) as string[] } 
            }] : []),
            // Match by location
            ...(userLocation ? [{ 
              location: { 
                contains: userLocation, 
                mode: 'insensitive' as const 
              } 
            }] : [])
          ]
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
              tier: true,
            }
          },
          participations: {
            where: { userId: session.user.id }
          },
          _count: {
            select: {
              participations: true
            }
          }
        },
        orderBy: { startDate: 'asc' },
        take: limit
      });

      recommendations = events.map(event => ({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        imageUrl: event.imageUrl,
        sdg: event.sdg,
        organization: event.organization,
        stats: {
          participants: event._count.participations,
          maxParticipants: event.maxParticipants,
        },
        hasApplied: event.participations.length > 0,
        matchScore: calculateEventMatchScore(event, user),
      }));
    } else if (type === 'opportunities') {
      // Opportunity recommendations
      const userSkills = user.volunteerProfile?.skills || [];
      const userLocation = user.city || user.country;

      const opportunities = await prisma.opportunity.findMany({
        where: {
          status: 'OPEN',
          OR: [
            // Match by skills
            ...(userSkills.length > 0 ? [{ 
              skills: { hasSome: userSkills } 
            }] : []),
            // Match by location
            ...(userLocation ? [{ 
              location: { 
                contains: userLocation, 
                mode: 'insensitive' as const 
              } 
            }] : []),
            // Remote opportunities
            { isRemote: true }
          ]
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
              tier: true,
            }
          },
          applications: {
            where: { userId: session.user.id }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      recommendations = opportunities.map(opp => ({
        id: opp.id,
        type: 'opportunity',
        title: opp.title,
        description: opp.description,
        requirements: opp.requirements,
        spots: opp.spots,
        spotsFilled: opp.spotsFilled,
        deadline: opp.deadline,
        location: opp.location,
        isRemote: opp.isRemote,
        skills: opp.skills,
        sdg: opp.sdg,
        organization: opp.organization,
        stats: {
          totalApplications: opp._count.applications,
          spotsRemaining: opp.spots - opp.spotsFilled,
        },
        hasApplied: opp.applications.length > 0,
        matchScore: calculateOpportunityMatchScore(opp, user),
      }));
    } else if (type === 'users') {
      // User recommendations based on similar interests and activities
      const userSkills = user.volunteerProfile?.skills || [];
      const userInterests = user.volunteerProfile?.interests || [];
      const userLocation = user.city || user.country;
      const userSDGs = user.participations.map((p: any) => p.event.sdg).filter(Boolean);

      const users = await prisma.user.findMany({
        where: {
          id: { not: session.user.id },
          isPublic: true,
          OR: [
            // Match by skills
            ...(userSkills.length > 0 ? [{ 
              volunteerProfile: {
                skills: { hasSome: userSkills }
              }
            }] : []),
            // Match by interests
            ...(userInterests.length > 0 ? [{ 
              volunteerProfile: {
                interests: { hasSome: userInterests }
              }
            }] : []),
            // Match by location
            ...(userLocation ? [{ 
              OR: [
                { city: { contains: userLocation, mode: 'insensitive' as const } },
                { country: { contains: userLocation, mode: 'insensitive' as const } }
              ]
            }] : [])
          ]
        },
        include: {
          volunteerProfile: true,
          participations: {
            include: {
              event: true
            }
          },
          badges: {
            include: {
              badge: true
            }
          },
          _count: {
            select: {
              participations: true,
              followers: true,
            }
          }
        },
        take: limit
      });

      recommendations = users.map(user => ({
        id: user.id,
        type: 'user',
        name: user.name,
        bio: user.bio,
        image: user.image,
        city: user.city,
        country: user.country,
        tier: user.tier,
        skills: user.volunteerProfile?.skills || [],
        interests: user.volunteerProfile?.interests || [],
        stats: {
          participations: user._count.participations,
          followers: user._count.followers,
        },
        badges: user.badges.map(ub => ub.badge),
        matchScore: calculateUserMatchScore(user, user),
      }));
    }

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

function calculateEventMatchScore(event: any, user: any): number {
  let score = 0;
  
  // Location match
  if (user.city && event.location?.toLowerCase().includes(user.city.toLowerCase())) {
    score += 30;
  } else if (user.country && event.location?.toLowerCase().includes(user.country.toLowerCase())) {
    score += 20;
  }
  
  // Skills match
  const userSkills = user.volunteerProfile?.skills || [];
  if (userSkills.length > 0) {
    const skillMatches = userSkills.filter((skill: string) => 
      event.description?.toLowerCase().includes(skill.toLowerCase())
    ).length;
    score += skillMatches * 10;
  }
  
  // Past participation in similar events
  const pastEventTypes = user.participations.map((p: any) => p.event.type);
  if (pastEventTypes.includes(event.type)) {
    score += 25;
  }
  
  // SDG match
  const pastSDGs = user.participations.map((p: any) => p.event.sdg).filter(Boolean);
  if (pastSDGs.includes(event.sdg)) {
    score += 15;
  }
  
  return Math.min(score, 100);
}

function calculateOpportunityMatchScore(opportunity: any, user: any): number {
  let score = 0;
  
  // Skills match
  const userSkills = user.volunteerProfile?.skills || [];
  const skillMatches = userSkills.filter((skill: string) => 
    opportunity.skills.includes(skill)
  ).length;
  score += skillMatches * 20;
  
  // Location match
  if (opportunity.isRemote) {
    score += 25;
  } else if (user.city && opportunity.location?.toLowerCase().includes(user.city.toLowerCase())) {
    score += 30;
  } else if (user.country && opportunity.location?.toLowerCase().includes(user.country.toLowerCase())) {
    score += 20;
  }
  
  // Requirements match
  const userInterests = user.volunteerProfile?.interests || [];
  const requirementMatches = opportunity.requirements.filter((req: string) => 
    userInterests.some((interest: string) => req.toLowerCase().includes(interest.toLowerCase()))
  ).length;
  score += requirementMatches * 15;
  
  return Math.min(score, 100);
}

function calculateUserMatchScore(targetUser: any, currentUser: any): number {
  let score = 0;
  
  // Skills match
  const currentSkills = currentUser.volunteerProfile?.skills || [];
  const targetSkills = targetUser.volunteerProfile?.skills || [];
  const skillMatches = currentSkills.filter((skill: string) => targetSkills.includes(skill)).length;
  score += skillMatches * 15;
  
  // Interests match
  const currentInterests = currentUser.volunteerProfile?.interests || [];
  const targetInterests = targetUser.volunteerProfile?.interests || [];
  const interestMatches = currentInterests.filter((interest: string) => targetInterests.includes(interest)).length;
  score += interestMatches * 10;
  
  // Location match
  if (currentUser.city && targetUser.city && currentUser.city === targetUser.city) {
    score += 25;
  } else if (currentUser.country && targetUser.country && currentUser.country === targetUser.country) {
    score += 15;
  }
  
  // Similar activity level
  const currentParticipations = currentUser.participations.length;
  const targetParticipations = targetUser.participations.length;
  const participationDiff = Math.abs(currentParticipations - targetParticipations);
  if (participationDiff <= 5) {
    score += 20;
  } else if (participationDiff <= 10) {
    score += 10;
  }
  
  return Math.min(score, 100);
}
