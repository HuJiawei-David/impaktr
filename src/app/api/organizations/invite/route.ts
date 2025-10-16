import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, message } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Find user's organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || !user.organizationMemberships[0]) {
      return NextResponse.json({ error: 'Not part of an organization' }, { status: 404 });
    }

    const membership = user.organizationMemberships[0];
    const organization = membership.organization;

    // Check if user has permission (admin or manager)
    if (membership.role !== 'admin' && membership.role !== 'manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if user already exists and is a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        organizationMemberships: true,
      },
    });

    if (
      existingUser?.organizationMemberships.some(
        (m) => m.organizationId === organization.id
      )
    ) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');

    // Create organization member with invited status
    if (existingUser) {
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: existingUser.id,
          role: role,
          status: 'invited',
          invitedBy: user.id,
        },
      });
    }

    // TODO: Send invitation email with token
    console.log('Invitation token:', token);
    console.log('Message:', message);

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
