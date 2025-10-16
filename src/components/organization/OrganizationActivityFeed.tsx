'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  ThumbsUp,
  Clock,
  MapPin,
  Users,
  Award,
  Calendar,
  TrendingUp,
  Leaf,
  Target,
  Zap,
  Building2,
  UserPlus,
  CheckCircle,
  Star
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'member_achievement' | 'event_completed' | 'badge_earned' | 'member_joined' | 'milestone' | 'post' | 'esg_update';
  title: string;
  description: string;
  timestamp: string;
  author?: {
    id: string;
    name: string;
    avatar?: string | null;
    role?: string;
  };
  member?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  event?: {
    id: string;
    title: string;
    location?: string;
  };
  badge?: {
    name: string;
    icon: string;
    category: string;
  };
  metrics?: {
    hours?: number;
    impact?: number;
    participants?: number;
  };
  likes: number;
  comments: number;
  isLiked?: boolean;
  image?: string;
}

interface OrganizationActivityFeedProps {
  organizationId: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'member_achievement':
      return <Target className="h-5 w-5 text-green-600 dark:text-green-400" />;
    case 'event_completed':
      return <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case 'badge_earned':
      return <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
    case 'member_joined':
      return <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    case 'milestone':
      return <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    case 'post':
      return <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    case 'esg_update':
      return <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
  }
};

const getActivityColor = (type: string) => {
  // Use subtle, consistent styling for all activity types - matches individual dashboard
  return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
};

export default function OrganizationActivityFeed({ organizationId }: OrganizationActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - in production, fetch from API
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'member_achievement',
        title: 'Sarah completed 8 volunteer hours',
        description: 'Volunteered at the Beach Cleanup event and helped collect 50kg of plastic waste',
        timestamp: '2 hours ago',
        member: {
          id: '1',
          name: 'Sarah Johnson',
          avatar: null
        },
        event: {
          id: '1',
          title: 'Beach Cleanup Drive',
          location: 'Santa Monica Beach'
        },
        metrics: {
          hours: 8,
          impact: 150
        },
        likes: 12,
        comments: 3,
        isLiked: false
      },
      {
        id: '2',
        type: 'event_completed',
        title: 'Community Garden Event Completed',
        description: 'Successfully completed our monthly community garden maintenance with 15 volunteers',
        timestamp: '4 hours ago',
        author: {
          id: '1',
          name: 'Mike Chen',
          avatar: null,
          role: 'Event Coordinator'
        },
        metrics: {
          participants: 15,
          hours: 45
        },
        likes: 8,
        comments: 2,
        isLiked: true
      },
      {
        id: '3',
        type: 'badge_earned',
        title: 'Organization earned SDG Badge',
        description: 'Congratulations! Your organization has earned the SDG 13 (Climate Action) badge',
        timestamp: '1 day ago',
        badge: {
          name: 'Climate Action Champion',
          icon: '🌱',
          category: 'SDG 13'
        },
        likes: 25,
        comments: 7,
        isLiked: false
      },
      {
        id: '4',
        type: 'member_joined',
        title: 'New team member joined',
        description: 'Welcome Alex Rodriguez to our sustainability team!',
        timestamp: '2 days ago',
        member: {
          id: '2',
          name: 'Alex Rodriguez',
          avatar: null
        },
        likes: 15,
        comments: 5,
        isLiked: false
      },
      {
        id: '5',
        type: 'milestone',
        title: '500 Volunteer Hours Milestone!',
        description: 'Amazing achievement! Our organization has reached 500 total volunteer hours this quarter',
        timestamp: '3 days ago',
        metrics: {
          hours: 500
        },
        likes: 32,
        comments: 12,
        isLiked: true
      },
      {
        id: '6',
        type: 'post',
        title: 'Monthly Impact Report',
        description: 'Check out our latest impact report! We\'ve made significant progress in our sustainability goals this month.',
        timestamp: '1 week ago',
        author: {
          id: '1',
          name: 'Jennifer Park',
          avatar: null,
          role: 'Sustainability Director'
        },
        likes: 18,
        comments: 4,
        isLiked: false
      }
    ];

    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 1000);
  }, [organizationId]);

  const handleLike = (activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { 
            ...activity, 
            isLiked: !activity.isLiked,
            likes: activity.isLiked ? activity.likes - 1 : activity.likes + 1
          }
        : activity
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className={`border-0 shadow-sm transition-all hover:shadow-md ${getActivityColor(activity.type)}`}>
          <CardContent className="p-6">
            <div className="flex space-x-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {activity.author ? (
                  <Avatar className="w-10 h-10">
                    {activity.author.avatar ? (
                      <AvatarImage src={activity.author.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {activity.author.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ) : activity.member ? (
                  <Avatar className="w-10 h-10">
                    {activity.member.avatar ? (
                      <AvatarImage src={activity.member.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {activity.member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {activity.title}
                      </h3>
                      {activity.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.badge.icon} {activity.badge.name}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {activity.description}
                    </p>

                    {/* Metrics */}
                    {activity.metrics && (
                      <div className="flex items-center space-x-4 mb-3">
                        {activity.metrics.hours && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>{activity.metrics.hours}h</span>
                          </div>
                        )}
                        {activity.metrics.impact && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                            <TrendingUp className="h-4 w-4" />
                            <span>{activity.metrics.impact} pts</span>
                          </div>
                        )}
                        {activity.metrics.participants && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                            <Users className="h-4 w-4" />
                            <span>{activity.metrics.participants} volunteers</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Event/Location info */}
                    {activity.event && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-500 mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{activity.event.title}</span>
                        {activity.event.location && (
                          <>
                            <span>•</span>
                            <MapPin className="h-4 w-4" />
                            <span>{activity.event.location}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Author info */}
                    {activity.author && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                        Posted by {activity.author.name}
                        {activity.author.role && (
                          <span className="ml-1">• {activity.author.role}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(activity.id)}
                        className={`flex items-center space-x-1 ${
                          activity.isLiked ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${activity.isLiked ? 'fill-current' : ''}`} />
                        <span>{activity.likes}</span>
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <MessageCircle className="h-4 w-4" />
                        <span>{activity.comments}</span>
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {activities.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No activity yet</h3>
              <p className="text-sm">Start by creating events or encouraging team members to participate!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
