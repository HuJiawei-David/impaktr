import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const updateLocationSchema = createLocationSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const isActive = url.searchParams.get('isActive') === 'true';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user is member of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to view locations' }, { status: 403 });
    }

    let where: any = {
      organizationId,
    };

    if (isActive !== null) {
      where.isActive = isActive;
    }

    const locations = await prisma.organizationLocation.findMany({
      where,
      include: {
        events: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
          }
        },
        _count: {
          select: {
            events: true,
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLocationSchema.parse(body);
    const organizationId = body.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user is admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to create locations' }, { status: 403 });
    }

    // If this is set as primary, unset other primary locations
    if (validatedData.isPrimary) {
      await prisma.organizationLocation.updateMany({
        where: {
          organizationId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
    }

    const location = await prisma.organizationLocation.create({
      data: {
        ...validatedData,
        organizationId,
      },
      include: {
        events: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
          }
        },
        _count: {
          select: {
            events: true,
          }
        }
      }
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const locationId = url.searchParams.get('id');

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateLocationSchema.parse(body);

    // Get location details
    const location = await prisma.organizationLocation.findUnique({
      where: { id: locationId },
      include: {
        organization: true
      }
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Check if user is admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: location.organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to update locations' }, { status: 403 });
    }

    // If this is set as primary, unset other primary locations
    if (validatedData.isPrimary) {
      await prisma.organizationLocation.updateMany({
        where: {
          organizationId: location.organizationId,
          isPrimary: true,
          id: { not: locationId }
        },
        data: {
          isPrimary: false
        }
      });
    }

    const updatedLocation = await prisma.organizationLocation.update({
      where: { id: locationId },
      data: validatedData,
      include: {
        events: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
          }
        },
        _count: {
          select: {
            events: true,
          }
        }
      }
    });

    return NextResponse.json({ location: updatedLocation });
  } catch (error) {
    console.error('Error updating location:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const locationId = url.searchParams.get('id');

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    // Get location details
    const location = await prisma.organizationLocation.findUnique({
      where: { id: locationId },
      include: {
        organization: true,
        events: true
      }
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Check if user is admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: location.organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to delete locations' }, { status: 403 });
    }

    // Check if location has active events
    const activeEvents = location.events.filter(event => 
      event.status === 'ACTIVE' && new Date(event.endDate) > new Date()
    );

    if (activeEvents.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete location with active events',
        activeEvents: activeEvents.length
      }, { status: 400 });
    }

    // Soft delete by setting isActive to false
    await prisma.organizationLocation.update({
      where: { id: locationId },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: 'Location deactivated successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}

