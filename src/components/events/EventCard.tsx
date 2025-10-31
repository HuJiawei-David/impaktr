'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  TrendingUp, 
  Heart, 
  Building2 
} from 'lucide-react';

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

// SDG Definitions
const SDG_DEFINITIONS = {
  1: { name: 'No Poverty', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  2: { name: 'Zero Hunger', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  3: { name: 'Good Health and Well-being', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  4: { name: 'Quality Education', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  5: { name: 'Gender Equality', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  6: { name: 'Clean Water and Sanitation', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  7: { name: 'Affordable and Clean Energy', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  8: { name: 'Decent Work and Economic Growth', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' },
  9: { name: 'Industry, Innovation and Infrastructure', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  10: { name: 'Reduced Inequalities', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  11: { name: 'Sustainable Cities and Communities', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  12: { name: 'Responsible Consumption and Production', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200' },
  13: { name: 'Climate Action', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  14: { name: 'Life Below Water', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' },
  15: { name: 'Life on Land', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  16: { name: 'Peace, Justice and Strong Institutions', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200' },
  17: { name: 'Partnerships for the Goals', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' }
};

// Event interface
interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location: string | object;
  maxParticipants?: number;
  currentParticipants?: number;
  interestedCount?: number;
  status?: string;
  imageUrl?: string;
  images?: string[];
  sdg?: string | number | number[];
  participantCount?: number;
  organization?: {
    id: string;
    name: string;
    logo?: string | null;
  };
  trending?: boolean;
  featured?: boolean;
  isBookmarked?: boolean;
  isFavorite?: boolean;
  isAttending?: boolean;
  distance?: number;
  sdgTags?: number[];
}

interface EventCardProps {
  event: Event;
  onToggleFavorite?: (id: string) => void;
  onToggleBookmark?: (id: string) => void;
  showOrganization?: boolean;
}

export const EventCard = ({ 
  event, 
  onToggleFavorite, 
  onToggleBookmark,
  showOrganization = true 
}: EventCardProps) => {
  const router = useRouter();

  // Parse location data to handle both string and object formats
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

  // Parse SDG data to handle both string and array formats
  let sdgData;
  if (event.sdg) {
    if (typeof event.sdg === 'string') {
      try {
        sdgData = JSON.parse(event.sdg);
      } catch (e) {
        sdgData = [parseInt(event.sdg)];
      }
    } else if (typeof event.sdg === 'number') {
      sdgData = [event.sdg];
    } else {
      sdgData = event.sdg;
    }
  } else if (event.sdgTags) {
    sdgData = event.sdgTags;
  } else {
    sdgData = [];
  }

  // Get the main image
  const mainImage = event.imageUrl || (event.images && event.images.length > 0 ? event.images[0] : null);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('a, button')) {
      return;
    }
    router.push(`/events/${event.id}`);
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          {mainImage ? (
            <Image 
              src={mainImage} 
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Status Badges */}
          {event.status === 'UPCOMING' && (
            <Badge className="absolute top-2 left-2 bg-green-500 text-white border border-white dark:border-transparent px-3 py-1">
              <Calendar className="w-3 h-3 mr-1" />
              Upcoming
            </Badge>
          )}
          
          {event.status === 'COMPLETED' && (
            <Badge className="absolute top-2 left-2 bg-gray-500 text-white border border-white dark:border-transparent px-3 py-1">
              <Clock className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
          
          {event.trending && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}
          
          {event.featured && (
            <Badge className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
            {onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleBookmark(event.id);
                }}
                className="ml-2 mt-1 flex-shrink-0 transition-all duration-200 hover:scale-110"
              >
                <Heart className={`w-4 h-4 transition-all duration-200 ${
                  event.isBookmarked 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-400 hover:text-red-500 hover:fill-red-500'
                }`} />
              </button>
            )}
          </div>
          
          {/* Organization Info */}
          {showOrganization && event.organization && (
            <div className="flex items-center gap-2 mb-3">
              {event.organization.logo ? (
                <Image 
                  src={event.organization.logo} 
                  alt={event.organization.name}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-white" />
                </div>
              )}
              <Link 
                href={`/organizations/${event.organization.id}`} 
                className="text-sm text-gray-600 dark:text-gray-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                {event.organization.name}
              </Link>
            </div>
          )}
          
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {formatEventDate(event.startDate)}
            </div>
            <div className="flex items-center ml-6">
              <Clock className="w-4 h-4 mr-2" />
              {formatEventTimeRange(event.startDate, event.endDate)}
            </div>
            
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              {locationData.isVirtual ? 'Virtual Event' : `${locationData.city}, ${locationData.country}`}
            </div>
            
            {event.distance && (
              <div className="text-xs text-gray-500 dark:text-gray-500 ml-6">
                {event.distance.toFixed(1)} km away
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{event.participantCount || event.currentParticipants || 0}</span>
              <span>{event.status === 'COMPLETED' ? 'participated' : 'participating'}</span>
            </div>
            
            {event.isAttending && (
              <Badge variant="secondary" className="text-xs">
                Attending
              </Badge>
            )}
          </div>

          {/* SDG Tags */}
          {sdgData && sdgData.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-3">
              {sdgData.slice(0, 3).map((sdg: number) => {
                const sdgInfo = SDG_DEFINITIONS[sdg as keyof typeof SDG_DEFINITIONS];
                return (
                  <Badge key={sdg} className={`text-xs px-3 py-1 whitespace-nowrap ${sdgInfo?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                    SDG {sdg}
                  </Badge>
                );
              })}
              {sdgData.length > 3 && (
                <Badge className="text-xs px-3 py-1 whitespace-nowrap bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  +{sdgData.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
  );
};