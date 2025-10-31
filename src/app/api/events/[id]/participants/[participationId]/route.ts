import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId, participationId } = await params;

    // Fetch the participation and event
    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        event: {
          include: {
            organization: {
              include: {
                members: true
              }
            }
          }
        }
      }
    });

    if (!participation || participation.eventId !== eventId) {
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    // Check if user is admin/owner of the organization or event organizer
    const isOrgMember = participation.event.organization?.members.some(
      member => member.userId === session.user.id && (member.role === 'admin' || member.role === 'owner')
    );

    if (!isOrgMember && participation.event.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Only event organizers and organization admins can delete participants' }, { status: 403 });
    }

    // Prevent deletion of VERIFIED participations as they may have affected scoring
    if (participation.status === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Cannot delete verified participation. It may have affected user impact scores.' },
        { status: 400 }
      );
    }

    // Delete the participation
    await prisma.participation.delete({
      where: { id: participationId }
    });

    // Update event current participants count if needed
    if (participation.status === 'CONFIRMED' || participation.status === 'ATTENDED') {
      const confirmedCount = await prisma.participation.count({
        where: {
          eventId,
          status: { in: ['CONFIRMED', 'VERIFIED'] }
        }
      });

      await prisma.event.update({
        where: { id: eventId },
        data: {
          currentParticipants: confirmedCount
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Error deleting participation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

