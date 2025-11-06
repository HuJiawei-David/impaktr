import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { calculateImpaktrScore } from '@/lib/scoring';
import { ParticipationStatus } from '@/types/enums';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    // Get event and verify organization ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: true,
        participations: {
          where: {
            status: ParticipationStatus.VERIFIED
          },
          include: {
            user: true,
            event: true,
            verifications: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions - must be event creator or organization admin/owner
    const isCreator = event.organizerId === user.id;
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );
    const isOrgAdmin = event.organizationId && adminMemberships.some(
      (m) => m.organization.id === event.organizationId
    );

    if (!isCreator && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Calculate total impact score for the event
    // This is the sum of all individual participant scores from this event
    let totalEventImpactScore = 0;
    const participantScores: Array<{
      participantId: string;
      participantName: string;
      score: number;
      hours: number;
    }> = [];

    for (const participation of event.participations) {
      // Calculate score contribution for this participation
      const hours = participation.hours || 0;
      const H = Math.log10(hours + 1) * 100;

      // Get event intensity
      const I = event.intensity || 1.0;

      // Get skill multiplier (simplified - would need user skills)
      const S = 1.0; // Default, could be enhanced

      // Get quality rating from verification
      const verification = participation.verifications?.find(v => v.status === 'APPROVED');
      const Q = verification?.rating || 1.0;

      // Verification factor
      const V = 1.1; // Assuming organizer verification

      // Location multiplier (simplified)
      const L = 1.0;

      // Calculate participation score
      const participationScore = (H * I * S * Q * V) * L;
      const finalScore = Math.min(participationScore * 0.1, 1000);
      const roundedScore = Math.round(finalScore * 10) / 10;

      totalEventImpactScore += roundedScore;

      participantScores.push({
        participantId: participation.userId,
        participantName: participation.user.name || participation.user.email || 'Unknown',
        score: roundedScore,
        hours: hours
      });
    }

    // Get statistics
    const stats = {
      totalParticipants: event.participations.length,
      verifiedParticipants: event.participations.filter(p => p.status === ParticipationStatus.VERIFIED).length,
      totalHours: event.participations.reduce((sum, p) => sum + (p.hours || 0), 0),
      averageHours: event.participations.length > 0 
        ? event.participations.reduce((sum, p) => sum + (p.hours || 0), 0) / event.participations.length 
        : 0,
      averageScore: event.participations.length > 0 
        ? totalEventImpactScore / event.participations.length 
        : 0
    };

    return NextResponse.json({
      eventId: event.id,
      eventTitle: event.title,
      totalImpactScore: Math.round(totalEventImpactScore * 10) / 10,
      participantScores,
      stats
    });

  } catch (error) {
    console.error('Error calculating event impact score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


