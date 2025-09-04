// home/ubuntu/impaktrweb/src/app/api/organization/members/invite/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendOrganizationInvitation } from '@/lib/email';
import crypto from 'crypto';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'admin']).default('member'),
  organizationId: z.string().optional(), // Will be derived from user's owned organization if not provided
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, organizationId, message } = inviteMemberSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        ownedOrganizations: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine which organization to use
    let organization;
    if (organizationId) {
      // Check if user has permission for the specified organization
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          members: {
            where: { userId: user.id }
          }
        }
      });

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      const isOwner = organization.ownerId === user.id;
      const membership = organization.members[0];
      const isAdmin = membership?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    } else {
      // Use user's owned organization
      organization = user.ownedOrganizations[0];
      if (!organization) {
        return NextResponse.json(
          { error: 'You must be an organization owner to invite members' },
          { status: 403 }
        );
      }
    }

    // Check if target user already exists and is a member
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (targetUser) {
      const existingMembership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: organization.id,
            userId: targetUser.id,
          },
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.organizationInvitation.findFirst({
      where: {
        organizationId: organization.id,
        email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation record
    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId: organization.id,
        email,
        role,
        token: invitationToken,
        invitedBy: user.id,
        expiresAt,
        message: message || null,
        status: 'PENDING'
      },
      include: {
        organization: true,
        inviter: {
          include: { profile: true }
        }
      }
    });

    // Prepare email content
    const inviterName = user.profile?.displayName || 
                       `${user.profile?.firstName} ${user.profile?.lastName}`.trim() || 
                       user.email || 'Unknown User';

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/organization/accept-invite?token=${invitationToken}`;

    // Send invitation email
    try {
      await sendOrganizationInvitation({
        to: email,
        organizationName: organization.name,
        inviterName,
        role,
        invitationUrl,
        message: message || undefined
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the entire request if email fails
      // The invitation is still created in the database
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organizationName: organization.name,
        inviterName,
        expiresAt: invitation.expiresAt,
        invitationUrl // Include for testing purposes
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error sending organization invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user has permission to view invitations
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          where: { userId: user.id }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const isOwner = organization.ownerId === user.id;
    const membership = organization.members[0];
    const isAdmin = membership?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get pending invitations
    const invitations = await prisma.organizationInvitation.findMany({
      where: { 
        organizationId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        inviter: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      message: invitation.message,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      invitedBy: {
        id: invitation.inviter.id,
        name: invitation.inviter.profile?.displayName || 
              `${invitation.inviter.profile?.firstName} ${invitation.inviter.profile?.lastName}`.trim() ||
              invitation.inviter.email,
        email: invitation.inviter.email
      }
    }));

    return NextResponse.json({ 
      invitations: formattedInvitations,
      total: formattedInvitations.length
    });

  } catch (error) {
    console.error('Error fetching organization invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}