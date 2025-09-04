// /home/ubuntu/impaktrweb/src/app/api/organization/accept-invite/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const acceptInviteSchema = z.object({
  token: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = acceptInviteSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the invitation
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: true,
        inviter: {
          include: { profile: true }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `Invitation has already been ${invitation.status.toLowerCase()}` 
      }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if user's email matches the invitation
    if (invitation.email !== user.email) {
      return NextResponse.json({ 
        error: 'This invitation was sent to a different email address' 
      }, { status: 403 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      // Mark invitation as accepted since user is already a member
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      });

      return NextResponse.json({ 
        message: 'You are already a member of this organization',
        membership: existingMembership
      });
    }

    // Create membership and update invitation in a transaction
    const result = await prisma.$transaction([
      // Create organization membership
      prisma.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: invitation.role,
        },
        include: {
          organization: true,
          user: {
            include: { profile: true }
          }
        }
      }),
      // Update invitation status
      prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      })
    ]);

    const [membership] = result;

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${invitation.organization.name}`,
      membership: {
        id: membership.id,
        role: membership.role,
        joinedAt: membership.joinedAt,
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          type: membership.organization.type
        }
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error accepting organization invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch invitation details by token (for invitation page)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invitation = await prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: true,
        inviter: {
          include: { profile: true }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if invitation has expired
    const isExpired = invitation.expiresAt < new Date();
    if (isExpired && invitation.status === 'PENDING') {
      // Mark as expired
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: isExpired ? 'EXPIRED' : invitation.status,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
        isExpired,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
          type: invitation.organization.type
        },
        invitedBy: {
          name: invitation.inviter.profile?.displayName || 
                `${invitation.inviter.profile?.firstName} ${invitation.inviter.profile?.lastName}`.trim() ||
                invitation.inviter.email,
          email: invitation.inviter.email
        }
      }
    });

  } catch (error) {
    console.error('Error fetching invitation details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
