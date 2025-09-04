// home/ubuntu/impaktrweb/src/components/community/CommunityLeaderboard.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInitials, formatScore } from '@/lib/utils';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  rank: string;
  organization?: string;
  currentPosition: number;
  previousPosition: number;
  impactScore: number;
  weeklyPoints: number;
  monthlyPoints: number;
  badgesEarned: number;
  hoursContributed: number;
}

export function CommunityLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Mock data - would come from API
      const mockData: LeaderboardUser[] = [
        {
          id: '1',
          name: 'Alex Chen',
          avatar: '/avatars/alex.jpg',
          rank: 'Global Citizen',
          organization: 'Green Future Org',
          currentPosition: 1,
          previousPosition: 2,
          impactScore: 892,
          weeklyPoints: 156,
          monthlyPoints: 678,
          badgesEarned: 23,
          hoursContributed: 234
        },
        {
          id: '2',
          name: 'Maria Santos',
          avatar: '/avatars/maria.jpg',
          rank: 'Ambassador',
          currentPosition: 2,
          previousPosition: 1,
          impactScore: 845,
          weeklyPoints: 142,
          monthlyPoints: 623,
          badgesEarned: 21,
          hoursContributed: 189
        },
        {
          id: '3',
          name: 'Dr. James Wilson',
          avatar: '/avatars/james.jpg',
          rank: 'Leader',
          organization: 'Healthcare United',
          currentPosition: 3,
          previousPosition: 4,
          impactScore: 789,
          weeklyPoints: 128,
          monthlyPoints: 567,
          badgesEarned: 19,
          hoursContributed: 156
        },
        {
          id: '4',
          name: 'Priya Sharma',
          avatar: '/avatars/priya.jpg',
          rank: 'Changemaker',
          currentPosition: 4,
          previousPosition: 3,
          impactScore: 734,
          weeklyPoints: 115,
          monthlyPoints: 512,
          badgesEarned: 17,
          hoursContributed: 143
        },
        {
          id: '5',
          name: 'Ahmed Al-Rashid',
          avatar: '/avatars/ahmed.jpg',
          rank: 'Mentor',
          organization: 'Education First',
          currentPosition: 5,
          previousPosition: 5,
          impactScore: 678,
          weeklyPoints: 98,
          monthlyPoints: 445,
          badgesEarned: 15,
          hoursContributed: 125
        }
      ];
      
      setLeaderboard(mockData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankChangeIcon = (current: number, previous: number) => {
    if (current < previous) {
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    } else if (current > previous) {
      return <TrendingDown className="w-3 h-3 text-red-500" />;
    }
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getScoreForPeriod = (user: LeaderboardUser) => {
    switch (period) {
      case 'weekly':
        return user.weeklyPoints;
      case 'monthly':
        return user.monthlyPoints;
      default:
        return user.impactScore;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Community Leaders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Community Leaders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={(value: any) => setPeriod(value)} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
            <TabsTrigger value="all-time" className="text-xs">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          {leaderboard.slice(0, 5).map((user) => (
            <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
              <div className="flex items-center space-x-2">
                {getPositionIcon(user.currentPosition)}
                {getRankChangeIcon(user.currentPosition, user.previousPosition)}
              </div>
              
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm truncate">{user.name}</h4>
                  <span className="font-bold text-sm">{formatScore(getScoreForPeriod(user))}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">{user.rank}</Badge>
                  {user.organization && (
                    <span className="text-xs text-muted-foreground truncate">
                      {user.organization}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="ghost" size="sm" className="w-full mt-4">
          View Full Leaderboard
        </Button>
      </CardContent>
    </Card>
  );
}
