import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Generate a random attendance code (6-digit)
function generateAttendanceCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let eventId: string | undefined;
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    eventId = id;
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. "enabled" must be a boolean.' },
        { status: 400 }
      );
    }

    // Get event and check permissions
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is admin/owner or event creator
    const isCreator = event.organizerId === session.user.id;
    const hasOrgPermission = event.organization?.members && event.organization.members.length > 0 && 
      event.organization.members.some(
        (member: { role: string }) => member.role === 'admin' || member.role === 'owner'
      );

    if (!isCreator && !hasOrgPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage attendance' },
        { status: 403 }
      );
    }

    // Update attendance settings
    const now = new Date();
    const eventWithAttendance = event as typeof event & {
      attendanceCode?: string | null;
    };
    let attendanceCode = eventWithAttendance.attendanceCode;
    
    // If enabling and no code exists, generate one
    if (enabled && !attendanceCode) {
      attendanceCode = generateAttendanceCode();
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        attendanceEnabled: enabled,
        attendanceCode: enabled ? attendanceCode : eventWithAttendance.attendanceCode, // Keep code when disabling
        attendanceEnabledAt: enabled ? now : (event as any).attendanceEnabledAt,
        attendanceDisabledAt: enabled ? null : now,
      },
      select: {
        id: true,
        attendanceEnabled: true,
        attendanceEnabledAt: true,
        attendanceDisabledAt: true,
        attendanceCode: true, // Only return to admin
      } as any
    });

    return NextResponse.json({ 
      event: updatedEvent,
      message: enabled 
        ? `Attendance enabled. Code: ${updatedEvent.attendanceCode || attendanceCode}` 
        : 'Attendance disabled'
    });
  } catch (error) {
    console.error('Error toggling attendance:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      eventId: eventId || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

