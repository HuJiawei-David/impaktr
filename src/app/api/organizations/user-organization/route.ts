import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization membership
    const userMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        status: 'active'
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            description: true,
            industry: true,
            subscriptionTier: true
          }
        }
      }
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'User not part of any organization' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      organizationId: userMembership.organization.id,
      organization: userMembership.organization,
      role: userMembership.role
    });

  } catch (error) {
    console.error('Error fetching user organization:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
