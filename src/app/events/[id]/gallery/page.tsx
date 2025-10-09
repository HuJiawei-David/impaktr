// /home/ubuntu/impaktrweb/src/app/events/[id]/gallery/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventGallery } from '@/components/events/EventGallery';
import { formatDate } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    address?: string;
    city: string;
    isVirtual: boolean;
  };
  currentParticipants: number;
  maxParticipants?: number;
  status: string;
  isCreator: boolean;
  creator: {
    name: string;
    avatar?: string;
  };
  organization?: {
    name: string;
    logo?: string;
  };
}

interface EventGalleryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EventGalleryPage({ params }: EventGalleryPageProps) {
  const { data: session } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setEventId(p.id));
  }, [params]);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data.event);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event?.title} - Event Gallery`,
          text: `Check out photos from ${event?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Button asChild>
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/events/${event.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event
              </Link>
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <p className="text-muted-foreground">Event Gallery</p>
            </div>
          </div>

          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Gallery
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Gallery */}
          <div className="lg:col-span-3">
            <EventGallery 
              eventId={eventId || ''}
              canUpload={event.isCreator}
              isPreview={false}
              showFullGalleryLink={false}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">{formatDate(event.startDate)}</div>
                    {event.endDate && (
                      <div className="text-sm text-muted-foreground">
                        to {formatDate(event.endDate)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">
                      {event.location.isVirtual ? 'Virtual Event' : event.location.city}
                    </div>
                    {event.location.address && !event.location.isVirtual && (
                      <div className="text-sm text-muted-foreground">
                        {event.location.address}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {event.currentParticipants} participants
                    </div>
                    {event.maxParticipants && (
                      <div className="text-sm text-muted-foreground">
                        of {event.maxParticipants} max
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Badge 
                    variant={event.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {event.status.toLowerCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Organizer */}
            <Card>
              <CardHeader>
                <CardTitle>Organized by</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {event.creator.avatar ? (
                      <img 
                        src={event.creator.avatar} 
                        alt={event.creator.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {event.creator.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{event.creator.name}</div>
                    {event.organization && (
                      <div className="text-sm text-muted-foreground">
                        {event.organization.name}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-6">
                  {event.description}
                </p>
                <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto" asChild>
                  <Link href={`/events/${event.id}`}>
                    View full event details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
