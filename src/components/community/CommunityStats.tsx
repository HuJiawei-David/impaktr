// home/ubuntu/impaktrweb/src/components/community/CommunityStats.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Award, 
  Globe, 
  Activity,
  Clock,
  MessageCircle,
  Heart,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatNumber } from '@/lib/utils';

interface CommunityStatsData {
  totalMembers: number;
  activeToday: number;
  postsToday: number;
  totalPosts: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  eventsThisWeek: number;
  badgesEarnedToday: number;
  impactHoursToday: number;
  memberGrowth: number;
  engagementRate: number;
  topCountries: Array<{
    country: string;
    members: number;
    percentage: number;
  }>;
  topSDGs: Array<{
    sdg: number;
    posts: number;
    percentage: number;
  }>;
  realtimeActivity: Array<{
    id: string;
    type: 'join' | 'post' | 'badge' | 'event';
    message: string;
    timestamp: Date;
  }>;
}

export function CommunityStats() {
  const [stats, setStats] = useState<CommunityStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchStats();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      // Mock real-time data - would come from API/WebSocket
      const mockStats: CommunityStatsData = {
        totalMembers: Math.floor(Math.random() * 100) + 45234,
        activeToday: Math.floor(Math.random() * 50) + 1247,
        postsToday: Math.floor(Math.random() * 20) + 156,
        totalPosts: Math.floor(Math.random() * 1000) + 23456,
        totalLikes: Math.floor(Math.random() * 5000) + 123456,
        totalShares: Math.floor(Math.random() * 1000) + 15678,
        totalComments: Math.floor(Math.random() * 2000) + 34567,
        eventsThisWeek: Math.floor(Math.random() * 10) + 42,
        badgesEarnedToday: Math.floor(Math.random() * 30) + 89,
        impactHoursToday: Math.floor(Math.random() * 500) + 2345,
        memberGrowth: Math.floor(Math.random() * 5) + 12,
        engagementRate: Math.floor(Math.random() * 10) + 78,
        topCountries: [
          { country: 'Malaysia', members: 12456, percentage: 28 },
          { country: 'Singapore', members: 8934, percentage: 20 },
          { country: 'Indonesia', members: 7234, percentage: 16 },
          { country: 'Philippines', members: 5678, percentage: 13 },
          { country: 'Thailand', members: 4567, percentage: 10 }
        ],
        topSDGs: [
          { sdg: 13, posts: 234, percentage: 22 },
          { sdg: 4, posts: 198, percentage: 18 },
          { sdg: 3, posts: 167, percentage: 15 },
          { sdg: 1, posts: 145, percentage: 14 },
          { sdg: 10, posts: 123, percentage: 12 }
        ],
        realtimeActivity: [
          { 
            id: '1', 
            type: 'join', 
            message: 'Sarah M. joined the community', 
            timestamp: new Date(Date.now() - Math.random() * 300000) 
          },
          { 
            id: '2', 
            type: 'badge', 
            message: 'Alex earned Climate Action Champion badge', 
            timestamp: new Date(Date.now() - Math.random() * 300000) 
          },
          { 
            id: '3', 
            type: 'post', 
            message: 'Maria shared a new impact story', 
            timestamp: new Date(Date.now() - Math.random() * 300000) 
          },
          { 
            id: '4', 
            type: 'event', 
            message: 'Beach Cleanup event started', 
            timestamp: new Date(Date.now() - Math.random() * 300000) 
          }
        ]
      };
      
      setStats(mockStats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching community stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'join': return <Users className="w-3 h-3" />;
      case 'post': return <MessageCircle className="w-3 h-3" />;
      case 'badge': return <Award className="w-3 h-3" />;
      case 'event': return <Calendar className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'join': return 'text-blue-500';
      case 'post': return 'text-green-500';
      case 'badge': return 'text-yellow-500';
      case 'event': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Live Community Stats
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatNumber(stats.totalMembers)}
              </div>
              <div className="text-xs text-muted-foreground">Total Members</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+{stats.memberGrowth}%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(stats.activeToday)}
              </div>
              <div className="text-xs text-muted-foreground">Active Today</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round((stats.activeToday / stats.totalMembers) * 100)}% of members
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.postsToday}
              </div>
              <div className="text-xs text-muted-foreground">Posts Today</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatNumber(stats.totalPosts)} total
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.badgesEarnedToday}
              </div>
              <div className="text-xs text-muted-foreground">Badges Today</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatNumber(stats.impactHoursToday)} hours
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Engagement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm">Total Likes</span>
              </div>
              <span className="font-semibold">{formatNumber(stats.totalLikes)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Total Comments</span>
              </div>
              <span className="font-semibold">{formatNumber(stats.totalComments)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Total Shares</span>
              </div>
              <span className="font-semibold">{formatNumber(stats.totalShares)}</span>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Engagement Rate</span>
                <span className="text-sm font-medium">{stats.engagementRate}%</span>
              </div>
              <Progress value={stats.engagementRate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top SDGs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Popular SDGs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topSDGs.map((sdg, index) => (
              <div key={sdg.sdg} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  <Badge variant="sdg" sdgNumber={sdg.sdg} className="text-xs">
                    SDG {sdg.sdg}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{sdg.posts} posts</div>
                  <div className="text-xs text-muted-foreground">{sdg.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {stats.realtimeActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 text-sm">
                <div className={`${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <span className="flex-1">{activity.message}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.floor((Date.now() - activity.timestamp.getTime()) / 60000)}m ago
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Countries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Global Reach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topCountries.map((country, index) => (
              <div key={country.country} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  <span className="text-sm font-medium">{country.country}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatNumber(country.members)}</div>
                  <div className="text-xs text-muted-foreground">{country.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}