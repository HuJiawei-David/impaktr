// home/ubuntu/impaktrweb/src/components/dashboard/UpcomingEvents.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Bell,
  ChevronRight,
  Plus,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate, formatTimeAgo, getInitials } from '@/lib/utils';
import Link from 'next/link';

interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    city: string;
    address?: string;
    isVirtual: boolean;
  };
  sdgTags: number[];
  organizer: {
    name: string;
    avatar?: string;
  };
  participationStatus: 'registered' | 'pending' | 'confirmed' | 'waitlisted';
  reminderSet: boolean;
  estimatedHours: number;
  maxParticipants?: number;
  currentParticipants: number;
  requirements: string[];
  isToday: boolean;
  isTomorrow: boolean;
  daysUntil: number;
}

interface EventReminder {
  eventId: string;
  type: 'today' | 'tomorrow' | 'week' | 'preparation';
  message: string;
  urgent: boolean;
}

export function UpcomingEvents() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchUpcomingEvents();
    fetchReminders();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await fetch('/api/users/events/upcoming');
      // const data = await response.json();
      
      // Mock data for demonstration
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      const mockEvents: UpcomingEvent[] = [
        {
          id: 'event-1',
          title: 'Beach Cleanup Drive',
          description: 'Join us for a morning beach cleanup at Marina Bay to protect marine life',
          startDate: tomorrow.toISOString(),
          location: {
            city: 'Singapore',
            address: 'Marina Bay Sands Beach',
            isVirtual: false
          },
          sdgTags: [13, 14],
          organizer: {
            name: 'Ocean Conservation SG',
            avatar: '/orgs/ocean-sg.png'
          },
          participationStatus: 'confirmed',
          reminderSet: true,
          estimatedHours: 3,
          maxParticipants: 50,
          currentParticipants: 23,
          requirements: ['Comfortable walking shoes', 'Water bottle', 'Sun protection'],
          isToday: false,
          isTomorrow: true,
          daysUntil: 1
        },
        {
          id: 'event-2',
          title: 'Food Distribution to Homeless',
          description: 'Help distribute meals to homeless individuals in the community',
          startDate: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
          location: {
            city: 'Kuala Lumpur',
            address: 'Central Market Area',
            isVirtual: false
          },
          sdgTags: [1, 2],
          organizer: {
            name: 'KL Community Kitchen',
            avatar: '/orgs/kl-kitchen.png'
          },
          participationStatus: 'confirmed',
          reminderSet: false,
          estimatedHours: 4,
          currentParticipants: 12,
          requirements: ['Apron or old clothes', 'Hand sanitizer'],
          isToday: true,
          isTomorrow: false,
          daysUntil: 0
        },
        {
          id: 'event-3',
          title: 'Virtual Climate Action Workshop',
          description: 'Learn about climate change and sustainable living practices',
          startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          location: {
            city: 'Virtual',
            isVirtual: true
          },
          sdgTags: [13, 7],
          organizer: {
            name: 'Green Future Malaysia',
            avatar: '/orgs/green-future.png'
          },
          participationStatus: 'registered',
          reminderSet: true,
          estimatedHours: 2,
          maxParticipants: 100,
          currentParticipants: 67,
          requirements: ['Laptop/tablet', 'Note-taking materials'],
          isToday: false,
          isTomorrow: false,
          daysUntil: 3
        },
        {
          id: 'event-4',
          title: 'Math Tutoring Session',
          description: 'Help underprivileged students with mathematics homework',
          startDate: nextWeek.toISOString(),
          location: {
            city: 'Petaling Jaya',
            address: 'Community Learning Center',
            isVirtual: false
          },
          sdgTags: [4],
          organizer: {
            name: 'Education for All MY',
            avatar: '/orgs/education-all.png'
          },
          participationStatus: 'pending',
          reminderSet: false,
          estimatedHours: 2,
          maxParticipants: 10,
          currentParticipants: 4,
          requirements: ['Basic math knowledge', 'Patience with children'],
          isToday: false,
          isTomorrow: false,
          daysUntil: 7
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReminders = async () => {
    // Mock reminders
    const mockReminders: EventReminder[] = [
      {
        eventId: 'event-1',
        type: 'tomorrow',
        message: 'Beach Cleanup Drive starts tomorrow at 9:00 AM',
        urgent: true
      },
      {
        eventId: 'event-2',
        type: 'today',
        message: 'Food Distribution starts in 6 hours - don\'t forget your apron!',
        urgent: true
      }
    ];

    setReminders(mockReminders);
  };

  const handleSetReminder = async (eventId: string) => {
    try {
      // API call to set reminder
      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, reminderSet: true } : event
      ));
    } catch (error) {
      console.error('Error setting reminder:', error);
    }
  };

  const handleCancelParticipation = async (eventId: string) => {
    try {
      // API call to cancel participation
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error cancelling participation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'registered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'waitlisted': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeUntilEvent = (startDate: string) => {
    const now = new Date();
    const eventDate = new Date(startDate);
    const diffInHours = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60));
      return `in ${diffInMinutes} minutes`;
    } else if (diffInHours < 24) {
      return `in ${diffInHours} hours`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    }
  };

  const displayEvents = showAll ? events : events.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Upcoming Events
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Link href="/events">
              <Button variant="ghost" size="sm">
                Find More
                <Plus className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Urgent Reminders */}
        {reminders.filter(r => r.urgent).length > 0 && (
          <div className="space-y-2">
            {reminders.filter(r => r.urgent).map((reminder) => (
              <Alert key={reminder.eventId} className="border-orange-200 bg-orange-50">
                <Bell className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {reminder.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No upcoming events</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Join some events to see them here
            </p>
            <Link href="/events">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Browse Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayEvents.map((event) => (
              <div
                key={event.id}
                className={`relative p-4 border rounded-lg hover:shadow-sm transition-all ${
                  event.isToday ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20' :
                  event.isTomorrow ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' : 
                  ''
                }`}
              >
                {/* Urgent Today Badge */}
                {event.isToday && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-orange-500 text-white">Today</Badge>
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  {/* Organizer Avatar */}
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={event.organizer.avatar} alt={event.organizer.name} />
                    <AvatarFallback>
                      {getInitials(event.organizer.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1 line-clamp-1">
                          {event.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span>
                          {formatDate(event.startDate)} • {getTimeUntilEvent(event.startDate)}
                        </span>
                      </div>

                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {event.location.isVirtual 
                            ? 'Virtual Event' 
                            : `${event.location.city}${event.location.address ? `, ${event.location.address}` : ''}`
                          }
                        </span>
                      </div>

                      {event.maxParticipants && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span>
                            {event.currentParticipants}/{event.maxParticipants} participants
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {/* SDG Tags */}
                        {event.sdgTags.slice(0, 2).map((sdgNumber) => (
                          <Badge key={sdgNumber} variant="sdg" sdgNumber={sdgNumber} className="text-xs">
                            SDG {sdgNumber}
                          </Badge>
                        ))}
                        {event.sdgTags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{event.sdgTags.length - 2}
                          </Badge>
                        )}

                        {/* Status */}
                        <Badge className={`text-xs border ${getStatusColor(event.participationStatus)}`}>
                          {event.participationStatus.charAt(0).toUpperCase() + event.participationStatus.slice(1)}
                        </Badge>
                      </div>

                      {/* Estimated Hours */}
                      <div className="text-xs text-muted-foreground">
                        ~{event.estimatedHours}h
                      </div>
                    </div>

                    {/* Requirements */}
                    {event.requirements.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-1">
                          Requirements:
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.requirements.slice(0, 2).join(' • ')}
                          {event.requirements.length > 2 && ` • +${event.requirements.length - 2} more`}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-center space-x-2">
                        {!event.reminderSet && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetReminder(event.id)}
                            className="text-xs h-7"
                          >
                            <Bell className="w-3 h-3 mr-1" />
                            Set Reminder
                          </Button>
                        )}
                        
                        {event.reminderSet && (
                          <div className="flex items-center text-xs text-green-600">
                            <Check className="w-3 h-3 mr-1" />
                            Reminder Set
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelParticipation(event.id)}
                          className="text-xs h-7 text-destructive hover:text-destructive"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        
                        <Link href={`/events/${event.id}`}>
                          <Button size="sm" className="text-xs h-7">
                            View Details
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Show More Button */}
            {events.length > 3 && (
              <div className="text-center pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show Less' : `Show All ${events.length} Events`}
                  <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showAll ? 'rotate-90' : ''}`} />
                </Button>
              </div>
            )}

            {/* Summary */}
            {events.length > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    This week:
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-muted-foreground">
                      {events.length} events
                    </span>
                    <span className="font-medium">
                      ~{events.reduce((sum, event) => sum + event.estimatedHours, 0)} impact hours
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}