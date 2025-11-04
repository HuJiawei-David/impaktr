import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ participationId: string }> }
) {
  try {
    const { participationId } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch participation with all related data
    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        event: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            impactScore: true,
            image: true
          }
        }
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    // Verify that the participation belongs to the current user
    if (participation.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch certificate separately using userId and eventId
    // Certificates are linked to users and events, not directly to participations
    const certificate = await prisma.certificate.findFirst({
      where: {
        userId: participation.userId,
        eventId: participation.eventId
      },
      include: {
        event: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      },
      orderBy: {
        issuedAt: 'desc' // Get the most recent certificate
      }
    });

    // Attach certificate to participation object
    const participationWithCertificate = {
      ...participation,
      certificate: certificate || null
    };

    return NextResponse.json({ participation: participationWithCertificate });
  } catch (error) {
    console.error('Error fetching participation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

