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
  Building2,
  Target,
  Zap,
  X
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
  registrationDeadline?: string;
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
  status: 'DRAFT' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
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
      console.log('Fetching event:', eventId);
      const response = await fetch(`/api/events/${eventId}`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        if (response.status === 404) {
          router.push('/events');
          toast.error('Event not found');
          return;
        }
        throw new Error('Failed to fetch event');
      }

      const data = await response.json();
      
      // Transform the API response to match our Event interface
      const rawEvent = data.event;
      const locationData = typeof rawEvent.location === 'string' 
        ? JSON.parse(rawEvent.location) 
        : rawEvent.location;
      
      const sdgData = rawEvent.sdg 
        ? (typeof rawEvent.sdg === 'string' ? JSON.parse(rawEvent.sdg) : rawEvent.sdg)
        : [];

      const transformedEvent: Event = {
        ...rawEvent,
        location: {
          address: locationData.address,
          city: locationData.city,
          coordinates: locationData.coordinates,
          isVirtual: locationData.isVirtual || false
        },
        sdgTags: Array.isArray(sdgData) ? sdgData : [],
        images: rawEvent.imageUrl ? [rawEvent.imageUrl] : [],
        creator: rawEvent.organization ? {
          id: rawEvent.organization.id,
          name: rawEvent.organization.name,
          avatar: rawEvent.organization.logo || '',
          profile: {
            bio: rawEvent.organization.description,
            organization: rawEvent.organization.name
          }
        } : {
          id: 'unknown',
          name: 'Unknown',
          avatar: '',
          profile: {}
        },
        participants: rawEvent.participations?.map((p: any) => ({
          id: p.id,
          user: {
            id: p.user?.id || '',
            profile: {
              firstName: p.user?.firstName || p.user?.name?.split(' ')[0] || 'Anonymous',
              lastName: p.user?.lastName || p.user?.name?.split(' ').slice(1).join(' ') || '',
              avatar: p.user?.image
            }
          },
          status: p.status,
          joinedAt: p.joinedAt
        })) || [],
        isCreator: user?.id === rawEvent.organizerId,
        isSaved: false,
        canEdit: user?.id === rawEvent.organizerId
      };
      
      setEvent(transformedEvent);
      setIsBookmarked(rawEvent.isBookmarked || false);
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

  const getVerificationTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      // Official Prisma types
      'SELF': 'Self Reported',
      'ORGANIZER': 'Organizer Verified', 
      'PEER': 'Peer Verified',
      'GPS': 'Location Verified',
      
      // Additional types used in practice
      'PHOTO': 'Photo Proof',
      'CHECK_IN': 'On-Site Verified',
      'ATTENDANCE': 'Attendance Tracking',
      'AUTOMATIC': 'Automatic'
    };
    const displayText = types[type] || 'Organizer Verified';
    return displayText.charAt(0).toUpperCase() + displayText.slice(1);
  };

  const isEventFull = event?.maxParticipants && event.currentParticipants >= event.maxParticipants;
  const isRegistrationClosed = event?.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const isEventCompleted = event?.status === 'COMPLETED' || (event?.endDate && new Date(event.endDate) < new Date());
  const isEventUpcoming = event?.status === 'UPCOMING';
  const canJoin = user && event && !event.userParticipation && !isEventFull && !isRegistrationClosed && !isEventCompleted && (event.status === 'ACTIVE' || isEventUpcoming);
  const eventStatus = getEventStatus();
  const intensityInfo = event ? getIntensityInfo(event.intensity) : null;

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
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-4">This event may have been deleted or moved.</p>
          <Link href="/events">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-4 py-2">
              Browse Events
            </Button>
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
          {event.images && event.images.length > 0 ? (
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
              <Button 
                size="sm" 
                onClick={handleShare} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-4 py-2"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              {user && (
                <Button 
                  size="sm" 
                  onClick={handleBookmark}
                  className={`px-4 py-2 ${
                    isBookmarked 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0'
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Title and Basic Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                {eventStatus && (
                  <Badge variant={eventStatus.color as "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "sdg"} className="flex items-center">
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
                  <Badge variant={intensityInfo.color as "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "sdg"}>
                    {intensityInfo.label} Intensity
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>

              {/* Creator/Organization Info */}
              {event.organization ? (
                <Link href={`/organizations/${event.organization.id}`} className="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={event.organization.logo} 
                      alt={event.organization.name}
                    />
                    <AvatarFallback>
                      {getInitials(event.organization.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium text-blue-600 dark:text-blue-400">
                      {event.organization.name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Building2 className="w-3 h-3 mr-1" />
                      Organization • Click to view profile
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center space-x-3 mb-6">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={event.creator.avatar} 
                      alt={event.creator.name}
                    />
                    <AvatarFallback>
                      {getInitials(event.creator.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium">
                      {event.creator.name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Individual Organizer
                    </div>
                  </div>
                </div>
              )}

              {/* SDG Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {event.sdgTags.map((sdgNumber) => (
                  <Badge key={sdgNumber} variant="sdg" sdgNumber={sdgNumber}>
                    SDG {sdgNumber}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Event Details Pills Navigation */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                    activeTab === 'overview' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                      : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                    activeTab === 'participants' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                      : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                  }`}
                >
                  Participants ({event.currentParticipants})
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                    activeTab === 'comments' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                      : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                  }`}
                >
                  Comments
                </button>
                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                    activeTab === 'gallery' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                      : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                  }`}
                >
                  Gallery
                </button>
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
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
                            {getVerificationTypeDisplay(event.verificationType || 'ORGANIZER')}
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
              </div>
            )}

            {activeTab === 'participants' && (
              <ParticipantsList 
                eventId={event.id}
                isOrganizer={event.isCreator}
                canManageParticipants={event.isCreator}
              />
            )}

            {activeTab === 'comments' && (
              <EventComments eventId={event.id} />
            )}

            {activeTab === 'gallery' && (
              <EventGallery 
                eventId={event.id}
                canUpload={event.isCreator}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Deadline Info */}
            {event.registrationDeadline && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Register by:</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(event.registrationDeadline)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  ) : isEventCompleted ? (
                    <div className="text-center p-4 bg-muted rounded-lg border-2 border-gray-300 dark:border-gray-700">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                      <div className="font-medium text-gray-700 dark:text-gray-300">Event Ended</div>
                      <div className="text-sm text-muted-foreground">
                        This event has been completed
                      </div>
                    </div>
                  ) : isRegistrationClosed ? (
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                      <X className="w-8 h-8 mx-auto mb-2 text-red-600 dark:text-red-400" />
                      <div className="font-medium text-red-700 dark:text-red-300">Registration Closed</div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Registration deadline has passed
                      </div>
                    </div>
                  ) : isEventFull ? (
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
                      <Users className="w-8 h-8 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
                      <div className="font-medium text-yellow-700 dark:text-yellow-300">Event Full</div>
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        This event has reached capacity
                      </div>
                    </div>
                  ) : canJoin ? (
                    <div className="space-y-4">
                      <Link href={`/events/${event.id}/register`}>
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0" 
                          size="lg"
                        >
                          Register for Event
                        </Button>
                      </Link>
                    </div>
                  ) : !user ? (
                    <Link href={`/signin?callbackUrl=/events/${event.id}/register`}>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0" size="lg">
                        Sign In to Register
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

            {/* Impact Scoring Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Impact Scoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scoring Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Intensity Multiplier */}
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center space-x-2 mb-1">
                      <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Intensity Multiplier</p>
                    </div>
                    <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{event.intensity || 1.0}x</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      {event.intensity && event.intensity > 1.0 ? 'High Impact' : event.intensity && event.intensity < 1.0 ? 'Standard Impact' : 'Normal Impact'}
                    </p>
                  </div>

                  {/* Estimated Hours per Participant */}
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Est. Hours/Participant</p>
                    </div>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                      {event.type === 'WORKSHOP' ? '2-4' : event.type === 'FUNDRAISER' ? '3-6' : '2-3'} hrs
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Based on event type</p>
                  </div>

                  {/* Skill Impact Multiplier */}
                  <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2 mb-1">
                      <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <p className="text-xs font-medium text-green-700 dark:text-green-300">Skills Required</p>
                    </div>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100">+{((event.skills?.length || 0) * 10).toFixed(0)}%</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {event.skills?.length || 0} skill{event.skills?.length !== 1 ? 's' : ''} boost
                    </p>
                  </div>

                  {/* Verification Type */}
                  <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center space-x-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Verification Type</p>
                    </div>
                    <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                      {event.verificationType === 'ORGANIZER' ? '+10%' : '+0%'}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      {getVerificationTypeDisplay(event.verificationType || 'ORGANIZER')}
                    </p>
                  </div>
                </div>

                {/* Potential Impact Score Calculation */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                        Potential Impact Score (per participant)
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">
                        Formula: Base Hours × Intensity × Skills × Verification × Location
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        {(
                          (event.type === 'WORKSHOP' ? 3 : event.type === 'FUNDRAISER' ? 4 : 2.5) *
                          (event.intensity || 1.0) *
                          (1 + (event.skills?.length || 0) * 0.1) *
                          (event.verificationType === 'ORGANIZER' ? 1.1 : 1.0) *
                          10
                        ).toFixed(1)}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">points</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Event */}
            <Card>
              <CardContent className="p-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-muted-foreground hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white border-0 py-3"
                >
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