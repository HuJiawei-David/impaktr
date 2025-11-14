import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const acceptInviteSchema = z.object({
  token: z.string().optional(),
  invitationId: z.string().optional(),
}).refine(data => data.token || data.invitationId, {
  message: "Either token or invitationId must be provided"
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

    const { id: communityId } = await params;
    const body = await request.json();
    const { token, invitationId } = acceptInviteSchema.parse(body);

    // Find invitation
    let invitation;
    if (invitationId) {
      invitation = await prisma.communityInvitation.findUnique({
        where: { id: invitationId },
        include: {
          community: true,
          invitedUser: true
        }
      });
    } else if (token) {
      invitation = await prisma.communityInvitation.findUnique({
        where: { token },
        include: {
          community: true,
          invitedUser: true
        }
      });
    }

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify community matches
    if (invitation.communityId !== communityId) {
      return NextResponse.json(
        { error: 'Invitation does not match this community' },
        { status: 400 }
      );
    }

    // Verify invitation is for current user
    if (invitation.userId && invitation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'This invitation is not for you' },
        { status: 403 }
      );
    }

    if (invitation.email) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      if (user?.email !== invitation.email) {
        return NextResponse.json(
          { error: 'This invitation is not for your email address' },
          { status: 403 }
        );
      }
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This invitation has already been used or expired' },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.communityInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: session.user.id
        }
      }
    });

    if (existingMembership) {
      // Mark invitation as accepted anyway
      await prisma.communityInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });
      return NextResponse.json(
        { error: 'You are already a member of this community' },
        { status: 400 }
      );
    }

    // Create membership
    await prisma.$transaction(async (tx) => {
      // Create membership
      await tx.communityMember.create({
        data: {
          communityId,
          userId: session.user.id,
          role: 'MEMBER'
        }
      });

      // Update member count
      await tx.community.update({
        where: { id: communityId },
        data: {
          memberCount: {
            increment: 1
          }
        }
      });

      // Update invitation status
      await tx.communityInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });

      // Update member avatars
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { image: true }
      });

      if (user?.image) {
        const community = await tx.community.findUnique({
          where: { id: communityId },
          select: { memberAvatars: true }
        });

        if (community && !community.memberAvatars.includes(user.image)) {
          await tx.community.update({
            where: { id: communityId },
            data: {
              memberAvatars: {
                push: user.image
              }
            }
          });
        }
      }
    });

    return NextResponse.json({
      message: 'Successfully joined the community!',
      community: {
        id: invitation.community.id,
        name: invitation.community.name
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error accepting community invitation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

