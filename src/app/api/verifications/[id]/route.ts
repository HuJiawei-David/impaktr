// home/ubuntu/impaktrweb/src/app/api/verifications/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';

const updateVerificationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
  rating: z.number().min(0.5).max(1.5).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reviewNote, rating } = updateVerificationSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const verification = await prisma.verification.findUnique({
      where: { id },
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

    // Check if verification is for a participation
    if (!verification.participation) {
      return NextResponse.json(
        { error: 'This verification is not linked to a participation' },
        { status: 400 }
      );
    }

    // Check if user has permission to update verification
    // Organization members can verify participations in their organization's events
    const event = verification.participation.event;
    if (!event.organizationId) {
      return NextResponse.json(
        { error: 'Event is not linked to an organization' },
        { status: 400 }
      );
    }

    const isMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: event.organizationId,
        userId: user.id,
        role: { in: ['owner', 'admin', 'manager'] } // Only these roles can verify
      }
    });

    if (!isMember) {
      return NextResponse.json(
        { error: 'Insufficient permissions to verify this participation' },
        { status: 403 }
      );
    }

    // Update verification
    const updatedVerification = await prisma.verification.update({
      where: { id },
      data: {
        status,
        reviewNote,
        rating,
        reviewedAt: new Date(),
        reviewerId: user.id,
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

    // Update participation status if verification is approved
    if (status === 'APPROVED') {
      await prisma.participation.update({
        where: { id: verification.participationId! },
        data: {
          status: 'ATTENDED',
          verifiedAt: new Date(),
        }
      });

      // Calculate and update user's Impaktr Score
      const participantId = verification.participation.userId;
      const oldScore = verification.participation.user.impactScore;
      const newScore = await calculateImpaktrScore(participantId);
      
      await prisma.user.update({
        where: { id: participantId },
        data: { impactScore: newScore }
      });

      // Check and award badges
      await checkAndAwardBadges(participantId);

      // Create score history entry
      await prisma.scoreHistory.create({
        data: {
          userId: participantId,
          oldScore,
          newScore,
          change: newScore - oldScore,
          reason: 'participation_verified',
          hoursComponent: verification.participation.hours || 0,
          intensityComponent: 1.0, // Default intensity
          skillComponent: 1.0, // Default skill
          qualityComponent: rating || 1.0,
          verificationComponent: 1.1, // Organization verification bonus
          locationComponent: 1.0, // Default location
          eventId: verification.participation.eventId,
          participationId: verification.participationId,
        }
      });
    } else if (status === 'REJECTED') {
      // Mark participation as cancelled if rejected
      await prisma.participation.update({
        where: { id: verification.participationId! },
        data: {
          status: 'CANCELLED',
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const verification = await prisma.verification.findUnique({
      where: { id },
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

    // Check permissions
    if (verification.participation?.event.organizationId) {
      const isMember = await prisma.organizationMember.findFirst({
        where: {
          organizationId: verification.participation.event.organizationId,
          userId: user.id,
          role: { in: ['owner', 'admin', 'manager'] }
        }
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'Insufficient permissions to delete this verification' },
          { status: 403 }
        );
      }
    }

    // Cannot delete approved verifications
    if (verification.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot delete approved verification' },
        { status: 400 }
      );
    }

    await prisma.verification.delete({
      where: { id },
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
