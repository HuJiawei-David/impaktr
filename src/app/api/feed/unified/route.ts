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
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const type = url.searchParams.get('type') || 'all'; // all, organizations, achievements, following

    let feedItems: any[] = [];

    if (type === 'all' || type === 'organizations') {
      // Get organization posts
      const orgPosts = await prisma.organizationPost.findMany({
        where: {
          visibility: 'PUBLIC'
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
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              imageUrl: true,
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 3
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            }
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ],
        take: type === 'organizations' ? limit : Math.ceil(limit / 2),
        skip: type === 'organizations' ? offset : Math.ceil(offset / 2)
      });

      feedItems.push(...orgPosts.map(post => ({
        ...post,
        feedType: 'organization_post',
        timestamp: post.createdAt
      })));
    }

    if (type === 'all' || type === 'achievements') {
      // Get user achievements (mock data for now - replace with real achievement system)
      const achievements = await getMockAchievements(
        type === 'achievements' ? limit : Math.ceil(limit / 2),
        type === 'achievements' ? offset : Math.ceil(offset / 2)
      );

      feedItems.push(...achievements.map(achievement => ({
        ...achievement,
        feedType: 'user_achievement',
        timestamp: achievement.timestamp
      })));
    }

    if (type === 'following') {
      // Get posts from organizations the user follows
      const followingOrgs = await prisma.follow.findMany({
        where: {
          followerId: session.user.id,
          followingOrgId: { not: null }
        },
        select: {
          followingOrgId: true
        }
      });

      const orgIds = followingOrgs.map(f => f.followingOrgId).filter((id): id is string => id !== null);

      if (orgIds.length > 0) {
        const followingPosts = await prisma.organizationPost.findMany({
          where: {
            organizationId: { in: orgIds },
            visibility: { in: ['PUBLIC', 'FOLLOWERS'] }
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
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                imageUrl: true,
              }
            },
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 3
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                }
              }
            },
            _count: {
              select: {
                comments: true,
                reactions: true,
              }
            }
          },
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
          ],
          take: limit,
          skip: offset
        });

        feedItems.push(...followingPosts.map(post => ({
          ...post,
          feedType: 'organization_post',
          timestamp: post.createdAt
        })));
      }
    }

    // Sort all items by timestamp
    feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply final limit and offset
    const finalItems = feedItems.slice(offset, offset + limit);

    return NextResponse.json({
      items: finalItems,
      hasMore: feedItems.length > offset + limit,
      total: feedItems.length
    });

  } catch (error) {
    console.error('Error fetching unified feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

// Mock achievements function - replace with real achievement system
async function getMockAchievements(limit: number, offset: number) {
  const mockAchievements = [
    {
      id: 'ach-1',
      userId: 'user1',
      userName: 'Sarah Chen',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
      userTitle: 'Environmental Advocate',
      type: 'badge_earned',
      timestamp: '2024-01-15T10:30:00Z',
      achievement: {
        sdgNumber: 13,
        badgeName: 'Climate Guardian',
        tierLevel: 4,
        hours: 120,
        activities: 25,
        description: 'Completed 25 climate action activities and contributed 120+ hours to environmental causes!'
      },
      interactions: {
        likes: 24,
        comments: 5,
        shares: 3,
        kudos: 12,
        userHasLiked: false,
        userHasKudos: false
      }
    },
    {
      id: 'ach-2',
      userId: 'user2',
      userName: 'Mike Johnson',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      userTitle: 'Community Builder',
      type: 'milestone_reached',
      timestamp: '2024-01-14T15:45:00Z',
      achievement: {
        milestone: '100 Hours Volunteered',
        description: 'Reached 100 volunteer hours milestone! Thank you for your dedication to community service.'
      },
      interactions: {
        likes: 18,
        comments: 3,
        shares: 2,
        kudos: 8,
        userHasLiked: true,
        userHasKudos: false
      }
    },
    {
      id: 'ach-3',
      userId: 'user3',
      userName: 'Lisa Wang',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      userTitle: 'Education Champion',
      type: 'certificate_earned',
      timestamp: '2024-01-13T09:20:00Z',
      achievement: {
        certificateName: 'Digital Literacy Instructor',
        organization: 'Tech for Good',
        description: 'Successfully completed the Digital Literacy Instructor certification program.'
      },
      interactions: {
        likes: 15,
        comments: 4,
        shares: 1,
        kudos: 6,
        userHasLiked: false,
        userHasKudos: true
      }
    }
  ];

  return mockAchievements.slice(offset, offset + limit);
}
