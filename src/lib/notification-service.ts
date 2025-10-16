// home/ubuntu/impaktrweb/src/lib/notification-service.ts

import { prisma } from './prisma';
import { emailTemplates, EmailTemplateType, EmailTemplateData } from './email-template';
import nodemailer from 'nodemailer';
import AWS from 'aws-sdk';

// Configure AWS SES
const ses = new AWS.SES({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// Configure Nodemailer with SES
const transporter = nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.AWS_SES_SMTP_USERNAME,
    pass: process.env.AWS_SES_SMTP_PASSWORD,
  },
});

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  badges: boolean;
  events: boolean;
  verifications: boolean;
  monthlyReports: boolean;
  eventReminders: boolean;
  certificateIssued: boolean;
}

export interface InAppNotification {
  id?: string;
  userId: string;
  type: 'badge_earned' | 'event_reminder' | 'verification_needed' | 'rank_up' | 'event_joined' | 'certificate_issued' | 'monthly_report';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, unknown>;
  createdAt?: Date;
}

export interface EmailNotification {
  to: string;
  templateType: EmailTemplateType;
  data: EmailTemplateData;
  priority?: 'high' | 'normal' | 'low';
  scheduleAt?: Date;
}

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  // Get user notification preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true
      }
    });

    // Default preferences, could be stored in a separate table
    return {
      email: true,
      push: true,
      badges: true,
      events: true,
      verifications: true,
      monthlyReports: true,
      eventReminders: true,
      certificateIssued: true,
    };
  }

  // Update user notification preferences
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    // Note: User model doesn't have profile relation, preferences would need to be stored separately
    // For now, this is a placeholder implementation
    console.log('Updating notification preferences for user:', userId, preferences);
  }

  // Send email notification
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      const template = (emailTemplates as unknown as Record<string, (data: Record<string, unknown>) => { subject: string; html: string; text: string }>)[notification.templateType](notification.data);
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@impaktr.com',
        to: notification.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        priority: notification.priority || 'normal',
      };

      if (notification.scheduleAt && notification.scheduleAt > new Date()) {
        // Schedule email for later (you might want to use a job queue like Bull for this)
        console.log(`Email scheduled for ${notification.scheduleAt}:`, mailOptions.subject);
        // For now, we'll just send immediately
      }

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      
      // Log email in database for tracking
      await this.logEmailSent(notification.to, notification.templateType, result.messageId);
      
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Create in-app notification
  async createInAppNotification(notification: InAppNotification): Promise<string | null> {
    try {
      // Check user preferences first
      const preferences = await this.getUserPreferences(notification.userId);
      
      // Check if this type of notification is enabled
      const typeKey = this.getPreferenceKey(notification.type);
      if (typeKey && !preferences[typeKey]) {
        console.log(`In-app notification blocked by user preferences: ${notification.type}`);
        return null;
      }

      // Create notification in database
      const result = await prisma.$executeRaw`
        INSERT INTO notifications (user_id, type, title, message, read, action_url, data, created_at)
        VALUES (${notification.userId}, ${notification.type}, ${notification.title}, ${notification.message}, 
                ${notification.read}, ${notification.actionUrl}, ${JSON.stringify(notification.data)}, NOW())
        RETURNING id
      `;

      // In a real implementation, you might want to use WebSocket or Server-Sent Events
      // to push real-time notifications to the user's browser
      this.sendRealTimeNotification(notification);

      return 'notification-created';
    } catch (error) {
      console.error('Failed to create in-app notification:', error);
      return null;
    }
  }

  // Send push notification (Web Push API)
  async sendPushNotification(notification: PushNotification): Promise<boolean> {
    try {
      // This is a simplified version. In production, you'd use a service like
      // Firebase Cloud Messaging or implement Web Push Protocol
      
      const preferences = await this.getUserPreferences(notification.userId);
      if (!preferences.push) {
        console.log('Push notifications disabled for user');
        return false;
      }

      // Get user's push subscriptions from database
      const subscriptions = await this.getUserPushSubscriptions(notification.userId);
      
      const pushPayload = {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/impaktr-logo-192.png',
        badge: '/icons/impaktr-badge-72.png',
        data: {
          url: notification.actionUrl || '/dashboard',
          ...notification.data
        },
        actions: [
          {
            action: 'view',
            title: 'View',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          }
        ]
      };

      // Send to all user's devices
      const promises = subscriptions.map(subscription => 
        this.sendToDevice(subscription, pushPayload)
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      console.log(`Push notification sent to ${successCount}/${subscriptions.length} devices`);
      return successCount > 0;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  // Send comprehensive notification (email + in-app + push)
  async sendNotification(
    userId: string,
    type: InAppNotification['type'],
    data: {
      title: string;
      message: string;
      actionUrl?: string;
      emailTemplateType?: EmailTemplateType;
      emailData?: EmailTemplateData;
      pushData?: Partial<PushNotification>;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{
    email: boolean;
    inApp: boolean;
    push: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      console.error('User not found for notification');
      return { email: false, inApp: false, push: false };
    }

    const preferences = await this.getUserPreferences(userId);
    const results = { email: false, inApp: false, push: false };

    // Send in-app notification
    const inAppResult = await this.createInAppNotification({
      userId,
      type,
      title: data.title,
      message: data.message,
      read: false,
      actionUrl: data.actionUrl,
      data: data.metadata
    });
    results.inApp = !!inAppResult;

    // Send email notification if template provided
    if (data.emailTemplateType && data.emailData && preferences.email) {
      const emailResult = await this.sendEmail({
        to: user.email || '',
        templateType: data.emailTemplateType,
        data: {
          ...data.emailData,
          recipientName: user.name || 'User',
          recipientEmail: user.email || ''
        }
      });
      results.email = emailResult;
    }

    // Send push notification
    if (preferences.push) {
      const pushResult = await this.sendPushNotification({
        userId,
        title: data.title,
        body: data.message,
        actionUrl: data.actionUrl,
        data: data.metadata,
        ...data.pushData
      });
      results.push = pushResult;
    }

    return results;
  }

  // Specialized notification methods
  async notifyBadgeEarned(
    userId: string,
    badgeData: {
      badgeName: string;
      sdgNumber: number;
      tier: string;
      certificateUrl: string;
      profileUrl: string;
    }
  ): Promise<void> {
    await this.sendNotification(userId, 'badge_earned', {
      title: 'New Badge Earned! 🏆',
      message: `Congratulations! You've earned the ${badgeData.badgeName} badge`,
      actionUrl: badgeData.profileUrl,
      emailTemplateType: 'badgeEarned',
      emailData: {
        ...badgeData,
        recipientName: '',
        recipientEmail: ''
      },
      pushData: {
        icon: '/icons/badge-earned.png'
      },
      metadata: {
        badgeName: badgeData.badgeName,
        sdgNumber: badgeData.sdgNumber,
        tier: badgeData.tier
      }
    });
  }

  async notifyEventReminder(
    userId: string,
    eventData: {
      eventTitle: string;
      eventDate: string;
      eventLocation: string;
      eventUrl: string;
      organizerName: string;
      isVirtual: boolean;
    }
  ): Promise<void> {
    await this.sendNotification(userId, 'event_reminder', {
      title: 'Event Reminder 📅',
      message: `Don't forget: ${eventData.eventTitle} is tomorrow!`,
      actionUrl: eventData.eventUrl,
      emailTemplateType: 'eventReminder',
      emailData: {
        ...eventData,
        recipientName: '',
        recipientEmail: ''
      },
      pushData: {
        icon: '/icons/event-reminder.png'
      },
      metadata: {
        eventTitle: eventData.eventTitle,
        eventDate: eventData.eventDate
      }
    });
  }

  async notifyVerificationRequest(
    userId: string,
    verificationData: {
      requesterName: string;
      eventTitle: string;
      eventDate: string;
      hoursToVerify: number;
      verificationUrl: string;
    }
  ): Promise<void> {
    await this.sendNotification(userId, 'verification_needed', {
      title: 'Verification Request 🔍',
      message: `${verificationData.requesterName} needs your verification for ${verificationData.eventTitle}`,
      actionUrl: verificationData.verificationUrl,
      emailTemplateType: 'verificationRequest',
      emailData: {
        ...verificationData,
        recipientName: '',
        recipientEmail: ''
      },
      pushData: {
        icon: '/icons/verification-request.png'
      },
      metadata: verificationData
    });
  }

  async notifyCertificateIssued(
    userId: string,
    certificateData: {
      eventTitle: string;
      organizationName: string;
      organizationLogo?: string;
      hoursContributed: number;
      certificateUrl: string;
      linkedInShareUrl: string;
    }
  ): Promise<void> {
    await this.sendNotification(userId, 'certificate_issued', {
      title: 'Certificate Ready! 📜',
      message: `Your certificate for ${certificateData.eventTitle} has been issued`,
      actionUrl: certificateData.certificateUrl,
      emailTemplateType: 'certificateIssued',
      emailData: {
        ...certificateData,
        recipientName: '',
        recipientEmail: ''
      },
      pushData: {
        icon: '/icons/certificate-issued.png'
      },
      metadata: certificateData
    });
  }

  async notifyRankUp(
    userId: string,
    rankData: {
      oldRank: string;
      newRank: string;
      impaktrScore: number;
      profileUrl: string;
    }
  ): Promise<void> {
    await this.sendNotification(userId, 'rank_up', {
      title: 'Rank Up! 🚀',
      message: `Congratulations! You've been promoted to ${rankData.newRank}`,
      actionUrl: rankData.profileUrl,
      pushData: {
        icon: '/icons/rank-up.png'
      },
      metadata: rankData
    });
  }

  // Bulk notification methods
  async sendMonthlyReports(): Promise<void> {
    try {
      // Get all users who have monthly reports enabled
      const users = await prisma.user.findMany({
        where: {
          // Note: User model doesn't have profile relation, so we'll get all users for now
          // In a real implementation, you'd store notification preferences separately
        },
        include: {
          participations: {
            where: {
              status: 'ATTENDED',
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            },
            include: { event: true }
          },
          badges: {
            where: {
              earnedAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          }
        }
      });

      console.log(`Sending monthly reports to ${users.length} users`);

      const promises = users.map(user => this.sendUserMonthlyReport(user));
      await Promise.allSettled(promises);

      console.log('Monthly reports sent successfully');
    } catch (error) {
      console.error('Failed to send monthly reports:', error);
    }
  }

  // Helper methods
  private async sendUserMonthlyReport(user: { id: string; name: string | null; email: string; participations: Array<{ hours: number | null; event: { sdg: string | null } }> }): Promise<void> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthName = lastMonth.toLocaleString('default', { month: 'long' });

    const totalHours = user.participations.reduce((sum: number, p: { hours: number | null }) => 
      sum + (p.hours || 0), 0);

    const reportData = {
      month: monthName,
      year: lastMonth.getFullYear(),
      totalHours,
      eventsJoined: user.participations.length,
      badgesEarned: (user as unknown as { badges: Array<unknown> }).badges?.length || 0,
      currentScore: (user as unknown as { impactScore: number }).impactScore,
      currentRank: (user as unknown as { tier: string }).tier,
      topSDG: this.getTopSDG(user.participations),
      globalRanking: await this.getGlobalRanking(user.id),
      countryRanking: await this.getCountryRanking(user.id),
      reportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/profile/reports/${user.id}`
    };

    await this.sendEmail({
      to: user.email,
      templateType: 'monthlyReport',
      data: {
        recipientName: (user as unknown as { displayName?: string; firstName?: string }).displayName || (user as unknown as { displayName?: string; firstName?: string }).firstName || user.name || 'User',
        recipientEmail: user.email,
        ...reportData
      }
    });
  }

  private getTopSDG(participations: Array<{ hours: number | null; event: { sdg: string | null } }>): { number: number; hours: number } {
    const sdgHours: { [key: number]: number } = {};
    
    participations.forEach(p => {
      if (p.event.sdg) {
        const sdg = parseInt(p.event.sdg);
        sdgHours[sdg] = (sdgHours[sdg] || 0) + (p.hours || 0);
      }
    });

    const topSDG = Object.entries(sdgHours)
      .sort(([,a], [,b]) => b - a)[0];

    return topSDG ? 
      { number: parseInt(topSDG[0]), hours: topSDG[1] } : 
      { number: 1, hours: 0 };
  }

  private async getGlobalRanking(userId: string): Promise<number> {
    const rank = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) + 1 as count
      FROM users 
      WHERE impaktr_score > (
        SELECT impaktr_score FROM users WHERE id = ${userId}
      )
    `;
    return Number(rank[0]?.count || 1);
  }

  private async getCountryRanking(userId: string): Promise<number> {
    // Simplified version - you'd implement based on user's country
    return Math.floor(Math.random() * 1000) + 1; // Mock ranking
  }

  private getPreferenceKey(type: string): keyof NotificationPreferences | null {
    const mapping: { [key: string]: keyof NotificationPreferences } = {
      'badge_earned': 'badges',
      'event_reminder': 'eventReminders',
      'verification_needed': 'verifications',
      'certificate_issued': 'certificateIssued',
      'monthly_report': 'monthlyReports',
    };
    return mapping[type] || null;
  }

  private async getUserPushSubscriptions(userId: string): Promise<Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>> {
    // In a real implementation, you'd store push subscriptions in the database
    // For now, return empty array
    return [];
  }

  private async sendToDevice(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: { title: string; body: string; data?: Record<string, unknown> }): Promise<boolean> {
    // Implementation would use web-push library or similar
    // This is a placeholder
    console.log('Sending push to device:', payload.title);
    return true;
  }

  private sendRealTimeNotification(notification: InAppNotification): void {
    // In a real implementation, you'd use WebSocket or Server-Sent Events
    // to send real-time notifications to connected clients
    console.log('Real-time notification:', notification.title);
  }

  private async logEmailSent(to: string, templateType: string, messageId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO email_logs (recipient, template_type, message_id, sent_at)
        VALUES (${to}, ${templateType}, ${messageId}, NOW())
      `;
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export types and service
export { NotificationService };
export default notificationService;