// /home/ubuntu/impaktrweb/src/app/api/social/posts/[id]/comments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = createCommentSchema.parse(body);
    
    const { id } = await params;
    const postId = id;

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: session.user.id,
        content
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Comment created successfully',
      comment: {
        id: comment.id,
        content: comment.content,
        author: {
          id: comment.user.id,
          name: comment.user.profile?.displayName || 'Unknown User',
          avatar: comment.user.profile?.avatar || ''
        },
        createdAt: comment.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}