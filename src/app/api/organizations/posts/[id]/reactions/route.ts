import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type } = body;

    if (!['LIKE', 'LOVE', 'INSPIRE', 'SUPPORT', 'KUDOS'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.organizationPost.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user already reacted
    const existingReaction = await prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id
        }
      }
    });

    if (existingReaction) {
      // Update existing reaction
      const reaction = await prisma.postReaction.update({
        where: {
          postId_userId: {
            postId: id,
            userId: session.user.id
          }
        },
        data: { type },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      });

      // Update post reaction counts
      await updatePostReactionCounts(id);

      return NextResponse.json(reaction);
    } else {
      // Create new reaction
      const reaction = await prisma.postReaction.create({
        data: {
          postId: id,
          userId: session.user.id,
          type,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      });

      // Update post reaction counts
      await updatePostReactionCounts(id);

      return NextResponse.json(reaction, { status: 201 });
    }

  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if reaction exists
    const existingReaction = await prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id
        }
      }
    });

    if (!existingReaction) {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    }

    // Delete reaction
    await prisma.postReaction.delete({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id
        }
      }
    });

    // Update post reaction counts
    await updatePostReactionCounts(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}

async function updatePostReactionCounts(postId: string) {
  const reactionCounts = await prisma.postReaction.groupBy({
    by: ['type'],
    where: { postId },
    _count: { type: true }
  });

  const counts = {
    likes: 0,
    shares: 0,
    kudos: 0,
  };

  reactionCounts.forEach(({ type, _count }) => {
    switch (type) {
      case 'LIKE':
      case 'LOVE':
      case 'INSPIRE':
      case 'SUPPORT':
        counts.likes += _count.type;
        break;
      case 'KUDOS':
        counts.kudos += _count.type;
        break;
    }
  });

  await prisma.organizationPost.update({
    where: { id: postId },
    data: {
      likes: counts.likes,
      kudos: counts.kudos,
    }
  });
}
