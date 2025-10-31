import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId, participationId } = await params;

    if (!eventId || !participationId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

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

    if (!participation) {
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    if (participation.eventId !== eventId) {
      return NextResponse.json({ error: 'Participation does not belong to this event' }, { status: 400 });
    }

    if (!participation.event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is admin/owner of the organization
    const organization = participation.event.organization;
    let isOrgMember = false;
    
    if (organization?.members) {
      isOrgMember = organization.members.some(
        member => member.userId === session.user.id && (member.role === 'admin' || member.role === 'owner')
      );
    }

    const isOrganizer = participation.event.organizerId === session.user.id;

    if (!isOrgMember && !isOrganizer) {
      return NextResponse.json({ 
        error: 'Forbidden',
        details: 'You must be an organization admin/owner or the event organizer to approve participations'
      }, { status: 403 });
    }

    // Only approve if status is PENDING
    if (participation.status !== 'PENDING') {
      return NextResponse.json(
        { 
          error: `Cannot approve participation with status ${participation.status}`,
          details: 'Only PENDING registrations can be approved.'
        },
        { status: 400 }
      );
    }

    // Update participation status to CONFIRMED
    await prisma.participation.update({
      where: { id: participationId },
      data: {
        status: 'CONFIRMED',
        verifiedAt: new Date()
      }
    });

    // Update event current participants count (count both CONFIRMED and VERIFIED as actual participants)
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

    return NextResponse.json({ success: true, message: 'Registration approved' });
  } catch (error) {
    console.error('Error approving participation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error instanceof Error ? error.toString() : String(error)
    });
    
    // Ensure we always return a valid JSON response
    try {
      return NextResponse.json({ 
        error: 'Internal server error', 
        details: errorMessage 
      }, { status: 500 });
    } catch (responseError) {
      // If even creating the response fails, log it
      console.error('Failed to create error response:', responseError);
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error', details: errorMessage }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

