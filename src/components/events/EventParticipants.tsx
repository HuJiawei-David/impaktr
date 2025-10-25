'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  Search, 
  MessageSquare,
  UserPlus,
  MapPin,
  Award,
  Clock,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Participant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    profile: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      avatar?: string;
      occupation?: string;
      organization?: string;
      location?: {
        city: string;
        country: string;
      };
    };
    impaktrScore: number;
    currentRank: string;
  };
  hoursCommitted: number;
  createdAt: string;
  connectionStatus?: 'none' | 'pending' | 'connected';
}

interface EventParticipantsProps {
  eventId: string;
}

export function EventParticipants({ eventId }: EventParticipantsProps) {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStates, setConnectionStates] = useState<Record<string, 'none' | 'pending' | 'connected'>>({});

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchTerm]);

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants`);
      if (response.ok) {
        const data = await response.json();
        // API already filters to show only verified participants for non-organizers
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Failed to load participants');
    } finally {
      setIsLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = [...participants];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user.profile?.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user.profile?.occupation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by join date (most recent first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredParticipants(filtered);
  };

  const handleConnect = async (participantId: string) => {
    try {
      const response = await fetch(`/api/users/${participantId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setConnectionStates(prev => ({
          ...prev,
          [participantId]: 'pending'
        }));
        toast.success('Connection request sent!');
      } else {
        throw new Error('Failed to send connection request');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const handleMessage = (participantId: string) => {
    // Navigate to messages with this user
    window.location.href = `/messages?user=${participantId}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Fellow Participants ({participants.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Connect and collaborate with other volunteers
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search participants by name, organization, or occupation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      <div className="space-y-4">
        {filteredParticipants.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No participants found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No participants match your search for "${searchTerm}"`
                  : 'No participants have joined this event yet'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredParticipants.map((participant) => (
              <Card key={participant.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Participant Info */}
                    <div className="flex items-center space-x-4">
                      <Link href={`/profile/${participant.user.id}`}>
                        <Avatar className="w-14 h-14 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                          <AvatarImage 
                            src={participant.user.image || participant.user.profile?.avatar} 
                            alt={participant.user.name} 
                          />
                          <AvatarFallback className="text-lg">
                            {getInitials(participant.user.name)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Link href={`/profile/${participant.user.id}`}>
                            <h3 className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                              {participant.user.name}
                            </h3>
                          </Link>
                          {participant.user.currentRank && (
                            <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 px-3 py-1.5">
                              {participant.user.currentRank}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {participant.user.profile?.occupation && (
                            <div className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              <span>{participant.user.profile.occupation}</span>
                            </div>
                          )}
                          {participant.user.profile?.organization && (
                            <span>• {participant.user.profile.organization}</span>
                          )}
                          {participant.user.profile?.location && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{participant.user.profile.location.city}, {participant.user.profile.location.country}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Committed: {participant.hoursCommitted}h</span>
                          </div>
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            <span>Score: {participant.user.impaktrScore.toFixed(1)}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Joined {formatTimeAgo(participant.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {connectionStates[participant.user.id] !== 'connected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(participant.user.id)}
                          className="flex items-center h-10 px-4"
                          disabled={connectionStates[participant.user.id] === 'pending'}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {connectionStates[participant.user.id] === 'pending' ? 'Pending' : 'Connect'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleMessage(participant.user.id)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-10 px-4"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
