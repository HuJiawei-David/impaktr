// home/ubuntu/impaktrweb/src/app/api/verifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ParticipationStatus } from '@/types/enums';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';
import { Prisma, VerificationStatus, VerificationType } from '@prisma/client';

// Type for event location with coordinates
interface EventLocation {
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const createVerificationSchema = z.object({
  participationId: z.string(),
  type: z.enum(['SELF', 'ORGANIZER', 'PEER', 'GPS']),
  gpsCoordinates: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number(),
    timestamp: z.string().transform((str) => new Date(str)),
  }).optional(),
  proofData: z.object({
    photos: z.array(z.string()).optional(),
    signatures: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).optional(),
  comments: z.string().optional(),
  rating: z.number().min(0.5).max(1.5).optional(),
});

const updateVerificationSchema = z.object({
  status: z.nativeEnum(ParticipationStatus),
  comments: z.string().optional(),
  rating: z.number().min(0.5).max(1.5).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createVerificationSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const participation = await prisma.participation.findUnique({
      where: { id: validatedData.participationId },
      include: {
        event: true,
        user: true,
      }
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to verify
    const canVerify = 
      validatedData.type === 'SELF' && participation.userId === user.id ||
      validatedData.type === 'ORGANIZER' && participation.event.organizerId === user.id ||
      validatedData.type === 'PEER' && participation.userId !== user.id;

    if (!canVerify) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create this verification' },
        { status: 403 }
      );
    }

    // For GPS verification, validate proximity to event location
    if (validatedData.type === 'GPS' && validatedData.gpsCoordinates) {
      const eventLocation = participation.event.location as EventLocation;
      if (eventLocation?.coordinates) {
        const distance = calculateDistance(
          validatedData.gpsCoordinates.lat,
          validatedData.gpsCoordinates.lng,
          eventLocation.coordinates.lat,
          eventLocation.coordinates.lng
        );

        // Allow 100m radius for GPS verification
        if (distance > 0.1) {
          return NextResponse.json(
            { error: 'GPS location is too far from event location' },
            { status: 400 }
          );
        }
      }
    }

    const verification = await prisma.verification.create({
      data: {
        userId: participation.userId,
        participationId: validatedData.participationId,
        type: validatedData.type,
        status: validatedData.type === 'SELF' ? 
          'PENDING' : 'APPROVED',
        evidence: validatedData.proofData,
        reviewNote: validatedData.comments,
        rating: validatedData.rating,
      },
      include: {
        participation: {
          include: {
            event: true,
            user: true
          }
        }
      }
    });

    // If this is organizer or GPS verification, auto-approve the participation
    if (
      validatedData.type === 'ORGANIZER' ||
      validatedData.type === 'GPS'
    ) {
      await prisma.participation.update({
        where: { id: validatedData.participationId },
        data: {
          status: ParticipationStatus.VERIFIED,
          verifiedAt: new Date(),
        }
      });

      // Calculate and update Impaktr Score
      const newScore = await calculateImpaktrScore(participation.userId);
      await prisma.user.update({
        where: { id: participation.userId },
        data: { impactScore: newScore }
      });

      // Check and award badges
      await checkAndAwardBadges(participation.userId);
    }

    return NextResponse.json({ verification }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const where: Prisma.VerificationWhereInput = {
      OR: [
        { userId: user.id },
        { reviewerId: user.id },
      ]
    };

    if (status) {
      where.status = status as VerificationStatus;
    }

    if (type) {
      where.type = type as VerificationType;
    }

    const verifications = await prisma.verification.findMany({
      where,
      include: {
        participation: {
          include: {
            event: true,
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ verifications });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}