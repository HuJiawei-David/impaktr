// home/ubuntu/impaktrweb/src/app/events/[id]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  Share2,
  Heart,
  Flag,
  Edit3,
  CheckCircle,
  AlertCircle,
  Award,
  Eye,
  MessageCircle,
  UserCheck,
  Navigation,
  Download,
  ExternalLink,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { formatDate, formatTimeAgo, getInitials } from '@/lib/utils';
import { ParticipationDialog } from '@/components/events/ParticipationDialog';
import { EventComments } from '@/components/events/EventComments';
import { ParticipantsList } from '@/components/events/ParticipantsList';
import { EventGallery } from '@/components/events/EventGallery';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    address?: string;
    city: string;
    coordinates?: { lat: number; lng: number };
    isVirtual: boolean;
  };
  maxParticipants?: number;
  currentParticipants: number;
  sdgTags: number[];
  skills: string[];
  intensity: number;
  verificationType: string;
  images: string[];
  creator: {
    id: string;
    name: string;
    avatar: string;
    profile: {
      bio?: string;
      organization?: string;
    };
  };
  organization?: {
    id: string;
    name: string;
    logo: string;
    verified: boolean;
  };
  createdAt: string;
  updatedAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  requiresApproval: boolean;
  customFields?: Array<{
    name: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  participants: Array<{
    id: string;
    user: {
      id: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
    };
    status: string;
    joinedAt: string;
    hoursCommitted: number;
  }>;
  userParticipation?: {
    id: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    hoursCommitted: number;
    hoursActual?: number;
    joinedAt: string;
  };
  isCreator: boolean;
  isSaved: boolean;
  canEdit: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showParticipationDialog, setShowParticipationDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchEvent(params.id as string);
    }
  }, [params?.id, user]);

  const fetchEvent = async (eventId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/events');
          toast.error('Event not found');
          return;
        }
        throw new Error('Failed to fetch event');
      }

      const data = await response.json();
      setEvent(data.event);
      setIsBookmarked(data.event.isSaved);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinEvent = () => {
    if (!user) {
      router.push('/signup');
      return;
    }

    if (event?.requiresApproval || event?.customFields?.length) {
      setShowParticipationDialog(true);
    } else {
      quickJoinEvent();
    }
  };

  const quickJoinEvent = async () => {
    if (!event) return;

    setIsJoining(true);
    try {
      const response = await fetch(`/api/events/${event.id}/participate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoursCommitted: Math.ceil((new Date(event.endDate || event.startDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60)) || 2
        })
      });

      if (!response.ok) {
        throw new Error('Failed to join event');
      }

      toast.success('Successfully joined the event!');
      fetchEvent(event.id); // Refresh event data
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error('Failed to join event. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || !event) return;

    try {
      const response = await fetch(`/api/events/${event.id}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST'
      });

      if (!response.ok) throw new Error('Failed to update bookmark');

      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? 'Event removed from bookmarks' : 'Event bookmarked!');
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: event?.title,
      text: `Join me at "${event?.title}" on Impaktr!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard!');
    }
  };

  const getEventStatus = () => {
    if (!event) return null;

    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : startDate;

    if (event.status === 'CANCELLED') {
      return { label: 'Cancelled', color: 'destructive', icon: AlertCircle };
    }

    if (event.status === 'DRAFT') {
      return { label: 'Draft', color: 'secondary', icon: Eye };
    }

    if (endDate < now) {
      return { label: 'Completed', color: 'success', icon: CheckCircle };
    }

    if (startDate <= now && now <= endDate) {
      return { label: 'In Progress', color: 'warning', icon: Clock };
    }

    return { label: 'Upcoming', color: 'info', icon: Calendar };
  };

  const getIntensityInfo = (intensity: number) => {
    if (intensity <= 0.8) return { label: 'Light', color: 'success', description: 'Suitable for beginners' };
    if (intensity <= 1.0) return { label: 'Medium', color: 'warning', description: 'Standard intensity' };
    return { label: 'High', color: 'destructive', description: 'Physically or mentally demanding' };
  };

  const isEventFull = event?.maxParticipants && event.currentParticipants >= event.maxParticipants;
  const canJoin = user && event && !event.userParticipation && !isEventFull && event.status === 'ACTIVE';
  const eventStatus = getEventStatus();
  const intensityInfo = event ? getIntensityInfo(event.intensity) : null;

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
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-4">This event may have been deleted or moved.</p>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Event Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 md:h-80 bg-gradient-to-r from-primary-100 to-primary-200 overflow-hidden">
          {event.images.length > 0 ? (
            <img
              src={event.images[0]}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-20 h-20 text-primary-300" />
            </div>
          )}
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/20">
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button size="sm" variant="secondary" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              {user && (
                <Button 
                  size="sm" 
                  variant={isBookmarked ? "default" : "secondary"}
                  onClick={handleBookmark}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Title and Basic Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                {eventStatus && (
                  <Badge variant={eventStatus.color as any} className="flex items-center">
                    <eventStatus.icon className="w-3 h-3 mr-1" />
                    {eventStatus.label}
                  </Badge>
                )}
                
                {event.organization?.verified && (
                  <Badge variant="secondary" className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Org
                  </Badge>
                )}
                
                {intensityInfo && (
                  <Badge variant={intensityInfo.color as any}>
                    {intensityInfo.label} Intensity
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>

              {/* Creator/Organization Info */}
              <div className="flex items-center space-x-3 mb-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage 
                    src={event.organization?.logo || event.creator.avatar} 
                    alt={event.organization?.name || event.creator.name}
                  />
                  <AvatarFallback>
                    {getInitials(event.organization?.name || event.creator.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="font-medium">
                    {event.organization?.name || event.creator.name}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    {event.organization ? (
                      <Building2 className="w-3 h-3 mr-1" />
                    ) : (
                      <UserCheck className="w-3 h-3 mr-1" />
                    )}
                    {event.organization ? 'Organization' : 'Individual Organizer'}
                  </div>
                </div>
              </div>

              {/* SDG Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {event.sdgTags.map((sdgNumber) => (
                  <Badge key={sdgNumber} variant="sdg" sdgNumber={sdgNumber}>
                    SDG {sdgNumber}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Event Details Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="participants">
                  Participants ({event.currentParticipants})
                </TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>About This Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {event.description.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Required */}
                {event.skills.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills That Would Help</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {event.skills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* What to Expect */}
                <Card>
                  <CardHeader>
                    <CardTitle>What to Expect</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Duration</div>
                          <div className="text-sm text-muted-foreground">
                            {event.endDate 
                              ? `${Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60))} hours`
                              : '2-3 hours estimated'
                            }
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <Award className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Verification</div>
                          <div className="text-sm text-muted-foreground">
                            {event.verificationType.toLowerCase()} verified
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Star className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Impact Multiplier</div>
                          <div className="text-sm text-muted-foreground">
                            {event.intensity}x intensity
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Download className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Certificate</div>
                          <div className="text-sm text-muted-foreground">
                            Digital certificate provided
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gallery Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Event Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EventGallery 
                      eventId={event.id}
                      canUpload={event.isCreator}
                      isPreview={true}
                      maxPreviewImages={6}
                      showFullGalleryLink={true}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="participants">
                <ParticipantsList 
                  eventId={event.id}
                  isOrganizer={event.isCreator}
                  canManageParticipants={event.isCreator}
                />
              </TabsContent>

              <TabsContent value="comments">
                <EventComments eventId={event.id} />
              </TabsContent>

              <TabsContent value="gallery">
                <EventGallery 
                  eventId={event.id}
                  canUpload={event.isCreator}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Participation Status */}
                  {event.userParticipation ? (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          You're participating!
                        </span>
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        Status: {event.userParticipation.status}
                        <br />
                        Committed: {event.userParticipation.hoursCommitted} hours
                        <br />
                        Joined: {formatTimeAgo(event.userParticipation.joinedAt)}
                      </div>
                    </div>
                  ) : canJoin ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleJoinEvent}
                      disabled={isJoining}
                    >
                      {isJoining ? 'Joining...' : 'Join Event'}
                    </Button>
                  ) : isEventFull ? (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-medium">Event Full</div>
                      <div className="text-sm text-muted-foreground">
                        This event has reached capacity
                      </div>
                    </div>
                  ) : !user ? (
                    <Link href="/signup">
                      <Button className="w-full" size="lg">
                        Sign Up to Join
                      </Button>
                    </Link>
                  ) : null}

                  {/* Edit Button for Creators */}
                  {event.canEdit && (
                    <Link href={`/events/${event.id}/edit`}>
                      <Button variant="outline" className="w-full">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Event
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">
                      {formatDate(event.startDate)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.startDate).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {event.endDate && event.endDate !== event.startDate && (
                        <>
                          {' - '}
                          {new Date(event.endDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">
                      {event.location.isVirtual ? 'Virtual Event' : event.location.city}
                    </div>
                    {event.location.address && (
                      <div className="text-sm text-muted-foreground">
                        {event.location.address}
                      </div>
                    )}
                    {event.location.coordinates && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto mt-1"
                        onClick={() => {
                          const { lat, lng } = event.location.coordinates!;
                          window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
                        }}
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Get Directions
                      </Button>
                    )}
                  </div>
                </div>

                {/* Participants */}
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {event.currentParticipants} participants
                      {event.maxParticipants && ` / ${event.maxParticipants}`}
                    </div>
                    {event.maxParticipants && (
                      <Progress 
                        value={(event.currentParticipants / event.maxParticipants) * 100} 
                        className="mt-2 h-2"
                      />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Created */}
                <div className="text-sm text-muted-foreground">
                  Created {formatTimeAgo(event.createdAt)}
                  {event.updatedAt !== event.createdAt && (
                    <>
                      <br />
                      Updated {formatTimeAgo(event.updatedAt)}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Report Event */}
            <Card>
              <CardContent className="p-4">
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                  <Flag className="w-4 h-4 mr-2" />
                  Report Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Participation Dialog */}
        {showParticipationDialog && (
          <ParticipationDialog
            event={event}
            onParticipationUpdate={() => {
              setShowParticipationDialog(false);
              fetchEvent(event.id);
            }}
          />
        )}
      </div>
    </div>
  );
}