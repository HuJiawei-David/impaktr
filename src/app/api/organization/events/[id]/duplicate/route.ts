import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find organizations where user is admin or owner (same as events list API)
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs that user has admin access to
    const organizationIds = adminMemberships.map(m => m.organization.id);

    const originalEvent = await prisma.event.findFirst({
      where: {
        id,
        organizationId: { in: organizationIds }
      }
    });

    if (!originalEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Create a duplicate event
    const duplicatedEvent = await prisma.event.create({
      data: {
        title: `${originalEvent.title} (Copy)`,
        description: originalEvent.description,
        startDate: originalEvent.startDate,
        endDate: originalEvent.endDate,
        location: originalEvent.location,
        maxParticipants: originalEvent.maxParticipants,
        currentParticipants: 0, // Reset participants for new event
        status: 'DRAFT', // Start as draft
        sdg: originalEvent.sdg,
        type: originalEvent.type,
        isPublic: originalEvent.isPublic,
        imageUrl: originalEvent.imageUrl,
        organizerId: originalEvent.organizationId,
        organizationId: originalEvent.organizationId,
        skills: originalEvent.skills || [],
        intensity: originalEvent.intensity || 1.0,
        verificationType: originalEvent.verificationType || 'ORGANIZER',
        eventInstructions: originalEvent.eventInstructions,
        materialsNeeded: originalEvent.materialsNeeded || [],
        emergencyContact: originalEvent.emergencyContact,
        requiresApproval: originalEvent.requiresApproval || false,
        autoIssueCertificates: originalEvent.autoIssueCertificates !== false
      }
    });

    return NextResponse.json({
      eventId: duplicatedEvent.id,
      success: true
    });

  } catch (error) {
    console.error('Error duplicating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}