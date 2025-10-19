// home/ubuntu/impaktrweb/src/components/events/EventCard.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Eye,
  Heart,
  Share2,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, formatTimeAgo, getInitials } from '@/lib/utils';

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
  };
  organization?: {
    id: string;
    name: string;
    logo: string;
  };
  createdAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isBookmarked?: boolean;
}

interface EventCardProps {
  event: Event;
  showActions?: boolean;
  onToggleBookmark?: (eventId: string) => void;
}

export function EventCard({ event, showActions = true, onToggleBookmark }: EventCardProps) {
  const isFull = !!event.maxParticipants && event.currentParticipants >= event.maxParticipants;
  const isUpcoming = new Date(event.startDate) > new Date();
  const isToday = new Date(event.startDate).toDateString() === new Date().toDateString();
  
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    try {
      const response = await fetch(`/api/events/${event.id}/bookmark`, {
        method: event.isBookmarked ? 'DELETE' : 'POST'
      });

      if (!response.ok) throw new Error('Failed to update bookmark');

      // Update the event in the parent component
      if (onToggleBookmark) {
        onToggleBookmark(event.id);
      }
      
      console.log(event.isBookmarked ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Failed to update bookmark:', error);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: `${window.location.origin}/events/${event.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
    }
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity <= 0.8) return { label: 'Light', color: 'bg-green-100 text-green-800' };
    if (intensity <= 1.0) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'High', color: 'bg-red-100 text-red-800' };
  };

  const intensityInfo = getIntensityLabel(event.intensity);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden relative">
      {/* Event Image - with pointer-events-none on Link, auto on content */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
        <Link href={`/events/${event.id}`} className="absolute inset-0 z-0">
          {event.images.length > 0 ? (
            <img
              src={event.images[0]}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-primary-300" />
            </div>
          )}
        </Link>
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          {isToday && (
            <Badge className="bg-green-500 hover:bg-green-600">
              Today
            </Badge>
          )}
          {isFull && (
            <Badge variant="destructive">
              Full
            </Badge>
          )}
          {event.location.isVirtual && (
            <Badge variant="secondary" className="ml-2">
              Virtual
            </Badge>
          )}
        </div>

        {/* Save and Share Actions - at higher z-index */}
        {showActions && (
          <div 
            className={`absolute top-3 left-3 z-20 transition-opacity ${event.isBookmarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                className={`h-8 w-8 p-0 ${
                  event.isBookmarked 
                    ? 'bg-red-500 hover:bg-red-600 text-white border-0' 
                    : 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white'
                }`}
                onClick={handleSave}
              >
                <Heart className={`w-4 h-4 ${event.isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Link href={`/events/${event.id}`}>
        <CardHeader className="pb-3">
          {/* SDG Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {event.sdgTags.slice(0, 3).map((sdgNumber) => (
              <Badge key={sdgNumber} variant="sdg" sdgNumber={sdgNumber} className="text-xs">
                SDG {sdgNumber}
              </Badge>
            ))}
            {event.sdgTags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{event.sdgTags.length - 3}
              </Badge>
            )}
          </div>

          {/* Event Title */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Creator/Organization */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Avatar className="w-6 h-6">
              <AvatarImage 
                src={event.organization?.logo || event.creator.avatar} 
                alt={event.organization?.name || event.creator.name}
              />
              <AvatarFallback className="text-xs">
                {getInitials(event.organization?.name || event.creator.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">
              {event.organization?.name || event.creator.name}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Description */}
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2">
            {/* Date and Time */}
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{formatDate(event.startDate)}</span>
              {event.endDate && event.endDate !== event.startDate && (
                <span> - {formatDate(event.endDate)}</span>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {event.location.isVirtual 
                  ? 'Virtual Event' 
                  : `${event.location.city}${event.location.address ? `, ${event.location.address}` : ''}`
                }
              </span>
            </div>

            {/* Participants */}
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                {event.currentParticipants} 
                {event.maxParticipants && ` / ${event.maxParticipants}`} participants
              </span>
            </div>

            {/* Duration and Intensity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  {event.endDate 
                    ? `${Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60))} hours`
                    : '2-3 hours'
                  }
                </span>
              </div>
              
              <Badge className={`text-xs ${intensityInfo.color}`}>
                {intensityInfo.label}
              </Badge>
            </div>
          </div>

          {/* Skills Required */}
          {event.skills.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1">Skills:</div>
              <div className="flex flex-wrap gap-1">
                {event.skills.slice(0, 2).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {event.skills.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{event.skills.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full">
            {/* Verification Type */}
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3 mr-1" />
              <span>{getVerificationTypeDisplay(event.verificationType || 'ORGANIZER')}</span>
            </div>

            {/* Time since posted */}
            <div className="text-xs text-muted-foreground">
              {formatTimeAgo(event.createdAt)}
            </div>
          </div>
        </CardFooter>
      </Link>

      {/* Quick Action Buttons */}
      {showActions && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/events/${event.id}`}>
            <Button size="sm" disabled={isFull}>
              {isFull ? 'Full' : isUpcoming ? 'Join Event' : 'View Details'}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}