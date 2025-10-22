// /home/ubuntu/impaktrweb/src/app/events/[id]/gallery/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users, Share2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
        <LoadingSpinner size="lg" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Event Button and Share Button */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/events/${event.id}`} className="inline-block">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Button>
          </Link>
          
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Gallery
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
            </div>

            {/* Gallery */}
            <Card>
              <CardContent className="pt-6">
                <EventGallery 
                  eventId={eventId || ''}
                  canUpload={event.isCreator}
                  isPreview={false}
                  showFullGalleryLink={false}
                />
              </CardContent>
            </Card>
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
                    {event.status === 'ACTIVE' ? 'Active' : event.status === 'DRAFT' ? 'Draft' : event.status === 'COMPLETED' ? 'Completed' : event.status === 'CANCELLED' ? 'Cancelled' : event.status}
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
                    {event.creator?.avatar ? (
                      <img 
                        src={event.creator.avatar} 
                        alt={event.creator.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {event.creator?.name?.split(' ').map(n => n[0]).join('') || 'E'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{event.creator?.name || 'Event Organizer'}</div>
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
