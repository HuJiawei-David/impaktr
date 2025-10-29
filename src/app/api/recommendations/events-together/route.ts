import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId1 = searchParams.get('userId1');
    const userId2 = searchParams.get('userId2');

    if (!userId1 || !userId2) {
      return NextResponse.json({ error: 'Both userId1 and userId2 are required' }, { status: 400 });
    }

    // Find events where both users participated
    const eventsTogether = await prisma.participation.findMany({
      where: {
        AND: [
          {
            OR: [
              { userId: userId1 },
              { userId: userId2 }
            ]
          }
        ]
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organizationId: true
          }
        },
        user: {
          select: {
            id: true
          }
        }
      }
    });

    // Group by event and count participants
    const eventGroups = eventsTogether.reduce((acc, participation) => {
      const eventId = participation.event.id;
      if (!acc[eventId]) {
        acc[eventId] = {
          event: participation.event,
          participants: new Set()
        };
      }
      acc[eventId].participants.add(participation.user.id);
      return acc;
    }, {} as Record<string, { event: any; participants: Set<string> }>);

    // Count events where both users participated
    const eventsTogetherCount = Object.values(eventGroups).filter(
      group => group.participants.has(userId1) && group.participants.has(userId2)
    ).length;

    return NextResponse.json({ 
      eventsTogether: eventsTogetherCount,
      totalEvents: Object.keys(eventGroups).length
    });

  } catch (error) {
    console.error('Error calculating events together:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
