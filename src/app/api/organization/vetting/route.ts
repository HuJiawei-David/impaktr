import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const vettingRequestSchema = z.object({
  volunteerId: z.string(),
  organizationId: z.string(),
  vettingType: z.enum(['BACKGROUND_CHECK', 'REFERENCE_CHECK', 'SKILL_ASSESSMENT', 'INTERVIEW']),
  requirements: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
});

const vettingResponseSchema = z.object({
  vettingId: z.string(),
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
  notes: z.string().max(1000).optional(),
  documents: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const volunteerId = url.searchParams.get('volunteerId');
    const status = url.searchParams.get('status') as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | null;

    let where: any = {};

    if (organizationId) {
      // Check if user is member of the organization
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: session.user.id,
          organizationId,
          status: 'active'
        }
      });

      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized to view vetting requests' }, { status: 403 });
      }

      where.organizationId = organizationId;
    }

    if (volunteerId) {
      where.volunteerId = volunteerId;
    }

    if (status) {
      where.status = status;
    }

    const vettingRequests = await prisma.vettingRequest.findMany({
      where,
      include: {
        volunteer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            tier: true,
            volunteerProfile: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            type: true,
          }
        },
        responses: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ vettingRequests });
  } catch (error) {
    console.error('Error fetching vetting requests:', error);
    return NextResponse.json({ error: 'Failed to fetch vetting requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = vettingRequestSchema.parse(body);

    // Check if user is admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to create vetting requests' }, { status: 403 });
    }

    // Verify volunteer exists
    const volunteer = await prisma.user.findUnique({
      where: { id: validatedData.volunteerId }
    });

    if (!volunteer) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    // Check if there's already a pending vetting request for this volunteer
    const existingRequest = await prisma.vettingRequest.findFirst({
      where: {
        volunteerId: validatedData.volunteerId,
        organizationId: validatedData.organizationId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Vetting request already exists for this volunteer' }, { status: 400 });
    }

    // Create vetting request
    const vettingRequest = await prisma.vettingRequest.create({
      data: {
        ...validatedData,
        requestedBy: session.user.id,
        status: 'PENDING',
      },
      include: {
        volunteer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            tier: true,
            volunteerProfile: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            type: true,
          }
        }
      }
    });

    // Create notification for volunteer
    await prisma.notification.create({
      data: {
        userId: validatedData.volunteerId,
        type: 'VETTING_REQUEST',
        title: 'Vetting Request',
        message: `An organization has requested to vet you for volunteer opportunities.`,
        data: {
          vettingRequestId: vettingRequest.id,
          organizationId: validatedData.organizationId,
          vettingType: validatedData.vettingType,
        }
      }
    });

    return NextResponse.json({ vettingRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating vetting request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create vetting request' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const vettingId = url.searchParams.get('id');

    if (!vettingId) {
      return NextResponse.json({ error: 'Vetting ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = vettingResponseSchema.parse(body);

    // Get vetting request details
    const vettingRequest = await prisma.vettingRequest.findUnique({
      where: { id: vettingId },
      include: {
        organization: true
      }
    });

    if (!vettingRequest) {
      return NextResponse.json({ error: 'Vetting request not found' }, { status: 404 });
    }

    // Check if user is admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: vettingRequest.organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to respond to vetting requests' }, { status: 403 });
    }

    // Create vetting response
    const vettingResponse = await prisma.vettingResponse.create({
      data: {
        ...validatedData,
        vettingRequestId: vettingId,
        reviewerId: session.user.id,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    // Update vetting request status
    const updatedVettingRequest = await prisma.vettingRequest.update({
      where: { id: vettingId },
      data: { 
        status: validatedData.status === 'APPROVED' ? 'COMPLETED' : 
               validatedData.status === 'REJECTED' ? 'REJECTED' : 'IN_PROGRESS'
      },
      include: {
        volunteer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            tier: true,
            volunteerProfile: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            type: true,
          }
        },
        responses: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // Create notification for volunteer
    await prisma.notification.create({
      data: {
        userId: vettingRequest.volunteerId,
        type: 'VETTING_RESPONSE',
        title: 'Vetting Response',
        message: `An organization has ${validatedData.status.toLowerCase()} your vetting request.`,
        data: {
          vettingRequestId: vettingId,
          organizationId: vettingRequest.organizationId,
          status: validatedData.status,
        }
      }
    });

    return NextResponse.json({ 
      vettingRequest: updatedVettingRequest,
      response: vettingResponse 
    });
  } catch (error) {
    console.error('Error responding to vetting request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to respond to vetting request' }, { status: 500 });
  }
}
