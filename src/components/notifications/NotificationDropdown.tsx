// home/ubuntu/impaktrweb/src/components/notifications/NotificationDropdown.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, X, Award, Calendar, Users, AlertCircle, UserCheck, UserX, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatTimeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketProvider';

interface Notification {
  id: string;
  type: 'badge_earned' | 'event_reminder' | 'verification_needed' | 'rank_up' | 'event_joined' | 'connection_request' | 'certificate_issued';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  data?: {
    connectionId?: string;
    requesterId?: string;
    requesterName?: string;
    requesterImage?: string | null;
    certificateId?: string;
    requiresConfirmation?: boolean;
    confirmUrl?: string;
    eventTitle?: string;
    impactScore?: number;
    scoreIncrease?: number;
  };
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [processingConnection, setProcessingConnection] = useState<string | null>(null);
  const [processingCertificate, setProcessingCertificate] = useState<string | null>(null);
  const router = useRouter();
  const { socket } = useSocket();
  
  // Limit to 5 notifications in dropdown
  const displayedNotifications = notifications.slice(0, 5);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        console.log('[NotificationDropdown] Fetched notifications:', {
          count: data.notifications?.length || 0,
          unreadCount: data.unreadCount || 0,
          notifications: data.notifications?.map((n: Notification) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            read: n.read,
            hasData: !!n.data,
            requiresConfirmation: n.data?.requiresConfirmation,
            certificateId: n.data?.certificateId
          }))
        });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('[NotificationDropdown] Failed to fetch notifications:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[NotificationDropdown] Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    // Refresh notifications when dropdown is opened
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Listen for real-time socket notifications
  useEffect(() => {
    if (!socket) {
      console.log('[NotificationDropdown] Socket not available, skipping real-time notifications');
      return;
    }

    const handleNotification = (notificationData: {
      type: string;
      title: string;
      message: string;
      data?: Notification['data'];
    }) => {
      console.log('[NotificationDropdown] Received real-time notification:', notificationData);
      
      // Create a temporary notification ID (will be replaced when we fetch from API)
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Ensure data is an object and preserve all properties
      const notificationDataObj = notificationData.data && typeof notificationData.data === 'object' 
        ? notificationData.data 
        : {};
      
      // Normalize notification type to match expected format
      let normalizedType = notificationData.type;
      if (normalizedType === 'CERTIFICATE_ISSUED' || normalizedType === 'certificate_issued') {
        normalizedType = 'certificate_issued';
      }
      
      // Extract actionUrl from data if present, or use undefined
      const actionUrl = (notificationDataObj as { actionUrl?: string })?.actionUrl;
      
      // Add the notification to the list
      const newNotification: Notification = {
        id: tempId,
        type: normalizedType as Notification['type'],
        title: notificationData.title,
        message: notificationData.message,
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: actionUrl,
        data: notificationDataObj as Notification['data'],
      };

      console.log('[NotificationDropdown] Adding socket notification:', {
        id: newNotification.id,
        type: newNotification.type,
        normalizedType,
        hasData: !!newNotification.data,
        dataKeys: Object.keys(notificationDataObj),
        requiresConfirmation: notificationDataObj?.requiresConfirmation,
        requiresConfirmationType: typeof notificationDataObj?.requiresConfirmation,
        certificateId: notificationDataObj?.certificateId,
        fullData: notificationDataObj
      });

      // Add to the beginning of the list
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log('[NotificationDropdown] Updated unread count:', newCount);
        return newCount;
      });

      // Also refresh from API to get the real notification with proper ID
      // This ensures we have the correct data from the database
      setTimeout(() => {
        console.log('[NotificationDropdown] Refreshing notifications from API after socket notification');
        fetchNotifications();
      }, 500);
    };

    console.log('[NotificationDropdown] Setting up socket notification listener');
    socket.on('notification', handleNotification);

    return () => {
      console.log('[NotificationDropdown] Cleaning up socket notification listener');
      socket.off('notification', handleNotification);
    };
  }, [socket, fetchNotifications]);

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

  const handleAcceptConnection = async (connectionId: string, notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingConnection(connectionId);
    
    try {
      const response = await fetch(`/api/users/connections/accept/${connectionId}`, {
        method: 'POST',
      });

      if (response.ok) {
        // Remove the notification and refresh
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Refresh notifications to get updated count
        fetchNotifications();
      } else {
        console.error('Failed to accept connection');
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
    } finally {
      setProcessingConnection(null);
    }
  };

  const handleRejectConnection = async (connectionId: string, notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingConnection(connectionId);
    
    try {
      const response = await fetch(`/api/users/connections/reject/${connectionId}`, {
        method: 'POST',
      });

      if (response.ok) {
        // Remove the notification and refresh
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Refresh notifications to get updated count
        fetchNotifications();
      } else {
        console.error('Failed to reject connection');
      }
    } catch (error) {
      console.error('Error rejecting connection:', error);
    } finally {
      setProcessingConnection(null);
    }
  };

  const handleConfirmCertificate = async (certificateId: string, notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingCertificate(certificateId);
    
    try {
      const response = await fetch(`/api/participants/confirm-certificate/${certificateId}`, {
        method: 'POST',
      });

      if (response.ok) {
        // Remove the notification and refresh
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Refresh notifications to get updated count
        fetchNotifications();
        
        // Dispatch event to notify Navigation component to refresh certificate count
        window.dispatchEvent(new CustomEvent('certificate-confirmed'));
        
        // Show success message
        console.log('Certificate confirmed successfully!');
      } else {
        console.error('Failed to confirm certificate');
      }
    } catch (error) {
      console.error('Error confirming certificate:', error);
    } finally {
      setProcessingCertificate(null);
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
      case 'connection_request':
        return <Users className="w-4 h-4 text-indigo-500" />;
      case 'verification_needed':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'certificate_issued':
        return <Award className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 min-w-[80px] group text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700">
          <div className="relative">
            <Bell className="w-5 h-5 mb-1 transition-all duration-200 group-hover:scale-110" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </div>
          <span className="truncate">Notifications</span>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80 max-h-[85vh] flex flex-col" 
        align="end"
        sideOffset={8}
        collisionPadding={16}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {displayedNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            displayedNotifications.map((notification) => {
              // Check if this is a connection request by looking at the data field
              const isConnectionRequest = notification.data?.connectionId !== undefined || 
                                         notification.title?.toLowerCase().includes('connection request');
              const connectionId = notification.data?.connectionId;
              const requesterId = notification.data?.requesterId;
              const requesterImage = notification.data?.requesterImage;
              const requesterName = notification.data?.requesterName;
              
              // Check if this is a certificate confirmation notification
              // Make sure data exists and is an object
              const notificationData = notification.data && typeof notification.data === 'object' ? notification.data : null;
              
              // Normalize type check - handle both uppercase and lowercase
              const notificationTypeLower = typeof notification.type === 'string' ? notification.type.toLowerCase() : '';
              const isCertificateType = notification.type === 'certificate_issued' || 
                                      notificationTypeLower === 'certificate_issued';
              
              // Check for certificate confirmation - requiresConfirmation can be true, "true", or 1
              const requiresConfirmationValue = notificationData?.requiresConfirmation as unknown;
              const requiresConfirmation = requiresConfirmationValue === true || 
                                          requiresConfirmationValue === 'true' ||
                                          requiresConfirmationValue === 1 ||
                                          requiresConfirmationValue === '1';
              
              const isCertificateConfirmation = isCertificateType && requiresConfirmation;
              const certificateId = notificationData?.certificateId;
              const eventTitle = notificationData?.eventTitle;
              const scoreIncrease = notificationData?.scoreIncrease;
              
              // Debug log for certificate notifications
              if (isCertificateType) {
                console.log('[NotificationDropdown] Certificate notification detected:', {
                  id: notification.id,
                  type: notification.type,
                  isCertificateType,
                  isCertificateConfirmation,
                  hasData: !!notification.data,
                  dataType: typeof notification.data,
                  dataIsObject: notification.data && typeof notification.data === 'object',
                  requiresConfirmation: notificationData?.requiresConfirmation,
                  requiresConfirmationValue: notificationData?.requiresConfirmation,
                  requiresConfirmationType: typeof notificationData?.requiresConfirmation,
                  certificateId,
                  certificateIdExists: !!certificateId,
                  fullData: notification.data
                });
              }
              
              return (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-border/50 last:border-0 ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar for connection requests, icon for others */}
                    {isConnectionRequest && requesterImage !== undefined ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (requesterId) {
                            router.push(`/profile/${requesterId}`);
                            setIsOpen(false);
                          }
                        }}
                        className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={requesterImage || undefined} alt={requesterName || 'User'} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                            {requesterName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    ) : (
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {isConnectionRequest && requesterName ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (requesterId) {
                                      router.push(`/profile/${requesterId}`);
                                      setIsOpen(false);
                                    }
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                  {requesterName}
                                </button>
                                {' wants to connect with you'}
                              </>
                            ) : (
                              notification.message
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && !isConnectionRequest && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>

                      {/* Connection Request Actions - LinkedIn Style */}
                      {isConnectionRequest && connectionId && !processingConnection && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={(e) => handleAcceptConnection(connectionId, notification.id, e)}
                            disabled={processingConnection === connectionId}
                            className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleRejectConnection(connectionId, notification.id, e)}
                            disabled={processingConnection === connectionId}
                            className="flex-1 h-8 text-xs border-gray-300 dark:border-gray-600"
                          >
                            <UserX className="w-3 h-3 mr-1" />
                            Decline
                          </Button>
                          {requesterId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/profile/${requesterId}`);
                                setIsOpen(false);
                              }}
                              className="h-8 px-3 text-xs border-gray-300 dark:border-gray-600"
                              title="View Profile"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Loading state for connection requests */}
                      {isConnectionRequest && processingConnection === connectionId && (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                      )}

                      {/* Certificate Confirmation Actions */}
                      {isCertificateConfirmation && certificateId && !processingCertificate && (
                        <div className="mt-3 space-y-2">
                          {scoreIncrease !== undefined && scoreIncrease !== null && (
                            <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">Impact Score Increase:</span>
                              <span className="font-bold text-green-600 dark:text-green-400">+{scoreIncrease.toFixed(1)}</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            onClick={(e) => handleConfirmCertificate(certificateId, notification.id, e)}
                            disabled={processingCertificate === certificateId}
                            className="w-full h-8 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Confirm Receipt
                          </Button>
                        </div>
                      )}

                      {/* Loading state for certificate confirmation */}
                      {isCertificateConfirmation && processingCertificate === certificateId && (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                      )}

                      {/* Click action for non-connection and non-certificate requests */}
                      {!isConnectionRequest && !isCertificateConfirmation && notification.actionUrl && (
                        <button
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                            router.push(notification.actionUrl!);
                            setIsOpen(false);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                        >
                          View →
                        </button>
                      )}
                      
                      {/* View certificate button for certificate notifications */}
                      {isCertificateConfirmation && notification.actionUrl && (
                        <button
                          onClick={() => {
                            router.push(notification.actionUrl!);
                            setIsOpen(false);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                        >
                          View Certificate →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="flex-shrink-0" />
            <div className="p-2 flex-shrink-0 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  router.push('/notifications');
                  setIsOpen(false);
                }}
              >
                {notifications.length > displayedNotifications.length 
                  ? `View all ${notifications.length} notifications`
                  : 'View all notifications'
                }
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}