'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  Share2
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  organizer: string;
  type: 'Workshop' | 'Networking' | 'Event' | 'Volunteer' | 'Fundraiser' | 'Cleanup';
}

interface UpcomingEventsWidgetProps {
  events?: Event[];
}

export function UpcomingEventsWidget({ events }: UpcomingEventsWidgetProps) {
  // Mock data - in real app, this would come from props or API
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'My Sustainability Workshop',
      date: 'Next Saturday, 2:00 PM',
      location: 'Local Community Center',
      attendees: 1,
      organizer: 'You',
      type: 'Workshop'
    },
    {
      id: '2',
      title: 'Community Garden Workshop',
      date: 'Tomorrow, 10:00 AM',
      location: 'Green Valley Park',
      attendees: 45,
      organizer: 'Environmental Action Network',
      type: 'Workshop'
    },
    {
      id: '3',
      title: 'Career Mentorship Meetup',
      date: 'Friday, 6:00 PM',
      location: 'Downtown Library',
      attendees: 28,
      organizer: 'Youth Mentorship Circle',
      type: 'Networking'
    },
    {
      id: '4',
      title: 'Health & Wellness Fair',
      date: 'Saturday, 9:00 AM',
      location: 'Community Center',
      attendees: 120,
      organizer: 'Community Health Champions',
      type: 'Event'
    }
  ];

  const displayEvents = events || mockEvents;

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Workshop':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Networking':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Event':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Volunteer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Fundraiser':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Cleanup':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 dark:text-white">Upcoming Events</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayEvents.map((event) => (
          <div key={event.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent border-l-4 border-l-blue-500 cursor-pointer group hover:shadow-md transition-all">
            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
              {event.title}
            </h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-3 h-3" />
                <span>{event.attendees} attending</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>
                {event.type}
              </Badge>
              <div className="flex space-x-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
          >
            View All Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
