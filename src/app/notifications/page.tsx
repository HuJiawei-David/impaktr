'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, Award, Calendar, Users, AlertCircle, UserCheck, UserX, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTimeAgo } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingConnection, setProcessingConnection] = useState<string | null>(null);
  const [processingCertificate, setProcessingCertificate] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
    } else if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, fetchNotifications, router]);

  // Listen for certificate confirmation to refresh notifications
  useEffect(() => {
    const handleCertificateConfirmed = () => {
      fetchNotifications();
    };

    // Listen for custom event when certificate is confirmed
    window.addEventListener('certificate-confirmed', handleCertificateConfirmed);
    return () => {
      window.removeEventListener('certificate-confirmed', handleCertificateConfirmed);
    };
  }, [fetchNotifications]);

  const handleAcceptConnection = async (connectionId: string, notificationId: string) => {
    setProcessingConnection(connectionId);
    
    try {
      const response = await fetch(`/api/users/connections/accept/${connectionId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
    } finally {
      setProcessingConnection(null);
    }
  };

  const handleRejectConnection = async (connectionId: string, notificationId: string) => {
    setProcessingConnection(connectionId);
    
    try {
      const response = await fetch(`/api/users/connections/reject/${connectionId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error rejecting connection:', error);
    } finally {
      setProcessingConnection(null);
    }
  };

  const handleConfirmCertificate = async (certificateId: string, notificationId: string) => {
    setProcessingCertificate(certificateId);
    
    try {
      const response = await fetch(`/api/participants/confirm-certificate/${certificateId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        fetchNotifications();
        // Dispatch event to notify other components (like Navigation) to refresh
        window.dispatchEvent(new CustomEvent('certificate-confirmed'));
        // Show success message or redirect
        console.log('Certificate confirmed successfully!');
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
        return <Award className="w-5 h-5 text-green-500" />;
      case 'rank_up':
        return <Award className="w-5 h-5 text-purple-500" />;
      case 'event_reminder':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'event_joined':
      case 'connection_request':
        return <Users className="w-5 h-5 text-indigo-500" />;
      case 'verification_needed':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'certificate_issued':
        return <Award className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with your connections, achievements, and activities
          </p>
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg text-gray-600 dark:text-gray-400">No notifications yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                You&apos;ll see notifications here when you receive connection requests, earn badges, and more.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isConnectionRequest = notification.data?.connectionId !== undefined || 
                                         notification.title?.toLowerCase().includes('connection request');
              const connectionId = notification.data?.connectionId;
              const requesterId = notification.data?.requesterId;
              const requesterImage = notification.data?.requesterImage;
              const requesterName = notification.data?.requesterName;
              
              // Check if this is a certificate confirmation notification
              const isCertificateConfirmation = notification.type === 'certificate_issued' && 
                                               notification.data?.requiresConfirmation;
              const certificateId = notification.data?.certificateId;
              const eventTitle = notification.data?.eventTitle;
              const scoreIncrease = notification.data?.scoreIncrease;
              
              return (
                <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-blue-600' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar for connection requests, icon for others */}
                      {isConnectionRequest && requesterImage !== undefined ? (
                        <button
                          onClick={() => {
                            if (requesterId) {
                              router.push(`/profile/${requesterId}`);
                            }
                          }}
                          className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={requesterImage || undefined} alt={requesterName || 'User'} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
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
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {isConnectionRequest && requesterName ? (
                                <>
                                  <button
                                    onClick={() => {
                                      if (requesterId) {
                                        router.push(`/profile/${requesterId}`);
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
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && !isConnectionRequest && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>

                        {/* Connection Request Actions */}
                        {isConnectionRequest && connectionId && !processingConnection && (
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptConnection(connectionId, notification.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectConnection(connectionId, notification.id)}
                              className="border-gray-300 dark:border-gray-600"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                            {requesterId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/profile/${requesterId}`)}
                                className="border-gray-300 dark:border-gray-600"
                                title="View Profile"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Profile
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Certificate Confirmation Actions */}
                        {isCertificateConfirmation && certificateId && !processingCertificate && (
                          <div className="mt-4 space-y-3">
                            {scoreIncrease && (
                              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Impact Score Increase:</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">+{scoreIncrease.toFixed(1)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleConfirmCertificate(certificateId, notification.id)}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Confirm Receipt
                              </Button>
                              {notification.actionUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(notification.actionUrl!)}
                                  className="border-gray-300 dark:border-gray-600"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Loading state */}
                        {isConnectionRequest && processingConnection === connectionId && (
                          <div className="flex items-center gap-2 mt-4">
                            <div className="h-9 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-9 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        )}

                        {/* Loading state for certificate confirmation */}
                        {isCertificateConfirmation && processingCertificate === certificateId && (
                          <div className="flex items-center gap-2 mt-4">
                            <div className="flex-1 h-9 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        )}

                        {/* Click action for non-connection and non-certificate requests */}
                        {!isConnectionRequest && !isCertificateConfirmation && notification.actionUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(notification.actionUrl!)}
                            className="mt-3 text-blue-600 dark:text-blue-400"
                          >
                            View details →
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

