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
    const type = url.searchParams.get('type') || 'all'; // all, posts, following

    let feedItems: any[] = [];

    if (type === 'all' || type === 'posts') {
      // Get all posts (both user posts and organization posts) from the unified Post model
      const posts = await prisma.post.findMany({
        take: limit * 2, // Get more for sorting
        where: {
          isDeleted: false
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              image: true,
              occupation: true,
              impactScore: true,
              userType: true,
              tier: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
              slug: true,
              tier: true,
              type: true
            }
          },
          likes: {
            where: {
              userId: session.user.id
            },
            select: {
              id: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      feedItems.push(...posts.map(post => ({
        id: post.id,
        content: post.content,
        type: post.type,
        visibility: post.visibility,
        mediaUrls: post.mediaUrls,
        imageUrl: post.imageUrl,
        tags: post.tags,
        location: post.location,
        sdg: post.sdg,
        isPinned: post.isPinned,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        feedType: post.organizationId ? 'organization_post' : 'user_post',
        timestamp: post.createdAt,
        // User info (if user post)
        ...(post.user && {
          userId: post.user.id,
          userName: post.user.name || `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim(),
          userAvatar: post.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user.name || 'User')}&background=random`,
          userTitle: post.user.tier,
          userType: post.user.userType
        }),
        // Organization info (if org post)
        ...(post.organization && {
          organization: post.organization
        }),
        // Interactions
        interactions: {
          likes: post._count.likes,
          comments: post._count.comments,
          shares: 0, // TODO: Implement shares
          userHasLiked: post.likes.length > 0
        }
      })));
    }

    if (type === 'following') {
      // Get posts from users and organizations the user follows
      const followingOrgs = await prisma.follow.findMany({
        where: {
          followerId: session.user.id,
          followingOrgId: { not: null }
        },
        select: {
          followingOrgId: true
        }
      });

      const followingUsers = await prisma.follow.findMany({
        where: {
          followerId: session.user.id,
          followingId: { not: null }
        },
        select: {
          followingId: true
        }
      });

      const orgIds = followingOrgs.map(f => f.followingOrgId).filter((id): id is string => id !== null);
      const userIds = followingUsers.map(f => f.followingId).filter((id): id is string => id !== null);

      if (orgIds.length > 0 || userIds.length > 0) {
        const followingPosts = await prisma.post.findMany({
          where: {
            isDeleted: false,
            OR: [
              { organizationId: { in: orgIds } },
              { userId: { in: userIds } }
            ]
          },
          take: limit * 2,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                image: true,
                occupation: true,
                impactScore: true,
                userType: true,
                tier: true
              }
            },
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
                slug: true,
                tier: true,
                type: true
              }
            },
            likes: {
              where: {
                userId: session.user.id
              },
              select: {
                id: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        feedItems.push(...followingPosts.map(post => ({
          id: post.id,
          content: post.content,
          type: post.type,
          visibility: post.visibility,
          mediaUrls: post.mediaUrls,
          imageUrl: post.imageUrl,
          tags: post.tags,
          location: post.location,
          sdg: post.sdg,
          isPinned: post.isPinned,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          feedType: post.organizationId ? 'organization_post' : 'user_post',
          timestamp: post.createdAt,
          // User info (if user post)
          ...(post.user && {
            userId: post.user.id,
            userName: post.user.name || `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim(),
            userAvatar: post.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user.name || 'User')}&background=random`,
            userTitle: post.user.tier,
            userType: post.user.userType
          }),
          // Organization info (if org post)
          ...(post.organization && {
            organization: post.organization
          }),
          // Interactions
          interactions: {
            likes: post._count.likes,
            comments: post._count.comments,
            shares: 0,
            userHasLiked: post.likes.length > 0
          }
        })));
      }
    }

    // Sort all items by timestamp (descending - newest first)
    feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply final limit and offset AFTER sorting to get proper unified timeline
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
