import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';

// GET - Fetch user's favorite events
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const favoriteEvents = await prisma.userFavoriteEvent.findMany({
      where: {
        userId: session.user.id,
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: favoriteEvents,
    });
  } catch (error) {
    console.error('Error fetching favorite events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorite events' },
      { status: 500 }
    );
  }
}

// POST - Add events to favorites
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { events, organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Events array is required' },
        { status: 400 }
      );
    }

    // Use transaction to add all events
    const results = await prisma.$transaction(
      events.map((event: any) =>
        prisma.userFavoriteEvent.upsert({
          where: {
            userId_organizationId_templateId: {
              userId: session.user.id,
              organizationId,
              templateId: event.templateId,
            },
          },
          update: {
            eventName: event.name,
            participants: event.participants,
            durationHours: event.durationHours,
            sdgs: event.sdgs,
            predictedDelta: event.predictedDelta,
            notes: event.notes || null,
            updatedAt: new Date(),
          },
          create: {
            userId: session.user.id,
            organizationId,
            templateId: event.templateId,
            eventName: event.name,
            participants: event.participants,
            durationHours: event.durationHours,
            sdgs: event.sdgs,
            predictedDelta: event.predictedDelta,
            notes: event.notes || null,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        count: results.length,
        events: results,
      },
    });
  } catch (error) {
    console.error('Error adding favorite events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add favorite events' },
      { status: 500 }
    );
  }
}

// DELETE - Remove event from favorites
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const favoriteEventId = searchParams.get('id');

    if (!favoriteEventId) {
      return NextResponse.json(
        { success: false, error: 'Favorite event ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const favoriteEvent = await prisma.userFavoriteEvent.findUnique({
      where: { id: favoriteEventId },
    });

    if (!favoriteEvent) {
      return NextResponse.json(
        { success: false, error: 'Favorite event not found' },
        { status: 404 }
      );
    }

    if (favoriteEvent.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this favorite event' },
        { status: 403 }
      );
    }

    await prisma.userFavoriteEvent.delete({
      where: { id: favoriteEventId },
    });

    return NextResponse.json({
      success: true,
      message: 'Favorite event removed successfully',
    });
  } catch (error) {
    console.error('Error deleting favorite event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete favorite event' },
      { status: 500 }
    );
  }
}

