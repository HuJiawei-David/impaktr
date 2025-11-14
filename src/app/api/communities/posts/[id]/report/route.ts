import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const reportPostSchema = z.object({
  reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'COPYRIGHT_VIOLATION', 'OTHER']),
  description: z.string().optional(),
});

// POST /api/communities/posts/[id]/report - Flag/Report a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason, description } = reportPostSchema.parse(body);

    // Get the post
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        community: {
          include: {
            members: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is member of community
    const membership = post.community.members[0];
    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      );
    }

    // Check if user already reported this post
    const existingReport = await prisma.communityPostReport.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id
        }
      }
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this post' },
        { status: 400 }
      );
    }

    // Create the report
    const report = await prisma.communityPostReport.create({
      data: {
        postId: id,
        userId: session.user.id,
        reason,
        description: description || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Post reported successfully',
      report
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error reporting community post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

