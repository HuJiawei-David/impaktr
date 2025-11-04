import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { ParticipationStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const session = await getServerSession(authOptions);
    
    // Check if user is requesting their own participations or if they have permission
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow users to view their own participations
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusParams = url.searchParams.getAll('status');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Build status filter - if no status specified, include ATTENDED and VERIFIED
    const statusFilter = statusParams.length > 0 
      ? { in: statusParams.map(s => s.toUpperCase()) as ParticipationStatus[] }
      : { in: [ParticipationStatus.ATTENDED, ParticipationStatus.VERIFIED] };

    // Fetch participations with event and certificate information
    const participations = await prisma.participation.findMany({
      where: {
        userId,
        status: statusFilter
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            status: true,
            type: true,
            sdg: true,
            location: true,
            imageUrl: true,
            images: true,
            skills: true,
            intensity: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Fetch certificates for these participations
    const eventIds = participations.map(p => p.eventId);
    const certificates = await prisma.certificate.findMany({
      where: {
        userId,
        eventId: { in: eventIds }
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organization: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      }
    });

    // Create a map of eventId -> certificate for quick lookup
    const certificateMap = new Map(
      certificates.map(cert => [cert.eventId, cert])
    );

    // Attach certificate information to participations
    const participationsWithCertificates = participations.map(participation => {
      const certificate = certificateMap.get(participation.eventId);
      return {
        ...participation,
        certificate: certificate || null
      };
    });

    return NextResponse.json({
      participations: participationsWithCertificates,
      count: participationsWithCertificates.length
    });
  } catch (error) {
    console.error('Error fetching participations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

