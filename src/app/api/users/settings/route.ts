import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        displayName: true,
        email: true,
        bio: true,
        website: true,
        isPublic: true,
        showEmail: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Mock notification and privacy settings (not in schema yet)
    const settings = {
      // Profile Settings
      displayName: user.displayName || '',
      email: user.email,
      bio: user.bio || '',
      website: user.website || '',
      isPublic: user.isPublic,
      showEmail: user.showEmail,
      
      // Notification Settings (defaults)
      emailNotifications: true,
      pushNotifications: true,
      badgeNotifications: true,
      eventReminders: true,
      verificationRequests: true,
      weeklyDigest: true,
      marketingEmails: false,
      
      // Privacy Settings (defaults)
      profileVisibility: 'public' as const,
      showProgress: true,
      showLocation: true,
      allowRecommendations: true,
      allowMessaging: true,
      
      // Security Settings (defaults)
      twoFactorEnabled: false,
      loginAlerts: true,
      sessionTimeout: 60,
      
      // Subscription Settings (defaults)
      subscriptionPlan: 'Free Tier',
      billingEmail: user.email,
      autoRenew: false,
      
      // Data Settings (defaults)
      downloadData: false,
      deleteAccount: false,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates = await req.json();

    // Only update fields that exist in the schema
    const allowedFields = ['displayName', 'bio', 'website', 'isPublic', 'showEmail'];
    const dataToUpdate: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in updates) {
        dataToUpdate[field] = updates[field];
      }
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: dataToUpdate,
      });
    }

    // Return updated settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        displayName: true,
        email: true,
        bio: true,
        website: true,
        isPublic: true,
        showEmail: true,
      }
    });

    const settings = {
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: user?.bio || '',
      website: user?.website || '',
      isPublic: user?.isPublic || false,
      showEmail: user?.showEmail || false,
      emailNotifications: updates.emailNotifications ?? true,
      pushNotifications: updates.pushNotifications ?? true,
      badgeNotifications: updates.badgeNotifications ?? true,
      eventReminders: updates.eventReminders ?? true,
      verificationRequests: updates.verificationRequests ?? true,
      weeklyDigest: updates.weeklyDigest ?? true,
      marketingEmails: updates.marketingEmails ?? false,
      profileVisibility: updates.profileVisibility ?? 'public',
      showProgress: updates.showProgress ?? true,
      showLocation: updates.showLocation ?? true,
      allowRecommendations: updates.allowRecommendations ?? true,
      allowMessaging: updates.allowMessaging ?? true,
      twoFactorEnabled: updates.twoFactorEnabled ?? false,
      loginAlerts: updates.loginAlerts ?? true,
      sessionTimeout: updates.sessionTimeout ?? 60,
      subscriptionPlan: 'Free Tier',
      billingEmail: user?.email || '',
      autoRenew: updates.autoRenew ?? false,
      downloadData: false,
      deleteAccount: false,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

