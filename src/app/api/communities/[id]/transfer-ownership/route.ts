import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1),
});

// POST /api/communities/[id]/transfer-ownership - Transfer ownership
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
    const { newOwnerId } = transferOwnershipSchema.parse(body);

    // Check if requester is owner
    const requesterMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      }
    });

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can transfer ownership' },
        { status: 403 }
      );
    }

    // Check if new owner is a member
    const newOwnerMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: newOwnerId
        }
      }
    });

    if (!newOwnerMembership) {
      return NextResponse.json(
        { error: 'New owner must be a member of the community' },
        { status: 400 }
      );
    }

    if (newOwnerId === session.user.id) {
      return NextResponse.json(
        { error: 'You are already the owner' },
        { status: 400 }
      );
    }

    // Update old owner to ADMIN
    await prisma.communityMember.update({
      where: {
        communityId_userId: {
          communityId: id,
          userId: session.user.id
        }
      },
      data: {
        role: 'ADMIN'
      }
    });

    // Update new owner to OWNER
    await prisma.communityMember.update({
      where: {
        communityId_userId: {
          communityId: id,
          userId: newOwnerId
        }
      },
      data: {
        role: 'OWNER'
      }
    });

    // Update community createdBy field
    await prisma.community.update({
      where: { id },
      data: {
        createdBy: newOwnerId
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Ownership transferred successfully' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error transferring ownership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

