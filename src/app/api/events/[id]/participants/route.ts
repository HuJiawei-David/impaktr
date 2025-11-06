import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id: eventId } = await params;

    // Fetch the event to check if the current user is the creator and get event info
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
        organizationId: true,
        endDate: true,
        status: true
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is organizer or organization admin
    let isOrganizer = false;
    if (session?.user?.id && event.organizationId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: event.organizationId,
            userId: session.user.id
          }
        }
      });
      isOrganizer = membership?.role === 'admin' || membership?.role === 'owner';
    }

    // Fetch participants
    const participations = await prisma.participation.findMany({
      where: {
        eventId,
        // If not organizer, only show CONFIRMED and VERIFIED participants (actual participants)
        // If organizer, show all statuses for management
        ...((!isOrganizer && { 
          status: { 
            in: ['CONFIRMED', 'VERIFIED'] 
          } 
        }) || {})
      },
      include: {
        user: {
          include: {
            volunteerProfile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected format
    const participants = participations.map(p => {
      // Parse registration info from feedback field
      let registrationInfo: {
        motivation?: string;
        skills?: string;
        notes?: string;
        hoursCommitted?: number;
        emergencyContact?: {
          name?: string;
          phone?: string;
          relationship?: string;
        };
      } | null = null;
      
      if (p.feedback) {
        try {
          // Try to parse as JSON first (new format)
          registrationInfo = JSON.parse(p.feedback);
        } catch {
          // Fallback to old format: "notes | motivation | skills"
          const parts = p.feedback.split(' | ');
          if (parts.length >= 1) registrationInfo = { notes: parts[0] || undefined };
          if (parts.length >= 2) registrationInfo = { ...registrationInfo, motivation: parts[1] };
          if (parts.length >= 3) registrationInfo = { ...registrationInfo, skills: parts[2] };
        }
      }

      return {
        id: p.id,
        userId: p.user.id,
        user: {
          id: p.user.id,
          name: p.user.name || '',
          email: p.user.email || '',
          image: p.user.image,
          profile: {
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            bio: p.user.volunteerProfile?.bio,
            skills: p.user.volunteerProfile?.skills || []
          },
          impaktrScore: p.user.impactScore || 0,
          currentRank: p.user.tier || 'HELPER'
        },
        hoursCommitted: p.hours || 0,
        hoursActual: p.status === 'VERIFIED' ? p.hours : null,
        status: p.status,
        notes: p.feedback,
        registrationInfo, // Add parsed registration info
        proofImages: [],
        qualityRating: undefined,
        skillMultiplier: 1.0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        verifiedAt: p.verifiedAt?.toISOString(),
        verifications: []
      };
    });

    return NextResponse.json({
      participants,
      total: participants.length,
      event: {
        endDate: event.endDate,
        status: event.status
      }
    });
  } catch (error) {
    console.error('Error fetching event participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

