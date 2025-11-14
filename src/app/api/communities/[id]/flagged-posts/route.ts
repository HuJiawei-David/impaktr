import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/communities/[id]/flagged-posts - Get flagged posts for owners/admins
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is owner or admin
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      }
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all pending reports for posts in this community
    const reports = await prisma.communityPostReport.findMany({
      where: {
        post: {
          communityId: id
        },
        status: 'PENDING'
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
              }
            },
            community: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        reporter: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group reports by post
    const flaggedPostsMap = new Map();
    reports.forEach(report => {
      const postId = report.postId;
      if (!flaggedPostsMap.has(postId)) {
        flaggedPostsMap.set(postId, {
          post: report.post,
          reports: [],
          reportCount: 0
        });
      }
      flaggedPostsMap.get(postId).reports.push(report);
      flaggedPostsMap.get(postId).reportCount += 1;
    });

    const flaggedPosts = Array.from(flaggedPostsMap.values());

    return NextResponse.json({ 
      flaggedPosts,
      total: flaggedPosts.length
    });

  } catch (error) {
    console.error('Error fetching flagged posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

