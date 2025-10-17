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
            sdgFocus: user.volunteerProfile?.interests || [],
            bio: user.bio,
            city: user.city,
            country: user.country,
            website: user.website,
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
