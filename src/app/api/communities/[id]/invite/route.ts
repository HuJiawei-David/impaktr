import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const inviteSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
}).refine(data => data.userId || data.email, {
  message: "Either userId or email must be provided"
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
    const { userId, email } = inviteSchema.parse(body);

    // Check if community exists and is INVITE_ONLY
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        members: {
          where: {
            userId: session.user.id,
            role: { in: ['OWNER', 'ADMIN'] }
          }
        }
      }
    });

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (community.privacy !== 'INVITE_ONLY') {
      return NextResponse.json(
        { error: 'This community is not invite-only. Use request-join for private communities.' },
        { status: 400 }
      );
    }

    // Check if user has permission (owner or admin)
    if (community.members.length === 0) {
      return NextResponse.json(
        { error: 'You must be an owner or admin to send invitations' },
        { status: 403 }
      );
    }

    // If userId is provided, check if user exists
    let targetUserId: string | null = null;
    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      targetUserId = targetUser.id;

      // Check if user is already a member
      const existingMembership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId,
            userId: targetUserId
          }
        }
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User is already a member of this community' },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.communityInvitation.findFirst({
      where: {
        communityId,
        status: 'PENDING',
        ...(userId ? { userId } : { email }),
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this user' },
        { status: 400 }
      );
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const invitation = await prisma.communityInvitation.create({
      data: {
        communityId,
        userId: targetUserId || null,
        email: email || null,
        invitedBy: session.user.id,
        token,
        expiresAt,
        status: 'PENDING'
      },
      include: {
        invitedUser: userId ? {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        } : undefined,
        inviter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        community: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // If user exists (userId provided), create notification
    if (targetUserId) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'CUSTOM',
          title: 'Community Invitation',
          message: `${invitation.inviter.name} invited you to join ${invitation.community.name}`,
          data: {
            notificationType: 'COMMUNITY_INVITATION',
            communityId: communityId,
            invitationId: invitation.id,
            inviterId: session.user.id,
            inviterName: invitation.inviter.name,
            communityName: invitation.community.name,
            actionUrl: `/community/${communityId}?invite=${token}`
          },
          isRead: false,
        }
      });
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        userId: invitation.userId,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitedUser: invitation.invitedUser,
        inviter: invitation.inviter,
        community: invitation.community
      },
      message: userId 
        ? 'Invitation sent successfully' 
        : 'Invitation created. User will receive it when they sign up with this email.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending community invitation:', error);
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

