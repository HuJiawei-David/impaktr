import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sendNotificationSchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
  type: z.enum(['EVENT_REMINDER', 'BADGE_EARNED', 'VERIFICATION_REQUEST', 'SUPPORT_RESPONSE', 'REFERRAL_REWARD', 'SYSTEM', 'CUSTOM']),
  data: z.record(z.any()).optional(),
});

const createNotificationTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
  type: z.enum(['EVENT_REMINDER', 'BADGE_EARNED', 'VERIFICATION_REQUEST', 'SUPPORT_RESPONSE', 'REFERRAL_REWARD', 'SYSTEM', 'CUSTOM']),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || session.user.id;
    const type = url.searchParams.get('type');
    const isRead = url.searchParams.get('isRead') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Check if user is admin or viewing their own notifications
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const isAdmin = user?.role === 'ADMIN';
    const isOwnNotifications = userId === session.user.id;

    if (!isAdmin && !isOwnNotifications) {
      return NextResponse.json({ error: 'Unauthorized to view notifications' }, { status: 403 });
    }

    let where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (isRead !== null) {
      where.isRead = isRead;
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notification.count({ where })
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sendNotificationSchema.parse(body);

    // Check if user is admin or sending to their own organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const isAdmin = user?.role === 'ADMIN';

    if (!isAdmin && !validatedData.userId && !validatedData.organizationId) {
      return NextResponse.json({ error: 'Admin access required for broadcast notifications' }, { status: 403 });
    }

    // If sending to organization, get all members
    let targetUserIds: string[] = [];
    
    if (validatedData.userId) {
      targetUserIds = [validatedData.userId];
    } else if (validatedData.organizationId) {
      const members = await prisma.organizationMember.findMany({
        where: {
          organizationId: validatedData.organizationId,
          status: 'active'
        },
        select: { userId: true }
      });
      targetUserIds = members.map(m => m.userId);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 });
    }

    // Create notifications
    const notifications = await Promise.all(
      targetUserIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            type: validatedData.type,
            title: validatedData.title,
            message: validatedData.message,
            data: validatedData.data,
          }
        })
      )
    );

    // Send push notifications (this would integrate with your push notification service)
    // await sendPushNotifications(targetUserIds, validatedData.title, validatedData.message);

    return NextResponse.json({ 
      notifications,
      sentTo: targetUserIds.length 
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending notifications:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');
    const action = url.searchParams.get('action') as 'read' | 'unread';

    if (!notificationId || !action) {
      return NextResponse.json({ error: 'Notification ID and action are required' }, { status: 400 });
    }

    // Get notification details
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Check if user owns the notification
    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to update notification' }, { status: 403 });
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: action === 'read',
      }
    });

    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// Notification Templates Management
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createNotificationTemplateSchema.parse(body);

    const template = await prisma.notificationTemplate.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create notification template' }, { status: 500 });
  }
}
