import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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

    // Find organizations where user is admin or owner
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs
    const organizationIds = adminMemberships.map(m => m.organization.id);

    // First, get all verified participations from organization events that don't have certificates yet
    const verifiedParticipations = await prisma.participation.findMany({
      where: {
        status: 'VERIFIED',
        event: {
          organizationId: { in: organizationIds }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: {
        verifiedAt: 'desc'
      }
    });

    // Filter out participations that already have certificates
    const existingCertificates = await prisma.certificate.findMany({
      where: {
        userId: { in: verifiedParticipations.map(p => p.userId) },
        eventId: { in: verifiedParticipations.map(p => p.eventId) }
      },
      select: {
        userId: true,
        eventId: true
      }
    });

    const existingCertificateKeys = new Set(
      existingCertificates.map(c => `${c.userId}-${c.eventId}`)
    );

    const certificates = verifiedParticipations
      .filter(p => !existingCertificateKeys.has(`${p.userId}-${p.eventId}`))
      .map(p => ({
        id: p.id, // Using participation ID as a temporary identifier
        userId: p.userId,
        eventId: p.eventId,
        issuedAt: null,
        user: p.user,
        event: p.event,
        participation: {
          hours: p.hours,
          status: p.status
        }
      }));

    return NextResponse.json({
      certificates,
      count: certificates.length
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

