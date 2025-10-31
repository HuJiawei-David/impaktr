import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const markAttendanceSchema = z.object({
  code: z.string().min(1, 'Attendance code is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { code } = markAttendanceSchema.parse(body);

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if attendance is enabled
    if (!event.attendanceEnabled) {
      return NextResponse.json(
        { error: 'Attendance tracking is not enabled for this event' },
        { status: 400 }
      );
    }

    // Check if code matches
    if (event.attendanceCode !== code) {
      return NextResponse.json(
        { error: 'Invalid attendance code' },
        { status: 400 }
      );
    }

    // Check time conditions
    const now = new Date();
    const startDate = new Date(event.startDate);

    // 1. Check if event has started
    if (now < startDate) {
      return NextResponse.json(
        { error: 'Event has not started yet. Attendance can only be marked after the event starts.' },
        { status: 400 }
      );
    }

    // 2. Check if attendance is within enabled time range
    if (event.attendanceEnabledAt) {
      const enabledAt = new Date(event.attendanceEnabledAt);
      if (now < enabledAt) {
        return NextResponse.json(
          { error: 'Attendance tracking is not active yet' },
          { status: 400 }
        );
      }
    }

    if (event.attendanceDisabledAt) {
      const disabledAt = new Date(event.attendanceDisabledAt);
      if (now > disabledAt) {
        return NextResponse.json(
          { error: 'Attendance tracking has been disabled' },
          { status: 400 }
        );
      }
    }

    // Check if user has a participation
    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 400 }
      );
    }

    // Check if already marked attendance
    if (participation.status === 'ATTENDED' || participation.status === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Attendance has already been marked' },
        { status: 400 }
      );
    }

    // Update participation status to ATTENDED
    const updatedParticipation = await prisma.participation.update({
      where: { id: participation.id },
      data: {
        status: 'ATTENDED',
        verifiedAt: now,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      participation: updatedParticipation,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

