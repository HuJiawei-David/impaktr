// home/ubuntu/impaktrweb/src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(['badge_earned', 'event_reminder', 'verification_needed', 'rank_up', 'event_joined', 'achievement', 'certificate_issued']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
  actionUrl: z.string().optional(),
  data: z.object({}).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Since we don't have a notifications table in the current schema,
    // I'll create a mock structure. In production, you'd want to add this to your schema.
    
    // For now, let's create notifications based on user activity
    const notifications = await generateNotificationsForUser(user.id, unreadOnly, limit, offset);

    // Get unread count
    const unreadCount = await getUnreadNotificationsCount(user.id);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges (implement based on your admin system)
    const isAdmin = await checkAdminPrivileges(session.user.sub);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    // In a real implementation, you'd save to a notifications table
    // For now, we'll create a mock notification
    const notification = {
      id: generateId(),
      ...validatedData,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Here you would typically:
    // 1. Save to database
    // 2. Send push notification
    // 3. Send email if user preferences allow
    // 4. Emit socket event for real-time updates

    return NextResponse.json({ notification }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, notificationIds } = body;

    if (action === 'mark_all_read') {
      // Mark all notifications as read for the user
      await markAllNotificationsAsRead(user.id);
      
      return NextResponse.json({ 
        message: 'All notifications marked as read',
        updatedCount: notificationIds?.length || 0
      });
    }

    if (action === 'mark_read' && notificationIds?.length) {
      // Mark specific notifications as read
      await markNotificationsAsRead(user.id, notificationIds);
      
      return NextResponse.json({ 
        message: 'Notifications marked as read',
        updatedCount: notificationIds.length
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions (these would be moved to a separate service file)

async function generateNotificationsForUser(userId: string, unreadOnly: boolean, limit: number, offset: number) {
  // This is a mock implementation. In production, you'd query a notifications table
  const notifications = [];

  // Get recent user activities to generate notifications
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: {
        where: { earnedAt: { not: null } },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
        take: 5
      },
      participations: {
        where: { status: 'VERIFIED' },
        include: { event: true },
        orderBy: { verifiedAt: 'desc' },
        take: 5
      },
      achievements: {
        orderBy: { earnedAt: 'desc' },
        take: 5
      }
    }
  });

  if (!user) return [];

  // Generate badge notifications
  user.badges.forEach((userBadge, index) => {
    if (userBadge.earnedAt && notifications.length < limit) {
      notifications.push({
        id: `badge_${userBadge.id}`,
        type: 'badge_earned',
        title: 'New Badge Earned!',
        message: `You earned the ${userBadge.badge.name} badge`,
        read: index > 1, // Mock read status
        createdAt: userBadge.earnedAt.toISOString(),
        actionUrl: '/profile?tab=badges',
        data: {
          badgeId: userBadge.badgeId,
          sdgNumber: userBadge.badge.sdgNumber,
          tier: userBadge.badge.tier
        }
      });
    }
  });

  // Generate verification notifications
  user.participations.forEach((participation, index) => {
    if (participation.verifiedAt && notifications.length < limit) {
      notifications.push({
        id: `participation_${participation.id}`,
        type: 'verification_needed',
        title: 'Hours Verified!',
        message: `Your ${participation.hoursActual || participation.hoursCommitted} hours for "${participation.event.title}" have been verified`,
        read: index > 2,
        createdAt: participation.verifiedAt.toISOString(),
        actionUrl: `/events/${participation.eventId}`,
        data: {
          eventId: participation.eventId,
          hours: participation.hoursActual || participation.hoursCommitted
        }
      });
    }
  });

  // Generate achievement notifications
  user.achievements.forEach((achievement, index) => {
    if (notifications.length < limit) {
      notifications.push({
        id: `achievement_${achievement.id}`,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: achievement.name,
        read: index > 1,
        createdAt: achievement.earnedAt.toISOString(),
        actionUrl: '/profile?tab=achievements',
        data: {
          achievementType: achievement.type,
          achievementData: achievement.data
        }
      });
    }
  });

  // Add some system notifications
  if (notifications.length < limit) {
    const systemNotifications = [
      {
        id: 'welcome_1',
        type: 'event_reminder' as const,
        title: 'Welcome to Impaktr!',
        message: 'Complete your profile to get personalized event recommendations',
        read: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        actionUrl: '/profile/edit',
        data: {}
      },
      {
        id: 'tip_1',
        type: 'event_reminder' as const,
        title: 'Pro Tip',
        message: 'Join events that match your SDG interests to earn badges faster!',
        read: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        actionUrl: '/events',
        data: {}
      }
    ];

    notifications.push(...systemNotifications);
  }

  // Sort by date (newest first)
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter by unread if requested
  const filteredNotifications = unreadOnly 
    ? notifications.filter(n => !n.read)
    : notifications;

  // Apply pagination
  return filteredNotifications.slice(offset, offset + limit);
}

async function getUnreadNotificationsCount(userId: string): Promise<number> {
  // Mock implementation - in production, this would query a notifications table
  const notifications = await generateNotificationsForUser(userId, true, 100, 0);
  return notifications.filter(n => !n.read).length;
}

async function markAllNotificationsAsRead(userId: string): Promise<void> {
  // In production, this would update a notifications table
  // For now, we'll just log the action
  console.log(`Marking all notifications as read for user: ${userId}`);
}

async function markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
  // In production, this would update specific notifications in the database
  console.log(`Marking notifications as read for user ${userId}:`, notificationIds);
}

async function checkAdminPrivileges(auth0Id: string): Promise<boolean> {
  // In production, check if user has admin role
  const user = await prisma.user.findUnique({
    where: { auth0Id },
  });

  // For now, return false. You'd implement proper admin checking here
  // This might check against a roles table, Auth0 roles, or specific user flags
  return false;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}