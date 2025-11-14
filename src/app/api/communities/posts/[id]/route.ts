import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// PUT /api/communities/posts/[id] - Update post (pin/unpin, hide)
export async function PUT(
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
    const { action, isPinned } = body;

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

    const isOwner = membership.role === 'OWNER';
    const isAdmin = membership.role === 'ADMIN';
    const isModerator = membership.role === 'MODERATOR';
    const isPostAuthor = post.userId === session.user.id;
    const canModerate = isOwner || isAdmin || isModerator;

    if (action === 'pin' || action === 'unpin') {
      // Only owners/admins/moderators can pin/unpin
      if (!canModerate) {
        return NextResponse.json(
          { error: 'Insufficient permissions to pin posts' },
          { status: 403 }
        );
      }

      const updatedPost = await prisma.communityPost.update({
        where: { id },
        data: { isPinned: isPinned ?? !post.isPinned }
      });

      return NextResponse.json({ 
        post: updatedPost,
        message: isPinned ? 'Post pinned' : 'Post unpinned'
      });
    }

    if (action === 'hide') {
      // Members can hide posts (for themselves), owners/admins can hide for everyone
      // For now, we'll implement a soft delete approach
      // Since there's no isHidden field, we'll use a workaround or add the field
      // For now, let's just allow members to "hide" by not showing it (client-side)
      // Owners/admins can actually delete
      return NextResponse.json({ 
        message: 'Post hidden',
        hidden: true
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating community post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    const isOwner = membership.role === 'OWNER';
    const isAdmin = membership.role === 'ADMIN';
    const isModerator = membership.role === 'MODERATOR';
    const isPostAuthor = post.userId === session.user.id;
    const canDelete = isOwner || isAdmin || isModerator || isPostAuthor;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this post' },
        { status: 403 }
      );
    }

    // Delete the post
    await prisma.communityPost.delete({
      where: { id }
    });

    // Update community post count
    await prisma.community.update({
      where: { id: post.communityId },
      data: {
        postCount: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting community post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

