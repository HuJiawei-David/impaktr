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
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
        details: 'You must be an organization admin/owner or the event organizer to reject participations'
      }, { status: 403 });
    }

    // Only reject if status is PENDING or REGISTERED
    if (participation.status !== 'PENDING' && participation.status !== 'REGISTERED') {
      return NextResponse.json(
        { 
          error: `Cannot reject participation with status ${participation.status}`,
          details: 'Only PENDING or REGISTERED registrations can be rejected.'
        },
        { status: 400 }
      );
    }

    console.log('Attempting to update participation to REJECTED:', { participationId, currentStatus: participation.status });

    // Update participation status to REJECTED
    try {
      await prisma.participation.update({
        where: { id: participationId },
        data: {
          status: 'REJECTED'
        }
      });

      console.log('Successfully updated participation to REJECTED');

      // Create notification for the user who applied
      try {
        const eventTitle = participation.event.title;
        const organizationName = participation.event.organization?.name || 'the organization';
        
        await prisma.notification.create({
          data: {
            userId: participation.userId,
            type: 'APPLICATION_UPDATE',
            title: 'Registration Rejected',
            message: `Your registration for "${eventTitle}" has been rejected by ${organizationName} administrator.`,
            data: {
              eventId: eventId,
              participationId: participationId,
              status: 'REJECTED',
              eventTitle: eventTitle,
              organizationName: organizationName
            }
          }
        });
        console.log('Notification created for rejected participation');
      } catch (notificationError) {
        // Log notification error but don't fail the request
        console.error('Failed to create rejection notification:', notificationError);
      }

      return NextResponse.json({ success: true, message: 'Registration rejected' });
    } catch (updateError) {
      console.error('Database update error:', updateError);
      
      // Check if it's a Prisma validation error (enum value issue)
      const errorString = updateError instanceof Error ? updateError.message : String(updateError);
      
      if (errorString.includes('enum') || errorString.includes('Invalid value') || errorString.includes('REJECTED')) {
        console.error('Database enum error detected - migration may be required');
        return NextResponse.json({ 
          error: 'Database configuration error',
          details: 'The REJECTED status value is not available in the database. Please ensure the database migration has been applied. Run: npx prisma migrate deploy'
        }, { status: 500 });
      }
      
      // Re-throw to be caught by outer catch block
      throw updateError;
    }
  } catch (error) {
    console.error('Error rejecting participation:', error);
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

