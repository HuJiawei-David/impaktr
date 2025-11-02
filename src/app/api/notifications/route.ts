// home/ubuntu/impaktrweb/src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// Type imports - use Prisma types directly from generated client
type UserBadge = {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date | null;
  badge: {
    id: string;
    name: string;
    category: string;
    rarity: string;
  };
};

type Participation = {
  id: string;
  verifiedAt: Date | null;
  hours: number | null;
  eventId: string;
  event: {
    id: string;
    title: string;
  };
};

type Achievement = {
  id: string;
  type: string;
  title: string | null;
  points: number | null;
  verifiedAt: Date | null;
  createdAt: Date;
};

// Extended types for user relations
type UserBadgeWithBadge = UserBadge;

type ParticipationWithEvent = Participation;

type UserWithRelations = {
  id: string;
  badges?: UserBadgeWithBadge[];
  participations?: ParticipationWithEvent[];
  achievements?: Achievement[];
};

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
      where: { id: session.user.id },
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
    const isAdmin = await checkAdminPrivileges(session.user.id);
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
      where: { id: session.user.id },
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
        orderBy: { createdAt: 'desc' }, // earnedAt field doesn't exist, using createdAt instead
        take: 5
      }
    }
  });

  if (!user) return [];

  // Generate badge notifications
  (user as UserWithRelations).badges?.forEach((userBadge: UserBadgeWithBadge, index: number) => {
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
          category: userBadge.badge.category,
          rarity: userBadge.badge.rarity
        }
      });
    }
  });

  // Generate verification notifications
  (user as UserWithRelations).participations?.forEach((participation: ParticipationWithEvent, index: number) => {
    if (participation.verifiedAt && notifications.length < limit) {
      notifications.push({
        id: `participation_${participation.id}`,
        type: 'verification_needed',
        title: 'Hours Verified!',
        message: `Your ${participation.hours || 0} hours for "${participation.event.title}" have been verified`,
        read: index > 2,
        createdAt: participation.verifiedAt.toISOString(),
        actionUrl: `/events/${participation.eventId}`,
        data: {
          eventId: participation.eventId,
          hours: participation.hours || 0
        }
      });
    }
  });

  // Generate achievement notifications
  (user as UserWithRelations).achievements?.forEach((achievement: Achievement, index: number) => {
    if (notifications.length < limit) {
      notifications.push({
        id: `achievement_${achievement.id}`,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: achievement.title || 'Achievement unlocked',
        read: index > 1,
        createdAt: achievement.verifiedAt?.toISOString() || achievement.createdAt.toISOString(),
        actionUrl: '/profile?tab=achievements',
        data: {
          achievementType: achievement.type,
          points: achievement.points || 0
        }
      });
    }
  });

  // Generate connection request notifications
  try {
    const pendingConnections = await prisma.connection.findMany({
      where: {
        addresseeId: userId,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    pendingConnections.forEach((connection: { id: string; createdAt: Date; requester: { id: string; name: string | null; image: string | null } }) => {
      if (notifications.length < limit) {
        notifications.push({
          id: `connection_request_${connection.id}`,
          type: 'event_joined', // Using this type since we don't have connection_request in the enum yet
          title: 'New Connection Request',
          message: `${connection.requester.name || 'Someone'} wants to connect with you`,
          read: false,
          createdAt: connection.createdAt.toISOString(),
          actionUrl: `/profile/${connection.requester.id}`,
          data: {
            connectionId: connection.id,
            requesterId: connection.requester.id,
            requesterName: connection.requester.name,
            requesterImage: connection.requester.image
          }
        });
      }
    });
  } catch (error) {
    console.error('Error fetching connection requests for notifications:', error);
  }

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

async function checkAdminPrivileges(userId: string): Promise<boolean> {
  // In production, check if user has admin role
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId: userId,
      role: { in: ['admin', 'owner'] }
    }
  });

  // Check if user has admin privileges in any organization
  return memberships.length > 0;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}