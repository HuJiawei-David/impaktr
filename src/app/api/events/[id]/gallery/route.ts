import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const images = await prisma.eventImage.findMany({
      where: {
        eventId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const transformedImages = images.map(img => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      category: img.category || 'general',
      uploadedBy: {
        id: img.user.id,
        name: img.user.name || '',
        avatar: img.user.image
      },
      uploadedAt: img.createdAt.toISOString(),
      likes: 0, // Can be extended later
      comments: 0 // Can be extended later
    }));

    return NextResponse.json({
      images: transformedImages,
      total: images.length
    });
  } catch (error) {
    console.error('Error fetching event gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}

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
    const { url, caption, category } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Create image
    const image = await prisma.eventImage.create({
      data: {
        url,
        caption: caption || null,
        category: category || 'general',
        eventId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({
      image: {
        id: image.id,
        url: image.url,
        caption: image.caption,
        category: image.category,
        uploadedBy: {
          id: image.user.id,
          name: image.user.name || '',
          avatar: image.user.image
        },
        uploadedAt: image.createdAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Find image and verify ownership or event creator
    const image = await prisma.eventImage.findUnique({
      where: { id: imageId },
      include: {
        event: {
          select: {
            organizerId: true,
            organizationId: true
          }
        }
      }
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check if user is the uploader or event organizer
    const isOwner = image.userId === session.user.id;
    const isOrganizer = image.event.organizerId === session.user.id;
    
    // Check if user is organization admin
    let isOrgAdmin = false;
    if (image.event.organizationId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: image.event.organizationId,
            userId: session.user.id
          }
        }
      });
      isOrgAdmin = membership?.role === 'admin' || membership?.role === 'owner';
    }

    if (!isOwner && !isOrganizer && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this image' },
        { status: 403 }
      );
    }

    // Delete image
    await prisma.eventImage.delete({
      where: { id: imageId }
    });

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

