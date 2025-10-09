// home/ubuntu/impaktrweb/src/components/notifications/NotificationDropdown.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Award, Calendar, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatTimeAgo } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'badge_earned' | 'event_reminder' | 'verification_needed' | 'rank_up' | 'event_joined';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await fetch('/api/notifications');
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'badge_earned',
          title: 'New Badge Earned!',
          message: 'You earned the Climate Action Supporter badge',
          read: false,
          createdAt: '2024-01-15T10:30:00Z',
          actionUrl: '/profile/badges'
        },
        {
          id: '2',
          type: 'event_reminder',
          title: 'Event Tomorrow',
          message: 'Beach Cleanup Drive starts at 9:00 AM',
          read: false,
          createdAt: '2024-01-15T08:00:00Z',
          actionUrl: '/events/beach-cleanup-123'
        },
        {
          id: '3',
          type: 'verification_needed',
          title: 'Verification Pending',
          message: 'Your food distribution hours need verification',
          read: true,
          createdAt: '2024-01-14T16:45:00Z',
          actionUrl: '/participations/pending'
        },
        {
          id: '4',
          type: 'rank_up',
          title: 'Rank Promotion!',
          message: 'Congratulations! You are now a Contributor',
          read: true,
          createdAt: '2024-01-12T14:20:00Z',
          actionUrl: '/profile'
        },
        {
          id: '5',
          type: 'event_joined',
          title: 'New Participant',
          message: 'Sarah joined your tutoring program',
          read: true,
          createdAt: '2024-01-11T11:15:00Z',
          actionUrl: '/events/tutoring-456'
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // API call to mark as read
      // await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // await fetch('/api/notifications/read-all', { method: 'POST' });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'badge_earned':
        return <Award className="w-4 h-4 text-green-500" />;
      case 'rank_up':
        return <Award className="w-4 h-4 text-purple-500" />;
      case 'event_reminder':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'event_joined':
        return <Users className="w-4 h-4 text-indigo-500" />;
      case 'verification_needed':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 p-4 hover:bg-accent/50 cursor-pointer border-b border-border/50 last:border-0 ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                  setIsOpen(false);
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
                
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  window.location.href = '/notifications';
                  setIsOpen(false);
                }}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}