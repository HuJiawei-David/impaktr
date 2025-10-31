'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  location: {
    city: string;
    isVirtual: boolean;
  };
  maxParticipants?: number;
  currentParticipants: number;
  requiresApproval: boolean;
  organization?: {
    id: string;
    name: string;
    logo?: string;
  };
}

export default function EventRegisterPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoursCommitted, setHoursCommitted] = useState<number>(2);
  const [motivation, setMotivation] = useState('');
  const [skills, setSkills] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/signin?callbackUrl=/events/${eventId}/register`);
      return;
    }

    if (status === 'authenticated') {
      fetchEvent();
    }
  }, [status, eventId]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }

      const data = await response.json();
      const rawEvent = data.event;
      
      const locationData = typeof rawEvent.location === 'string' 
        ? JSON.parse(rawEvent.location) 
        : rawEvent.location;

      setEvent({
        ...rawEvent,
        location: {
          city: locationData.city,
          isVirtual: locationData.isVirtual || false
        }
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
      router.push('/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event || !user) return;

    // Validate registration deadline
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      toast.error('Registration deadline has passed');
      return;
    }

    // Validate event capacity
    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      toast.error('Event is full');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${event.id}/participate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoursCommitted,
          motivation: motivation.trim() || undefined,
          skills: skills.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Failed to register for event';
        console.error('Registration error:', errorData);
        throw new Error(errorMessage);
      }

      toast.success(
        event.requiresApproval 
          ? 'Registration submitted! Awaiting approval.' 
          : 'Successfully registered for the event!'
      );
      
      // Redirect to event detail page to show progress bar
      router.push(`/events/${event.id}`);
    } catch (error) {
      console.error('Error registering for event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register for event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const estimatedHours = event.endDate 
    ? Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60))
    : 2;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href={`/events/${event.id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Register for Event</CardTitle>
                {event.requiresApproval && (
                  <Badge variant="warning" className="w-fit">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Requires Approval
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Hours Committed */}
                  <div>
                    <Label htmlFor="hours">Hours You Can Commit *</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="1"
                      max="168"
                      value={hoursCommitted}
                      onChange={(e) => setHoursCommitted(parseInt(e.target.value))}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated: {estimatedHours} hours
                    </p>
                  </div>

                  {/* Motivation */}
                  <div>
                    <Label htmlFor="motivation">
                      Why do you want to join? {event.requiresApproval && '*'}
                    </Label>
                    <Textarea
                      id="motivation"
                      rows={4}
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      placeholder="Share your motivation for joining this event..."
                      required={event.requiresApproval}
                    />
                  </div>

                  {/* Relevant Skills */}
                  <div>
                    <Label htmlFor="skills">Relevant Skills (Optional)</Label>
                    <Textarea
                      id="skills"
                      rows={3}
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="List any relevant skills or experience..."
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    size="lg"
                  >
                    {isSubmitting ? (
                      'Submitting...'
                    ) : event.requiresApproval ? (
                      'Submit Application'
                    ) : (
                      'Confirm Registration'
                    )}
                  </Button>

                  {event.requiresApproval && (
                    <p className="text-sm text-muted-foreground text-center">
                      Your application will be reviewed by the event organizers
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Event Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{event.title}</h3>
                  {event.organization && (
                    <p className="text-sm text-muted-foreground">
                      by {event.organization.name}
                    </p>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{formatDate(event.startDate)}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div>{event.location.isVirtual ? 'Virtual Event' : event.location.city}</div>
                    </div>
                  </div>

                  {event.registrationDeadline && (
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-orange-500 mt-0.5" />
                      <div>
                        <div className="text-orange-600 dark:text-orange-400 font-medium">
                          Register by {formatDate(event.registrationDeadline)}
                        </div>
                      </div>
                    </div>
                  )}

                  {event.maxParticipants && (
                    <div className="flex items-start space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div>
                          {event.currentParticipants} / {event.maxParticipants} participants
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

