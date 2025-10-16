import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organizationId } = await params;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingOrgId: {
          followerId: session.user.id,
          followingOrgId: organizationId
        }
      }
    });

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this organization' }, { status: 400 });
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingOrgId: organizationId,
      },
      include: {
        followingOrg: {
          select: {
            id: true,
            name: true,
            logo: true,
            tier: true,
            description: true,
            _count: {
              select: {
                followers: true,
                posts: true,
                events: true,
              }
            }
          }
        }
      }
    });

    // Notify organization admins
    const admins = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      },
      include: { user: true }
    });

    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.userId,
        type: 'FOLLOW',
        title: 'New Follower',
        message: `${session.user.name} started following ${organization.name}`,
        data: {
          followerId: session.user.id,
          organizationId,
        }
      }))
    });

    return NextResponse.json({ follow });
  } catch (error) {
    console.error('Error following organization:', error);
    return NextResponse.json({ error: 'Failed to follow organization' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organizationId } = await params;

    // Check if follow relationship exists
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingOrgId: {
          followerId: session.user.id,
          followingOrgId: organizationId
        }
      }
    });

    if (!follow) {
      return NextResponse.json({ error: 'Not following this organization' }, { status: 400 });
    }

    await prisma.follow.delete({
      where: { id: follow.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing organization:', error);
    return NextResponse.json({ error: 'Failed to unfollow organization' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organizationId } = await params;

    // Check if user is following this organization
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingOrgId: {
          followerId: session.user.id,
          followingOrgId: organizationId
        }
      }
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 });
  }
}
