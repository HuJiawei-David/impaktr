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
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
                type: true,
                description: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Filter organizations where user has admin or owner role
    const adminOrganizations = user.organizationMemberships
      .filter(membership => 
        membership.role === 'admin' || membership.role === 'owner'
      )
      .map(membership => ({
        id: membership.organization.id,
        name: membership.organization.name,
        logo: membership.organization.logo,
        type: membership.organization.type,
        description: membership.organization.description,
        role: membership.role,
      }));

    return NextResponse.json({
      organizations: adminOrganizations,
      total: adminOrganizations.length,
    });

  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
