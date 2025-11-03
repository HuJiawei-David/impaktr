import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; followerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organizationId, followerId } = await params;
    const userId = session.user.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          where: {
            userId: userId,
            role: { in: ['owner', 'admin'] }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is admin or owner of the organization
    const isAdmin = organization.members.length > 0;
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Only organization admins and owners can remove followers' 
      }, { status: 403 });
    }

    // Check if follow relationship exists
    const followRelationship = await prisma.follow.findUnique({
      where: {
        followerId_followingOrgId: {
          followerId: followerId,
          followingOrgId: organizationId,
        },
      },
    });

    if (!followRelationship) {
      return NextResponse.json({ 
        error: 'Follower not found' 
      }, { status: 404 });
    }

    // Remove follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingOrgId: {
          followerId: followerId,
          followingOrgId: organizationId,
        },
      },
    });

    return NextResponse.json({ 
      message: 'Follower removed successfully'
    });

  } catch (error) {
    console.error('Error removing follower:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

