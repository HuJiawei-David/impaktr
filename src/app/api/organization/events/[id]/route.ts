import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    const event = await prisma.event.findFirst({
      where: {
        id,
        organizationId: { in: organizationIds }
      },
      include: {
        participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                impactScore: true,
                tier: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Calculate event statistics
    const totalParticipants = event.participations.length;
    const verifiedParticipants = event.participations.filter(p => p.status === 'VERIFIED').length;
    const pendingParticipants = event.participations.filter(p => p.status === 'PENDING').length;
    const totalHours = event.participations.reduce((sum, p) => sum + (p.hours || 0), 0);
    const completionRate = totalParticipants > 0 ? (verifiedParticipants / totalParticipants) * 100 : 0;

    const stats = {
      totalParticipants,
      verifiedParticipants,
      pendingParticipants,
      totalHours,
      averageRating: 4.2, // Mock for now
      completionRate
    };

    // Type assertion for fields added via SQL
    const eventWithExtras = event as typeof event & {
      skills?: string[];
      intensity?: number;
      verificationType?: string;
      eventInstructions?: string;
      materialsNeeded?: string[];
      emergencyContact?: Record<string, unknown>;
      requiresApproval?: boolean;
      autoIssueCertificates?: boolean;
    };
    
    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString(),
        location: event.location,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        status: event.status,
        sdg: event.sdg,
        type: event.type,
        isPublic: event.isPublic,
        createdAt: event.createdAt.toISOString(),
        imageUrl: event.imageUrl,
        skills: eventWithExtras.skills || [],
        intensity: eventWithExtras.intensity || 1.0,
        verificationType: eventWithExtras.verificationType || 'ORGANIZER',
        eventInstructions: eventWithExtras.eventInstructions,
        materialsNeeded: eventWithExtras.materialsNeeded || [],
        emergencyContact: eventWithExtras.emergencyContact,
        requiresApproval: eventWithExtras.requiresApproval || false,
        autoIssueCertificates: eventWithExtras.autoIssueCertificates !== false,
        participations: event.participations.map(p => ({
          id: p.id,
          userId: p.userId,
          status: p.status,
          joinedAt: p.joinedAt.toISOString(),
          verifiedAt: p.verifiedAt?.toISOString(),
          hours: p.hours,
          feedback: p.feedback,
          user: p.user
        }))
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching event details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const event = await prisma.event.findFirst({
      where: {
        id,
        organizationId: { in: organizationIds }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete the event (cascade will handle participations)
    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
