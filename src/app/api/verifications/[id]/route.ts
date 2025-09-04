// home/ubuntu/impaktrweb/src/app/api/verifications/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ParticipationStatus } from '@prisma/client';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';

const updateVerificationSchema = z.object({
  status: z.nativeEnum(ParticipationStatus),
  comments: z.string().optional(),
  rating: z.number().min(0.5).max(1.5).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, comments, rating } = updateVerificationSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const verification = await prisma.verification.findUnique({
      where: { id: params.id },
      include: {
        participation: {
          include: {
            event: true,
            user: true,
          }
        }
      }
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update verification
    const canUpdate = 
      verification.verifierId === user.id || 
      verification.participation.event.creatorId === user.id;

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this verification' },
        { status: 403 }
      );
    }

    const updatedVerification = await prisma.verification.update({
      where: { id: params.id },
      data: {
        status,
        comments,
        rating,
      },
      include: {
        participation: {
          include: {
            event: true,
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        verifier: {
          include: {
            profile: true
          }
        }
      }
    });

    // Update participation status if verification is approved
    if (status === ParticipationStatus.VERIFIED) {
      await prisma.participation.update({
        where: { id: verification.participationId },
        data: {
          status: ParticipationStatus.VERIFIED,
          verifiedAt: new Date(),
          qualityRating: rating || verification.rating || 1.0,
        }
      });

      // Calculate and update Impaktr Score
      const newScore = await calculateImpaktrScore(verification.participation.userId);
      await prisma.user.update({
        where: { id: verification.participation.userId },
        data: { impaktrScore: newScore }
      });

      // Check and award badges
      await checkAndAwardBadges(verification.participation.userId);

      // Create score history entry
      await prisma.scoreHistory.create({
        data: {
          userId: verification.participation.userId,
          oldScore: verification.participation.user.impaktrScore,
          newScore,
          change: newScore - verification.participation.user.impaktrScore,
          reason: 'event_verified',
          hoursComponent: verification.participation.hoursActual || verification.participation.hoursCommitted,
          intensityComponent: verification.participation.event.intensity,
          skillComponent: verification.participation.skillMultiplier,
          qualityComponent: rating || verification.rating || 1.0,
          verificationComponent: 1.1, // Peer/organizer verification bonus
          locationComponent: 1.0, // Default location multiplier
          eventId: verification.participation.eventId,
          participationId: verification.participationId,
        }
      });
    } else if (status === ParticipationStatus.REJECTED) {
      await prisma.participation.update({
        where: { id: verification.participationId },
        data: {
          status: ParticipationStatus.REJECTED,
        }
      });
    }

    return NextResponse.json({ verification: updatedVerification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const verification = await prisma.verification.findUnique({
      where: { id: params.id },
      include: {
        participation: {
          include: {
            event: true,
          }
        }
      }
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete verification
    const canDelete = 
      verification.verifierId === user.id || 
      verification.participation.event.creatorId === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this verification' },
        { status: 403 }
      );
    }

    if (verification.status === ParticipationStatus.VERIFIED) {
      return NextResponse.json(
        { error: 'Cannot delete verified verification' },
        { status: 400 }
      );
    }

    await prisma.verification.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Verification deleted successfully' });
  } catch (error) {
    console.error('Error deleting verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}