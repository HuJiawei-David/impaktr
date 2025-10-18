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

    // Calculate stats
    const volunteerHours = user.participations.reduce((sum, p) => sum + (p.hours || 0), 0);
    const eventsJoined = new Set(user.participations.map(p => p.eventId)).size;
    const badgesEarned = user.badges.filter(b => b.earnedAt).length;

    // Get user's global rank
    const rank = await prisma.user.count({
      where: {
        impactScore: { gt: user.impactScore },
        userType: 'INDIVIDUAL'
      }
    }) + 1;

    // Format recent activities
    const recentActivities = user.participations.map(p => ({
      id: p.id,
      type: p.event.type,
      title: p.event.title,
      date: p.createdAt,
      sdg: p.event.sdg ? parseInt(p.event.sdg) : undefined
    }));

    // Format badges
    const badges = user.badges.map(ub => ({
      id: ub.badgeId,
      name: ub.badge.name,
      sdgNumber: ub.badge.sdgNumber,
      tier: ub.badge.tier,
      earnedAt: ub.earnedAt
    }));

    // Check if current user is following this user
    const isFollowing = user.followers.length > 0;

    const profileData = {
      id: user.id,
      name: user.name,
      email: user.isPublic ? user.email : undefined,
      image: user.image,
      bio: user.bio,
      city: user.city,
      country: user.country,
      website: user.website,
      tier: user.tier,
      impactScore: user.impactScore,
      volunteerHours,
      eventsJoined,
      badgesEarned,
      isFollowing,
      badges,
      recentActivities,
      stats: {
        followers: user._count.followers,
        following: user._count.following,
        rank
      }
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
          recentActivities
        }
      });
    }

    // For other users' profiles, return in profile page format
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
