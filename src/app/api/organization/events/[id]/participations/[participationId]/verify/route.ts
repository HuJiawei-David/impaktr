import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participationId: string }> }
) {
  try {
    const { id, participationId } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find organizations where user is admin or owner (same as events list API)
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs that user has admin access to
    const organizationIds = adminMemberships.map(m => m.organization.id);

    // Verify the participation belongs to an event owned by this organization
    const participation = await prisma.participation.findFirst({
      where: {
        id: participationId,
        event: {
          id,
          organizationId: { in: organizationIds }
        }
      },
      include: {
        user: true,
        event: true
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    // Update participation status to VERIFIED
    await prisma.participation.update({
      where: { id: participationId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date()
      }
    });

    // Create a verification record
    await prisma.verification.create({
      data: {
        participationId,
        type: 'ORGANIZER',
        status: 'APPROVED',
        rating: 1.0, // Default rating
        verifiedBy: user.id,
        verifiedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error verifying participation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
