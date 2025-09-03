// home/ubuntu/impaktrweb/src/components/dashboard/RecentActivity.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Award, 
  TrendingUp, 
  Users, 
  Heart, 
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTimeAgo, getInitials, getSDGColor } from '@/lib/utils';
import Link from 'next/link';

interface Activity {
  id: string;
  type: 'event_joined' | 'event_completed' | 'badge_earned' | 'rank_up' | 'verification_approved' | 'milestone_reached' | 'certificate_shared';
  title: string;
  description: string;
  timestamp: string;
  points: number;
  metadata: {
    eventId?: string;
    eventTitle?: string;
    eventLocation?: string;
    badgeId?: string;
    badgeName?: string;
    sdgNumber?: number;
    rankFrom?: string;
    rankTo?: string;
    hoursContributed?: number;
    organizationName?: string;
    participantCount?: number;
  };
  relatedUser?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('week');

  useEffect(() => {
    fetchActivities();
  }, [filter, timeRange]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // This would be replaced with actual API call
      // const response = await fetch(`/api/users/activity?filter=${filter}&timeRange=${timeRange}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'event_completed',
          title: 'Beach Cleanup Completed',
          description: 'Successfully completed the Marina Bay beach cleanup event',
          timestamp: '2024-01-15T14:30:00Z',
          points: 25,
          metadata: {
            eventId: 'event-123',
            eventTitle: 'Marina Bay Beach Cleanup',
            eventLocation: 'Marina Bay, Singapore',
            hoursContributed: 4,
            organizationName: 'Ocean Conservation SG'
          }
        },
        {
          id: '2',
          type: 'badge_earned',
          title: 'Climate Action Supporter Badge Earned',
          description: 'Earned the Climate Action Supporter badge for environmental activities',
          timestamp: '2024-01-15T15:00:00Z',
          points: 50,
          metadata: {
            badgeId: 'badge-sdg13-supporter',
            badgeName: 'Climate Action Supporter',
            sdgNumber: 13
          }
        },
        {
          id: '3',
          type: 'event_joined',
          title: 'Joined Food Distribution Drive',
          description: 'Signed up for the community food distribution event',
          timestamp: '2024-01-14T09:15:00Z',
          points: 5,
          metadata: {
            eventId: 'event-456',
            eventTitle: 'Community Food Distribution',
            eventLocation: 'Subang Jaya Community Center',
            organizationName: 'Food Aid Malaysia'
          }
        },
        {
          id: '4',
          type: 'verification_approved',
          title: 'Tutoring Hours Verified',
          description: 'Your 6 hours of math tutoring have been verified by the organizer',
          timestamp: '2024-01-13T16:45:00Z',
          points: 18,
          metadata: {
            eventId: 'event-789',
            eventTitle: 'Math Tutoring Program',
            hoursContributed: 6,
            organizationName: 'Education for All'
          },
          relatedUser: {
            id: 'org-123',
            name: 'Sarah Chen',
            avatar: '/avatars/sarah.jpg'
          }
        },
        {
          id: '5',
          type: 'milestone_reached',
          title: '50 Impact Hours Milestone',
          description: 'Congratulations! You\'ve reached 50 verified impact hours',
          timestamp: '2024-01-12T12:00:00Z',
          points: 100,
          metadata: {
            hoursContributed: 50
          }
        },
        {
          id: '6',
          type: 'rank_up',
          title: 'Promoted to Contributor',
          description: 'Your dedication has earned you the Contributor rank!',
          timestamp: '2024-01-10T10:30:00Z',
          points: 75,
          metadata: {
            rankFrom: 'Supporter',
            rankTo: 'Contributor'
          }
        },
        {
          id: '7',
          type: 'certificate_shared',
          title: 'Certificate Shared on LinkedIn',
          description: 'Your Climate Action badge certificate was shared on LinkedIn',
          timestamp: '2024-01-09T14:20:00Z',
          points: 10,
          metadata: {
            badgeName: 'Climate Action Supporter'
          }
        }
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type'], metadata: Activity['metadata']) => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'event_joined':
        return <Calendar className={`${iconClass} text-blue-500`} />;
      case 'event_completed':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'badge_earned':
        return (
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: metadata.sdgNumber ? getSDGColor(metadata.sdgNumber) : '#666' }}
          >
            {metadata.sdgNumber || 'B'}
          </div>
        );
      case 'rank_up':
        return <TrendingUp className={`${iconClass} text-purple-500`} />;
      case 'verification_approved':
        return <CheckCircle className={`${iconClass} text-emerald-500`} />;
      case 'milestone_reached':
        return <Award className={`${iconClass} text-orange-500`} />;
      case 'certificate_shared':
        return <Heart className={`${iconClass} text-pink-500`} />;
      default:
        return <Users className={`${iconClass} text-gray-500`} />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'event_joined': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'event_completed': return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
      case 'badge_earned': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'rank_up': return 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20';
      case 'verification_approved': return 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
      case 'milestone_reached': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'certificate_shared': return 'border-l-pink-500 bg-pink-50 dark:bg-pink-950/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="event_completed">Events</SelectItem>
                <SelectItem value="badge_earned">Badges</SelectItem>
                <SelectItem value="rank_up">Ranks</SelectItem>
                <SelectItem value="verification_approved">Verified</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4 p-4">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No recent activity</h3>
            <p className="text-muted-foreground text-sm">
              Start participating in events to see your activity here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredActivities.slice(0, 8).map((activity, index) => (
              <div
                key={activity.id}
                className={`relative flex items-start space-x-4 p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-sm cursor-pointer ${getActivityColor(activity.type)}`}
              >
                {/* Activity Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type, activity.metadata)}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground mb-1">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.description}
                      </p>
                      
                      {/* Activity Details */}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                        
                        {activity.metadata.eventLocation && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {activity.metadata.eventLocation}
                          </span>
                        )}
                        
                        {activity.metadata.organizationName && (
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {activity.metadata.organizationName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Points and Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {activity.points > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{activity.points} pts
                        </Badge>
                      )}
                      
                      {activity.metadata.eventId && (
                        <Link href={`/events/${activity.metadata.eventId}`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Related User */}
                  {activity.relatedUser && (
                    <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-border/50">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={activity.relatedUser.avatar} />
                        <AvatarFallback className="text-xs">
                          {getInitials(activity.relatedUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        Verified by {activity.relatedUser.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View More Button */}
        {filteredActivities.length > 8 && (
          <div className="mt-6 text-center">
            <Link href="/activity">
              <Button variant="outline" size="sm">
                View All Activity
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* Activity Summary */}
        {filteredActivities.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {timeRange === 'day' && 'Today'}
                {timeRange === 'week' && 'This week'}
                {timeRange === 'month' && 'This month'}
                {timeRange === 'all' && 'Total'}
                {': '}
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground">
                  {filteredActivities.length} activities
                </span>
                <span className="font-medium">
                  +{filteredActivities.reduce((sum, activity) => sum + activity.points, 0)} points
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}