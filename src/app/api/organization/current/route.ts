import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with organization memberships
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the first organization the user is a member of
    const membership = user.organizationMemberships[0];
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organization = membership.organization;

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        logo: organization.logo,
        tier: organization.tier,
        type: organization.type,
        userRole: membership.role
      }
    });

  } catch (error) {
    console.error('Error fetching organization data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
