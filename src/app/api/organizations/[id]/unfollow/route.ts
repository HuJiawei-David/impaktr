import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organizationId } = await params;
    const userId = session.user.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingOrgId: {
          followerId: userId,
          followingOrgId: organizationId,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json({ 
        error: 'Not following this organization',
        isFollowing: false 
      }, { status: 400 });
    }

    // Remove follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingOrgId: {
          followerId: userId,
          followingOrgId: organizationId,
        },
      },
    });

    return NextResponse.json({ 
      message: 'Successfully unfollowed organization',
      isFollowing: false 
    });

  } catch (error) {
    console.error('Error unfollowing organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
