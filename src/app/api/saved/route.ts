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
    const type = url.searchParams.get('type') || 'all'; // all, posts, events, opportunities
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let savedItems = [];

    if (type === 'all' || type === 'posts') {
      // Get saved posts
      const savedPosts = await prisma.save.findMany({
        where: { userId: session.user.id },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  tier: true,
                }
              },
              organization: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  tier: true,
                }
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  shares: true,
                  saves: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: type === 'posts' ? limit : Math.ceil(limit / 3),
        skip: type === 'posts' ? offset : 0
      });

      savedItems.push(...savedPosts.map(save => ({
        id: save.id,
        type: 'post',
        item: {
          id: save.post.id,
          content: save.post.content,
          type: save.post.type,
          visibility: save.post.visibility,
          tags: save.post.tags,
          location: save.post.location,
          sdg: save.post.sdg,
          mediaUrls: save.post.mediaUrls,
          imageUrl: save.post.imageUrl,
          isPinned: save.post.isPinned,
          createdAt: save.post.createdAt,
          author: {
            id: save.post.user?.id || save.post.organization?.id,
            name: save.post.user?.name || save.post.organization?.name,
            avatar: save.post.user?.image || save.post.organization?.logo,
            type: save.post.user ? 'user' : 'organization',
            tier: save.post.user?.tier || save.post.organization?.tier,
          },
          stats: {
            likes: save.post._count.likes,
            comments: save.post._count.comments,
            shares: save.post._count.shares,
            saves: save.post._count.saves,
          }
        },
        savedAt: save.createdAt
      })));
    }

    if (type === 'all' || type === 'events') {
      // Get saved events (we'll need to add a SaveEvent model or use a different approach)
      // For now, we'll use participations as "saved" events
      const savedEvents = await prisma.participation.findMany({
        where: { 
          userId: session.user.id,
          status: 'PENDING' // Events user is interested in but hasn't been approved yet
        },
        include: {
          event: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  tier: true,
                }
              },
              _count: {
                select: {
                  participations: true
                }
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' },
        take: type === 'events' ? limit : Math.ceil(limit / 3),
        skip: type === 'events' ? offset : 0
      });

      savedItems.push(...savedEvents.map(participation => ({
        id: participation.id,
        type: 'event',
        item: {
          id: participation.event.id,
          title: participation.event.title,
          description: participation.event.description,
          startDate: participation.event.startDate,
          endDate: participation.event.endDate,
          location: participation.event.location,
          imageUrl: participation.event.imageUrl,
          sdg: participation.event.sdg,
          type: participation.event.type,
          status: participation.event.status,
          organization: participation.event.organization,
          stats: {
            participants: participation.event._count.participations,
            maxParticipants: participation.event.maxParticipants,
          }
        },
        savedAt: participation.joinedAt
      })));
    }

    if (type === 'all' || type === 'opportunities') {
      // Get saved opportunities (applications user has made)
      const savedOpportunities = await prisma.application.findMany({
        where: { 
          userId: session.user.id,
          status: 'PENDING' // Opportunities user has applied to
        },
        include: {
          opportunity: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  tier: true,
                }
              },
              _count: {
                select: {
                  applications: true
                }
              }
            }
          }
        },
        orderBy: { appliedAt: 'desc' },
        take: type === 'opportunities' ? limit : Math.ceil(limit / 3),
        skip: type === 'opportunities' ? offset : 0
      });

      savedItems.push(...savedOpportunities.map(application => ({
        id: application.id,
        type: 'opportunity',
        item: {
          id: application.opportunity.id,
          title: application.opportunity.title,
          description: application.opportunity.description,
          requirements: application.opportunity.requirements,
          spots: application.opportunity.spots,
          spotsFilled: application.opportunity.spotsFilled,
          deadline: application.opportunity.deadline,
          location: application.opportunity.location,
          isRemote: application.opportunity.isRemote,
          skills: application.opportunity.skills,
          sdg: application.opportunity.sdg,
          status: application.opportunity.status,
          organization: application.opportunity.organization,
          stats: {
            totalApplications: application.opportunity._count.applications,
            spotsRemaining: application.opportunity.spots - application.opportunity.spotsFilled,
          }
        },
        savedAt: application.appliedAt
      })));
    }

    // Sort all items by savedAt date
    savedItems.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    // Apply limit and offset for 'all' type
    if (type === 'all') {
      savedItems = savedItems.slice(offset, offset + limit);
    }

    return NextResponse.json({ savedItems });
  } catch (error) {
    console.error('Error fetching saved items:', error);
    return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 });
  }
}

