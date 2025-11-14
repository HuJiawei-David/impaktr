// home/ubuntu/impaktrweb/src/app/events/[id]/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
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
  X,
  QrCode
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import { formatDate, formatTimeAgo, getInitials } from '@/lib/utils';
import { ParticipationDialog } from '@/components/events/ParticipationDialog';
import { EventComments } from '@/components/events/EventComments';
import { ParticipantsList } from '@/components/events/ParticipantsList';
import { EventParticipants } from '@/components/events/EventParticipants';
import { EventGallery } from '@/components/events/EventGallery';
import { AttendanceDialog } from '@/components/events/AttendanceDialog';
import { GroupChatDialog } from '@/components/messages/GroupChatDialog';
import Link from 'next/link';
import { getSDGById } from '@/constants/sdgs';
import { useConfirmDialog } from '@/components/ui/simple-confirm-dialog';

const getOrganizationTypeDisplay = (type?: string | null) => {
  if (!type) return 'Organization';
  
  const typeMap: Record<string, string> = {
    'NGO': 'Non-Profit Organization',
    'COMPANY': 'Company',
    'CORPORATE': 'Company',
    'SCHOOL': 'Educational Institution',
    'HEALTHCARE': 'Healthcare Organization',
    'REGISTERED': 'Registered',
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  type: string;
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
  estimatedScoreRange?: {
    minScore: number;
    maxScore: number;
    typicalScore: number;
    hoursRange: { min: number; max: number; typical: number };
  };
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
    logo: string | null;
    industry?: string | null;
    type?: string | null;
    tier?: string;
    verified?: boolean; // Computed field based on tier
  };
  createdAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  requiresApproval: boolean;
  totalHours?: number;
  sessions?: Array<{
    id?: string;
    label?: string | null;
    startAt: string;
    endAt: string;
    breakMin?: number | null;
  }>;
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
    status: 'REGISTERED' | 'PENDING' | 'CONFIRMED' | 'ATTENDED' | 'CANCELLED' | 'VERIFIED' | 'REJECTED';
    hoursCommitted: number;
    hoursActual?: number;
    joinedAt: string;
  };
  isCreator: boolean;
  isSaved: boolean;
  canEdit: boolean;
  attendanceEnabled?: boolean;
  attendanceEnabledAt?: string | null;
  attendanceDisabledAt?: string | null;
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
  const [commentCount, setCommentCount] = useState(0);
  const [galleryCount, setGalleryCount] = useState(0);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showGroupChatDialog, setShowGroupChatDialog] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  
  // Confirm dialog for canceling registration
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  const fetchEvent = useCallback(async (eventId: string) => {
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
      
      let locationData;
      if (typeof rawEvent.location === 'string') {
        try {
          locationData = JSON.parse(rawEvent.location);
        } catch (e) {
          // If parsing fails, treat as a simple address string
          locationData = {
            address: rawEvent.location,
            city: 'Unknown',
            coordinates: undefined,
            isVirtual: false
          };
        }
      } else {
        locationData = rawEvent.location;
      }
      
      let sdgData;
      if (rawEvent.sdg) {
        if (typeof rawEvent.sdg === 'string') {
          try {
            sdgData = JSON.parse(rawEvent.sdg);
          } catch (e) {
            // If parsing fails, treat as a single SDG number
            const parsed = parseInt(rawEvent.sdg);
            sdgData = isNaN(parsed) ? [] : [parsed];
          }
        } else if (typeof rawEvent.sdg === 'number') {
          sdgData = [rawEvent.sdg];
        } else {
          sdgData = rawEvent.sdg;
        }
      } else {
        sdgData = [];
      }

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
        estimatedScoreRange: rawEvent.estimatedScoreRange, // Explicit assignment for type safety
        organization: rawEvent.organization ? {
          ...rawEvent.organization,
          // Compute verified status based on tier (PROFESSIONAL and above are considered verified)
          verified: rawEvent.organization.tier && ['PROFESSIONAL', 'ENTERPRISE', 'IMPACT_LEADER'].includes(rawEvent.organization.tier)
        } : undefined,
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
        participants: rawEvent.participations?.map((p: { id: string; user?: { id?: string; name?: string; firstName?: string; lastName?: string; image?: string }; status?: string; hours?: number; createdAt?: string; joinedAt?: string }) => {
          // Parse firstName from name if firstName is not available
          // First name is all parts except the last one (e.g., "Li Yuan" from "Li Yuan Peng")
          let firstName = p.user?.firstName;
          if (!firstName && p.user?.name) {
            const parts = p.user.name.trim().split(/\s+/);
            if (parts.length > 1) {
              firstName = parts.slice(0, -1).join(' ') || 'Anonymous';
            } else {
              firstName = parts[0] || 'Anonymous';
            }
          }
          firstName = firstName || 'Anonymous';

          // Parse lastName from name if lastName is not available
          // Last name is the last part (e.g., "Peng" from "Li Yuan Peng")
          let lastName = p.user?.lastName;
          if (!lastName && p.user?.name) {
            const parts = p.user.name.trim().split(/\s+/);
            if (parts.length > 1) {
              lastName = parts[parts.length - 1] || '';
            }
          }

          return {
            id: p.id,
            user: {
              id: p.user?.id || '',
              profile: {
                firstName,
                lastName: lastName || '',
                avatar: p.user?.image
              }
            },
            status: p.status,
            joinedAt: p.joinedAt
          };
        }) || [],
        userParticipation: rawEvent.userParticipation ? {
          id: rawEvent.userParticipation.id,
          status: rawEvent.userParticipation.status,
          hoursCommitted: rawEvent.userParticipation.hoursCommitted || 0,
          hoursActual: rawEvent.userParticipation.hoursActual,
          joinedAt: rawEvent.userParticipation.joinedAt
        } : undefined,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (params?.id) {
      fetchEvent(params.id as string);
      fetchCommentCount(params.id as string);
    }
  }, [params?.id, fetchEvent]);

  // Fetch user skills and check against event requirements
  useEffect(() => {
    const fetchUserSkills = async () => {
      if (!user?.id || !event) return;
      
      try {
        const response = await fetch('/api/users/profile');
        if (response.ok) {
          const data = await response.json();
          const skills = data.user?.profile?.skills || [];
          setUserSkills(skills);
          
          // Check if event has required skills
          if (event.skills && event.skills.length > 0) {
            const missing = event.skills.filter((skill: string) => !skills.includes(skill));
            setMissingSkills(missing);
          } else {
            setMissingSkills([]);
          }
        }
      } catch (error) {
        console.error('Error fetching user skills:', error);
      }
    };

    if (user && event) {
      fetchUserSkills();
    }
  }, [user, event]);

  const fetchCommentCount = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setCommentCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }

    // Fetch gallery count
    try {
      const response = await fetch(`/api/events/${eventId}/gallery`);
      if (response.ok) {
        const data = await response.json();
        setGalleryCount(data.images?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching gallery count:', error);
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

  const handleCancelRegistration = () => {
    if (!event || !event.userParticipation) return;

    showConfirm({
      title: 'Cancel Registration',
      message: `Are you sure you want to cancel your registration for "${event.title}"? This action cannot be undone.`,
      confirmText: 'Cancel Registration',
      cancelText: 'Keep Registration',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/events/${event.id}/participate`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to cancel registration' }));
            throw new Error(errorData.error || 'Failed to cancel registration');
          }

          toast.success('Registration cancelled successfully');
          fetchEvent(event.id); // Refresh event data
        } catch (error) {
          console.error('Error cancelling registration:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to cancel registration';
          toast.error(errorMessage);
        }
      }
    });
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

  const handleMarkAttendance = async (code: string, coordinates?: { lat: number; lng: number }) => {
    if (!event) {
      throw new Error('Event not found');
    }

    const requestBody: { code: string; userLat?: number; userLng?: number } = { code };
    
    if (coordinates) {
      requestBody.userLat = coordinates.lat;
      requestBody.userLng = coordinates.lng;
    }

    const response = await fetch(`/api/events/${event.id}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to mark attendance' }));
      throw new Error(errorData.error || 'Failed to mark attendance');
    }

    const data = await response.json();
    toast.success(data.message || 'Attendance marked successfully');
    fetchEvent(event.id); // Refresh event data
  };

  // Check if user can mark attendance
  const canMarkAttendance = () => {
    if (!event || !event.userParticipation || !event.attendanceEnabled) {
      return false;
    }

    // Check if already marked
    if (event.userParticipation.status === 'ATTENDED' || event.userParticipation.status === 'VERIFIED') {
      return false;
    }

    const now = new Date();
    const startDate = new Date(event.startDate);

    // Check if event has started
    if (now < startDate) {
      return false;
    }

    // Check if attendance is within enabled time range
    if (event.attendanceEnabledAt) {
      const enabledAt = new Date(event.attendanceEnabledAt);
      if (now < enabledAt) {
        return false;
      }
    }

    if (event.attendanceDisabledAt) {
      const disabledAt = new Date(event.attendanceDisabledAt);
      if (now > disabledAt) {
        return false;
      }
    }

    return true;
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
  // Check if user has required skills (if event has skills requirements)
  const hasRequiredSkills = !event?.skills || event.skills.length === 0 || missingSkills.length === 0;
  const canJoin = user && event && !event.userParticipation && !isEventFull && !isRegistrationClosed && !isEventCompleted && hasRequiredSkills && (event.status === 'ACTIVE' || isEventUpcoming);
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
        <div className="relative h-64 md:h-80 bg-gradient-to-r from-primary-100 to-primary-200 overflow-hidden">
          {event.images && event.images.length > 0 ? (
            <Image
              src={event.images[0]}
              alt={event.title}
              fill
              className="object-cover"
              priority
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
                      ? 'bg-red-500 hover:bg-red-600 text-white border-0' 
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
        {/* Back to Events Button */}
        <Link href="/events" className="inline-block mb-6">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
            <Navigation className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Title and Basic Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                {eventStatus && (
                  <Badge variant={eventStatus.color as "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "sdg"} className="flex items-center px-3 py-1">
                    <eventStatus.icon className="w-3 h-3 mr-1" />
                    {eventStatus.label}
                  </Badge>
                )}
                
                {event.organization?.verified && (
                  <Badge variant="secondary" className="flex items-center px-3 py-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Org
                  </Badge>
                )}
                
                {intensityInfo && (
                  <Badge variant={intensityInfo.color as "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "sdg"} className="px-3 py-1">
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
                      src={event.organization.logo || undefined} 
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
                    <div className="text-sm text-muted-foreground">
                      {event.organization.industry || getOrganizationTypeDisplay(event.organization.type)}
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
                  Comments {commentCount > 0 && `(${commentCount})`}
                </button>
                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                    activeTab === 'gallery' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                      : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                  }`}
                >
                  Gallery {galleryCount > 0 && `(${galleryCount})`}
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
                        {event.skills.map((skill, index) => {
                          const colors = [
                            'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
                            'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
                            'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
                            'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
                            'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
                            'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
                            'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
                            'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
                          ];
                          const colorClass = colors[index % colors.length];
                          
                          return (
                            <Badge key={skill} variant="outline" className={`${colorClass} px-3 py-1`}>
                              {skill}
                            </Badge>
                          );
                        })}
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
                    {event.sessions && event.sessions.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-lg">Schedule</div>
                          <div className="text-sm text-muted-foreground">Total: {(event.totalHours || 0).toFixed(1)} hours</div>
                        </div>
                        <div className="space-y-4">
                          {event.sessions.map((s, idx) => {
                            const hours = Math.max(0, ((new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / 36e5) - ((s.breakMin ?? 0) / 60));
                            const startDate = new Date(s.startAt);
                            const endDate = new Date(s.endAt);
                            
                            // Format date: "December 1, 2025"
                            const dateStr = startDate.toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            });
                            
                            // Format time with AM/PM and timezone: "3:00 PM GMT+8"
                            const startTimeStr = startDate.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            });
                            const endTimeStr = endDate.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            });
                            
                            // Get timezone
                            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                            const timezoneAbbr = startDate.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
                            
                            return (
                              <div key={s.id || idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                                <div className="font-semibold text-base mb-3">{s.label || `Session ${idx + 1}`}</div>
                                <div className="grid md:grid-cols-2 gap-3">
                                  {/* Date */}
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground">Date</div>
                                      <div className="text-sm font-medium">{dateStr}</div>
                                    </div>
                                  </div>

                                  {/* Time */}
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground">Time</div>
                                      <div className="text-sm font-medium">{startTimeStr} – {endTimeStr} ({timezoneAbbr})</div>
                                    </div>
                                  </div>

                                  {/* Duration */}
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground">Duration</div>
                                      <div className="text-sm font-medium">{hours.toFixed(1)} hours{(s.breakMin ?? 0) > 0 ? ` (${s.breakMin} min break)` : ''}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="font-semibold text-lg mb-4">Event Information</div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Total Duration</div>
                            <div className="text-sm text-muted-foreground">
                              {typeof event.totalHours === 'number' ? `${event.totalHours.toFixed(1)} hours` : '—'}
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

                {/* Verification Progress Bar for Participants */}
                {event.userParticipation && (event.userParticipation.status === 'ATTENDED' || event.userParticipation.status === 'VERIFIED') && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Attendance marked successfully
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                            <span>Progress</span>
                            <span className="font-medium">
                              {event.userParticipation.status === 'VERIFIED' ? '100%' : event.userParticipation.status === 'ATTENDED' ? '75%' : '0%'}
                            </span>
                          </div>
                          <Progress 
                            value={event.userParticipation.status === 'VERIFIED' ? 100 : event.userParticipation.status === 'ATTENDED' ? 75 : 0} 
                            className="h-2" 
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            {event.userParticipation.status === 'ATTENDED' && (
                              <p>Waiting for certificate and impact score...</p>
                            )}
                            {event.userParticipation.status === 'VERIFIED' && (
                              <p className="text-green-600 dark:text-green-400">✓ Certificate and impact score received!</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Registration Progress Bar */}
                {event.userParticipation && (
                  (event.userParticipation.status === 'PENDING' || event.userParticipation.status === 'REGISTERED') ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Registration Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-yellow-600 dark:text-yellow-400">
                            <span className="font-medium">Status</span>
                            <span>Awaiting approval...</span>
                          </div>
                          <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-yellow-500 to-orange-600 h-3 rounded-full transition-all duration-500 animate-pulse" 
                              style={{ width: '33%' }} 
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-yellow-500" />
                              <span>Registration Submitted</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
                              <span>Awaiting Approval</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                              <span>Approval Confirmed</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : event.userParticipation.status === 'REJECTED' ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Registration Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400">
                            <span className="font-medium">Status</span>
                            <span>Rejected</span>
                          </div>
                          <div className="w-full bg-red-100 dark:bg-red-900/30 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-rose-600 h-3 rounded-full transition-all duration-500" 
                              style={{ width: '33%' }} 
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400 mt-2">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span>Registration Submitted</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span>Rejected</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                              <span>—</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : event.userParticipation.status === 'CONFIRMED' ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Registration Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
                            <span className="font-medium">Status</span>
                            <span>Approved, waiting for event to start</span>
                          </div>
                          <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500" 
                              style={{ width: '66%' }} 
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400 mt-2">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span>Registration Submitted</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span>Approval Confirmed</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                              <span>Event Verification</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null
                )}
              </div>
            )}

            {activeTab === 'participants' && (
              event.isCreator ? (
                <ParticipantsList 
                  eventId={event.id}
                  isOrganizer={event.isCreator}
                  canManageParticipants={event.isCreator}
                />
              ) : (
                <EventParticipants eventId={event.id} />
              )
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

            {/* Event Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date */}
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">
                      {formatDate(event.startDate)}
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">
                      {new Date(event.startDate).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true
                      })}
                      {event.endDate && event.endDate !== event.startDate && (
                        <>
                          {' - '}
                          {new Date(event.endDate).toLocaleTimeString([], { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true
                          })}
                        </>
                      )}
                      {' ('}
                      {new Date(event.startDate).toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop()}
                      {')'}
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
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                        onClick={() => {
                          const { lat, lng } = event.location.coordinates!;
                          window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
                        }}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
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

                {/* Registration Deadline */}
                {event.registrationDeadline && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Register by:</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(event.registrationDeadline)}
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Created */}
                <div className="text-sm text-muted-foreground">
                  Created {formatTimeAgo(event.createdAt)}
                </div>
              </CardContent>
            </Card>

            {/* SDG Alignment */}
            {event.sdgTags && event.sdgTags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <Target className="h-4 w-4 mr-2" />
                    SDG Alignment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {event.sdgTags.map((sdgNumber) => {
                      const sdgData = getSDGById(sdgNumber);
                      return sdgData ? (
                        <div key={sdgNumber} className="flex items-center space-x-3 p-3 border-2 rounded-lg bg-white dark:bg-gray-800" style={{ borderColor: sdgData.color }}>
                          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                            <Image 
                              src={sdgData.image} 
                              alt={`SDG ${sdgData.id}: ${sdgData.title}`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                  target.parentElement.style.backgroundColor = sdgData.color;
                                  target.parentElement.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                                      ${sdgData.id}
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              SDG {sdgData.id}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {sdgData.title}
                            </p>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

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

                {/* Estimated Impact Score */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                        Estimated Impact Score
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                        Based on {event.estimatedScoreRange?.hoursRange.typical || 4} typical hours of participation
                      </p>
                      {event.estimatedScoreRange && (
                        <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
                          <span className="font-medium">Range:</span>
                          <span>{event.estimatedScoreRange.minScore} - {event.estimatedScoreRange.maxScore} points</span>
                          <span className="text-indigo-500 dark:text-indigo-400">
                            ({event.estimatedScoreRange.hoursRange.min}-{event.estimatedScoreRange.hoursRange.max} hrs)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        {event.estimatedScoreRange ? (
                          <>
                            {event.estimatedScoreRange.typicalScore}
                          </>
                        ) : (
                          '5-15'
                        )}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">points</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Card */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Participation Status */}
                  {event.userParticipation ? (
                    <>
                      {(event.userParticipation.status === 'PENDING' || event.userParticipation.status === 'REGISTERED') ? (
                        <div className="p-5 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center space-x-2 mb-4">
                            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            <span className="font-semibold text-lg text-yellow-800 dark:text-yellow-200">
                              Registration Submitted, Awaiting Admin Approval
                            </span>
                          </div>
                          <div className="space-y-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              Your registration has been successfully submitted. Please wait for the event administrator to review and confirm. Once approved, you will officially become a participant in the event.
                            </p>
                            <div className="mt-4 p-3 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg">
                              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                💡 <strong>Tip:</strong> You will only be officially counted in the participant list after the administrator confirms your registration in &ldquo;Registration Approval&rdquo;.
                              </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-800">
                              <Button
                                variant="outline"
                                onClick={handleCancelRegistration}
                                className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel Registration
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : event.userParticipation.status === 'REJECTED' ? (
                        <div className="p-5 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-2 border-red-200 dark:border-red-800">
                          <div className="flex items-center space-x-2 mb-4">
                            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <span className="font-semibold text-lg text-red-800 dark:text-red-200">
                              Registration Rejected
                            </span>
                          </div>
                          <div className="space-y-3">
                            <p className="text-sm text-red-700 dark:text-red-300">
                              We apologize, but your registration has been rejected by the event administrator. If you have any questions, please contact the event organizer.
                            </p>
                          </div>
                        </div>
                      ) : (event.userParticipation.status === 'CONFIRMED' || event.userParticipation.status === 'ATTENDED' || event.userParticipation.status === 'VERIFIED') ? (
                        <div className="p-5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-2 mb-4">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="font-semibold text-lg text-green-800 dark:text-green-200">
                              {event.userParticipation.status === 'CONFIRMED' ? 'Registration Approved!' : 'Attendance Recorded!'}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {event.userParticipation.status === 'CONFIRMED' 
                                ? 'Congratulations! Your registration has been approved by the administrator. You are now officially a participant in the event. After the event ends, we will conduct Post-Event Verification.'
                                : 'Great job! Your attendance has been successfully recorded. Thank you for participating in this event!'}
                            </p>
                            {event.userParticipation.status === 'CONFIRMED' && (
                              <div className="mt-4 p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  💡 <strong>Tip:</strong> You are now officially counted in the participant list. After the event is completed, the administrator will confirm your participation in Post-Event Verification.
                                </p>
                              </div>
                            )}
                            <div className="text-sm text-green-700 dark:text-green-300 space-y-1 pt-2 border-t border-green-200 dark:border-green-800">
                              <div>Committed Hours: {event.userParticipation.hoursCommitted} hours</div>
                              <div>Registration Time: {formatTimeAgo(event.userParticipation.joinedAt)}</div>
                            </div>
                            
                            {/* Mark Attendance Button */}
                            {canMarkAttendance() && (
                              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                                <Button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowAttendanceDialog(true);
                                  }}
                                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0 cursor-pointer"
                                  type="button"
                                >
                                  <QrCode className="w-4 h-4 mr-2" />
                                  Mark Attendance
                                </Button>
                              </div>
                            )}

                            {/* Already Marked Attendance */}
                            {(event.userParticipation.status === 'ATTENDED' || event.userParticipation.status === 'VERIFIED') && (
                              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                                <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg flex items-center space-x-2">
                                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                    Attendance marked successfully
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                              <Button
                                variant="outline"
                                onClick={handleCancelRegistration}
                                className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel Registration
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="font-medium text-emerald-800 dark:text-emerald-200">
                              Participation Status: {event.userParticipation.status}
                            </span>
                          </div>
                          <div className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                            <div>Committed Hours: {event.userParticipation.hoursCommitted} hours</div>
                            {event.userParticipation.hoursActual && (
                              <div>Actual Hours: {event.userParticipation.hoursActual} hours</div>
                            )}
                            <div>Join Time: {formatTimeAgo(event.userParticipation.joinedAt)}</div>
                          </div>
                        </div>
                      )}
                    </>
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
                  ) : !hasRequiredSkills && event.skills && event.skills.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                        <div className="font-medium text-orange-700 dark:text-orange-300 mb-2">Missing Required Skills</div>
                        <div className="text-sm text-orange-600 dark:text-orange-400 mb-3">
                          This event requires the following skills:
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mb-3">
                          {missingSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          Please update your profile with these skills to register for this event.
                        </div>
                      </div>
                      <Link href="/profile?edit=true">
                        <Button 
                          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0" 
                          size="lg"
                        >
                          Update Profile Skills
                        </Button>
                      </Link>
                    </div>
                  ) : canJoin && !event.isCreator ? (
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

                  {/* Group Chat Button - visible to participants and admins */}
                  {(event.userParticipation || event.isCreator || event.canEdit) && (
                    <Button
                      variant="outline"
                      className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border-0"
                      onClick={() => setShowGroupChatDialog(true)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Group Chat
                    </Button>
                  )}
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

        {/* Attendance Dialog */}
        <AttendanceDialog
          isOpen={showAttendanceDialog}
          onClose={() => setShowAttendanceDialog(false)}
          onConfirm={handleMarkAttendance}
          eventTitle={event?.title}
          isVirtual={event?.location.isVirtual}
          hasCoordinates={!!event?.location.coordinates}
          eventCoordinates={event?.location.coordinates}
        />

        {/* Group Chat Dialog */}
        {event && (
          <GroupChatDialog
            eventId={event.id}
            eventTitle={event.title}
            eventImage={event.images?.[0] || null}
            open={showGroupChatDialog}
            onOpenChange={setShowGroupChatDialog}
            currentUserId={user?.id}
          />
        )}
      </div>
      
      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}