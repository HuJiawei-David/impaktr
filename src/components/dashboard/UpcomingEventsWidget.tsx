'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string | object;
  imageUrl?: string;
  organization?: {
    id: string;
    name: string;
    logo?: string;
  };
  currentParticipants: number;
  maxParticipants?: number;
  status: string;
  sdg?: string | number | number[];
}

// Utility functions for event formatting
const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const formatEventTimeRange = (startDate: string, endDate?: string) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  const startTime = start.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (end && end.getTime() !== start.getTime()) {
    const endTime = end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${startTime} - ${endTime}`;
  }
  
  return startTime;
};

export function UpcomingEventsWidget() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch('/api/events?limit=6&status=UPCOMING');
      const data = await response.json();
      
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayEvents = events.slice(0, 3);

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-gray-800">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-blue-600" />
          Upcoming Events
        </CardTitle>
      </CardHeader>

      <CardContent className="relative pt-2 pb-4 px-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                <div className="flex gap-3 items-start">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayEvents.length > 0 ? (
          <div className="space-y-4">
            {displayEvents.map((event) => (
              <Link 
                key={event.id} 
                href={`/events/${event.id}`}
                className="block group"
              >
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      {/* Date at the top */}
                      <div className="mb-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full w-fit">
                          <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            {formatEventDate(event.startDate)}
                          </span>
                        </div>
                      </div>
                  
                  {/* Thumbnail and Title on one line */}
                  <div className="flex gap-3 items-start mb-2">
                    {/* Event Thumbnail */}
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600">
                      {event.imageUrl ? (
                        <Image 
                          src={event.imageUrl} 
                          alt={event.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Event Title and Location */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {(() => {
                            let locationData;
                            if (typeof event.location === 'string') {
                              try {
                                locationData = JSON.parse(event.location);
                              } catch (e) {
                                locationData = {
                                  address: event.location,
                                  city: 'Unknown',
                                  country: 'Unknown',
                                  isVirtual: false
                                };
                              }
                            } else {
                              locationData = event.location;
                            }
                            return locationData.isVirtual ? 'Online' : `${locationData.city}, ${locationData.country}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            <div className="pt-2">
              <Link href="/events">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  View All Events
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No upcoming events
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}