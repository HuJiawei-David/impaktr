// home/ubuntu/impaktrweb/src/app/api/organization/events/[id]/duplicate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EventStatus } from '@prisma/client';

const duplicateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  location: z.object({
    address: z.string().optional(),
    city: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    isVirtual: z.boolean().default(false),
  }).optional(),
  includeparticipants: z.boolean().default(false),
  keepStatus: z.boolean().default(false),
  adjustDates: z.object({
    shiftDays: z.number().optional(),
    newStartDate: z.string().transform((str) => new Date(str)).optional(),
  }).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = duplicateEventSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the original event
    const originalEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        participations: {
          include: {
            user: {
              include: {
                profile: true,
              }
            }
          }
        },
        organization: true,
      }
    });

    if (!originalEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user has permission to duplicate this event
    const hasPermission = user.memberships.some(
      membership => 
        membership.organizationId === originalEvent.organizationId &&
        (membership.role === 'admin' || membership.role === 'owner')
    ) || originalEvent.creatorId === user.id;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to duplicate this event' },
        { status: 403 }
      );
    }

    // Calculate new dates
    let newStartDate = originalEvent.startDate;
    let newEndDate = originalEvent.endDate;

    if (validatedData.adjustDates?.newStartDate) {
      newStartDate = validatedData.adjustDates.newStartDate;
      if (originalEvent.endDate && newStartDate) {
        const originalDuration = originalEvent.endDate.getTime() - originalEvent.startDate.getTime();
        newEndDate = new Date(newStartDate.getTime() + originalDuration);
      }
    } else if (validatedData.adjustDates?.shiftDays) {
      const shiftMs = validatedData.adjustDates.shiftDays * 24 * 60 * 60 * 1000;
      newStartDate = new Date(originalEvent.startDate.getTime() + shiftMs);
      if (originalEvent.endDate) {
        newEndDate = new Date(originalEvent.endDate.getTime() + shiftMs);
      }
    }

    // Override with provided dates
    if (validatedData.startDate) {
      newStartDate = validatedData.startDate;
    }
    if (validatedData.endDate) {
      newEndDate = validatedData.endDate;
    }

    // Create the duplicate event
    const duplicatedEvent = await prisma.event.create({
      data: {
        title: validatedData.title || `${originalEvent.title} (Copy)`,
        description: originalEvent.description,
        startDate: newStartDate,
        endDate: newEndDate,
        location: (validatedData.location || originalEvent.location) as any,
        maxParticipants: originalEvent.maxParticipants,
        currentParticipants: 0, // Reset participant count
        sdgTags: originalEvent.sdgTags,
        skills: originalEvent.skills,
        intensity: originalEvent.intensity,
        verificationType: originalEvent.verificationType,
        images: originalEvent.images,
        creatorId: user.id,
        organizationId: originalEvent.organizationId,
        status: validatedData.keepStatus ? originalEvent.status : EventStatus.DRAFT,
      },
      include: {
        creator: {
          include: {
            profile: true,
          },
        },
        organization: true,
      },
    });

    // Optionally duplicate participants
    if (validatedData.includeparticipants && originalEvent.participations.length > 0) {
      const participationsToCreate = originalEvent.participations.map(participation => ({
        userId: participation.userId,
        eventId: duplicatedEvent.id,
        hoursCommitted: participation.hoursCommitted,
        status: 'PENDING' as const, // Reset status to pending
        notes: participation.notes,
        skillMultiplier: participation.skillMultiplier,
      }));

      await prisma.participation.createMany({
        data: participationsToCreate,
        skipDuplicates: true,
      });

      // Update current participants count
      await prisma.event.update({
        where: { id: duplicatedEvent.id },
        data: {
          currentParticipants: participationsToCreate.length,
        }
      });
    }

    // Log the duplication activity
    await prisma.scoreHistory.create({
      data: {
        userId: user.id,
        oldScore: 0,
        newScore: 0,
        change: 0,
        reason: 'event_duplicated',
        hoursComponent: 0,
        intensityComponent: 0,
        skillComponent: 0,
        qualityComponent: 0,
        verificationComponent: 0,
        locationComponent: 0,
        eventId: duplicatedEvent.id,
      }
    });

    // Return the duplicated event with additional metadata
    const response = {
      event: duplicatedEvent,
      duplicatedFrom: {
        id: originalEvent.id,
        title: originalEvent.title,
      },
      duplicatedParticipants: validatedData.includeparticipants ? originalEvent.participations.length : 0,
      dateAdjustments: {
        originalStartDate: originalEvent.startDate,
        newStartDate: duplicatedEvent.startDate,
        daysShifted: validatedData.adjustDates?.shiftDays || 0,
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error duplicating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}