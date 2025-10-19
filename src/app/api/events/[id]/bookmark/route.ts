import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.eventBookmark.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId: id
        }
      }
    });

    if (existingBookmark) {
      return NextResponse.json({ error: 'Event already bookmarked' }, { status: 400 });
    }

    // Create bookmark
    await prisma.eventBookmark.create({
      data: {
        userId,
        eventId: id
      }
    });

    return NextResponse.json({ 
      message: 'Event bookmarked successfully',
      bookmarked: true 
    });

  } catch (error) {
    console.error('Error bookmarking event:', error);
    return NextResponse.json(
      { error: 'Failed to bookmark event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check if bookmark exists
    const existingBookmark = await prisma.eventBookmark.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId: id
        }
      }
    });

    if (!existingBookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    // Delete bookmark
    await prisma.eventBookmark.delete({
      where: {
        userId_eventId: {
          userId,
          eventId: id
        }
      }
    });

    return NextResponse.json({ 
      message: 'Bookmark removed successfully',
      bookmarked: false 
    });

  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to remove bookmark' },
      { status: 500 }
    );
  }
}
