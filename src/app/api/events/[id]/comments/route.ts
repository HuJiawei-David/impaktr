import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const comments = await prisma.eventComment.findMany({
      where: {
        eventId,
        parentId: null // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            impactScore: true,
            tier: true
          }
        },
        likes: {
          select: {
            id: true,
            userId: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                impactScore: true,
                tier: true
              }
            },
            likes: {
              select: {
                id: true,
                userId: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to match expected format
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        name: comment.user.name || '',
        email: comment.user.email || '',
        image: comment.user.image,
        currentRank: comment.user.tier || 'HELPER'
      },
      likes: comment.likes,
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
        parentId: reply.parentId,
        user: {
          id: reply.user.id,
          name: reply.user.name || '',
          email: reply.user.email || '',
          image: reply.user.image,
          currentRank: reply.user.tier || 'HELPER'
        },
        likes: reply.likes,
        replies: []
      }))
    }));

    return NextResponse.json({ 
      comments: transformedComments,
      total: comments.length
    });
  } catch (error) {
    console.error('Error fetching event comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // If it's a reply, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.eventComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    // Create comment
    const comment = await prisma.eventComment.create({
      data: {
        content: content.trim(),
        eventId,
        userId: session.user.id,
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            impactScore: true,
            tier: true
          }
        },
        likes: true
      }
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        parentId: comment.parentId,
        user: {
          id: comment.user.id,
          name: comment.user.name || '',
          email: comment.user.email || '',
          image: comment.user.image,
          currentRank: comment.user.tier || 'HELPER'
        },
        likes: comment.likes,
        replies: []
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

