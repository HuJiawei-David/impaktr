import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const broadcastMessageSchema = z.object({
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  type: z.enum(['ANNOUNCEMENT', 'REMINDER', 'UPDATE', 'CANCELLATION']).default('ANNOUNCEMENT'),
  sendEmail: z.boolean().default(true),
  sendNotification: z.boolean().default(true),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const validatedData = broadcastMessageSchema.parse(body);

    // Check if user is admin of the organization that owns this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: { in: ['admin', 'owner'] },
                status: 'active'
              }
            }
          }
        },
        participations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.organization || event.organization.members.length === 0) {
      return NextResponse.json({ error: 'Unauthorized to broadcast to this event' }, { status: 403 });
    }

    // Create broadcast record
    const broadcast = await prisma.broadcast.create({
      data: {
        eventId,
        senderId: session.user.id,
        subject: validatedData.subject,
        content: validatedData.content,
        type: validatedData.type,
        sentAt: new Date(),
      }
    });

    // Send notifications to participants
    if (validatedData.sendNotification) {
      await prisma.notification.createMany({
        data: event.participations.map(participation => ({
          userId: participation.userId,
          type: 'EVENT_REMINDER',
          title: validatedData.subject,
          message: validatedData.content,
          data: {
            eventId,
            broadcastId: broadcast.id,
            type: validatedData.type,
          }
        }))
      });
    }

    // Send emails to participants (if enabled)
    if (validatedData.sendEmail) {
      // TODO: Implement email sending using your email service
      // For now, we'll just log the emails that would be sent
      console.log('Would send emails to:', event.participations.map(p => p.user.email));
    }

    return NextResponse.json({ 
      broadcast,
      participantsNotified: event.participations.length,
      success: true 
    });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    return NextResponse.json({ error: 'Failed to broadcast message' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Check if user is admin of the organization that owns this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: { in: ['admin', 'owner'] },
                status: 'active'
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.organization || event.organization.members.length === 0) {
      return NextResponse.json({ error: 'Unauthorized to view broadcasts for this event' }, { status: 403 });
    }

    // Get broadcast history
    const broadcasts = await prisma.broadcast.findMany({
      where: { eventId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    return NextResponse.json({ broadcasts });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
  }
}
