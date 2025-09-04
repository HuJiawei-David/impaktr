// home/ubuntu/impaktrweb/src/components/community/SuggestedConnections.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';

interface SuggestedUser {
  id: string;
  name: string;
  avatar: string;
  rank: string;
  organization?: string;
  commonSDGs: number[];
  mutualConnections: number;
  impactScore: number;
}

interface SuggestedConnectionsProps {
  userId?: string;
}

export function SuggestedConnections({ userId }: SuggestedConnectionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchSuggestions();
  }, [userId]);

  const fetchSuggestions = async () => {
    // Mock data - would come from API
    setSuggestions([
      {
        id: '1',
        name: 'Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        rank: 'Changemaker',
        organization: 'WWF Malaysia',
        commonSDGs: [13, 14, 15],
        mutualConnections: 3,
        impactScore: 456
      },
      {
        id: '2',
        name: 'Ahmad Rahman',
        avatar: '/avatars/ahmad.jpg',
        rank: 'Builder',
        commonSDGs: [4, 10],
        mutualConnections: 1,
        impactScore: 234
      },
      {
        id: '3',
        name: 'Dr. Maya Patel',
        avatar: '/avatars/maya.jpg',
        rank: 'Leader',
        organization: 'UNICEF',
        commonSDGs: [3, 4, 5],
        mutualConnections: 2,
        impactScore: 678
      }
    ]);
  };

  const handleFollow = async (targetUserId: string) => {
    try {
      const response = await fetch(`/api/social/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      if (response.ok) {
        setFollowingStatus(prev => ({
          ...prev,
          [targetUserId]: !prev[targetUserId]
        }));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <UserPlus className="w-5 h-5 mr-2" />
          Suggested Connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((user) => (
            <div key={user.id} className="flex items-start space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm truncate">{user.name}</h4>
                  <Button
                    size="sm"
                    variant={followingStatus[user.id] ? "outline" : "default"}
                    onClick={() => handleFollow(user.id)}
                    className="h-6 px-2 text-xs"
                  >
                    {followingStatus[user.id] ? 'Following' : 'Follow'}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-1 mb-1">
                  <Badge variant="secondary" className="text-xs">{user.rank}</Badge>
                  {user.organization && (
                    <span className="text-xs text-muted-foreground truncate">
                      @ {user.organization}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-muted-foreground">
                    {user.impactScore} impact points
                  </span>
                  {user.mutualConnections > 0 && (
                    <span className="text-xs text-muted-foreground">
                      • {user.mutualConnections} mutual
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-1">
                  {user.commonSDGs.slice(0, 3).map((sdg) => (
                    <Badge key={sdg} variant="sdg" sdgNumber={sdg} className="text-xs">
                      {sdg}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="ghost" size="sm" className="w-full mt-4">
          View All Suggestions
        </Button>
      </CardContent>
    </Card>
  );
}