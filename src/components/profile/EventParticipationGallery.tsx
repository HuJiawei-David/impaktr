// /home/ubuntu/impaktrweb/src/components/profile/EventParticipationGallery.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  Eye,
  Grid3X3,
  Filter,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventGalleryViewer } from '@/components/events/EventGalleryViewer';
import { formatDate } from '@/lib/utils';

interface EventImage {
  id: string;
  url: string;
  caption?: string;
  uploadedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  uploadedAt: string;
  category?: 'setup' | 'action' | 'results' | 'general';
}

interface EventParticipation {
  id: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate?: string;
    location: {
      city: string;
      isVirtual: boolean;
    };
    status: string;
    currentParticipants: number;
  };
  status: 'JOINED' | 'VERIFIED' | 'COMPLETED';
  joinedAt: string;
  hoursCommitted?: number;
  hoursVerified?: number;
  images: EventImage[];
}

interface EventParticipationGalleryProps {
  userId: string;
  isOwn?: boolean;
  maxEvents?: number;
  showHeader?: boolean;
}

export function EventParticipationGallery({ 
  userId, 
  isOwn = false,
  maxEvents = 6,
  showHeader = true
}: EventParticipationGalleryProps) {
  const [participations, setParticipations] = useState<EventParticipation[]>([]);
  const [selectedImages, setSelectedImages] = useState<EventImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(-1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchParticipations();
  }, [userId, statusFilter]);

  const fetchParticipations = async () => {
    try {
      const response = await fetch(
        `/api/users/${userId}/participations?${new URLSearchParams({
          ...(statusFilter !== 'all' && { status: statusFilter }),
          limit: maxEvents.toString(),
          includeImages: 'true'
        })}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setParticipations(data.participations || []);
      }
    } catch (error) {
      console.error('Error fetching participations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (images: EventImage[], imageIndex: number) => {
    setSelectedImages(images);
    setSelectedImageIndex(imageIndex);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'VERIFIED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'JOINED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalImages = participations.reduce((acc, p) => acc + p.images.length, 0);
  const totalHours = participations.reduce((acc, p) => acc + (p.hoursVerified || 0), 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (participations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No event participation yet</h3>
            <p className="text-muted-foreground mb-4">
              {isOwn 
                ? "Start participating in events to build your impact gallery!"
                : "This user hasn't participated in any events yet."
              }
            </p>
            {isOwn && (
              <Button asChild>
                <Link href="/events">
                  <Calendar className="w-4 h-4 mr-2" />
                  Explore Events
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Event Participation</h3>
            <p className="text-sm text-muted-foreground">
              {participations.length} events • {totalImages} photos • {totalHours} hours verified
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="JOINED">Joined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {participations.map((participation) => (
          <Card key={participation.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-2">
                    <Link 
                      href={`/events/${participation.event.id}`}
                      className="hover:underline"
                    >
                      {participation.event.title}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(participation.event.startDate)}</span>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span>
                      {participation.event.location.isVirtual 
                        ? 'Virtual' 
                        : participation.event.location.city
                      }
                    </span>
                  </div>
                </div>
                
                <Badge className={`ml-2 ${getStatusColor(participation.status)}`}>
                  {participation.status.toLowerCase()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Event Stats */}
              <div className="flex items-center text-sm text-muted-foreground mb-4 space-x-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{participation.event.currentParticipants}</span>
                </div>
                {participation.hoursVerified && (
                  <div className="flex items-center space-x-1">
                    <Award className="w-3 h-3" />
                    <span>{participation.hoursVerified}h verified</span>
                  </div>
                )}
              </div>

              {/* Image Gallery */}
              {participation.images.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {participation.images.length} {participation.images.length === 1 ? 'photo' : 'photos'}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/events/${participation.event.id}/gallery`}>
                        <Grid3X3 className="w-3 h-3 mr-1" />
                        View All
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {participation.images.slice(0, 6).map((image, index) => (
                      <div
                        key={image.id}
                        className="relative aspect-square cursor-pointer group"
                        onClick={() => handleImageClick(participation.images, index)}
                      >
                        <Image
                          src={image.url}
                          alt={image.caption || `Event photo ${index + 1}`}
                          fill
                          className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 768px) 33vw, 16vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        
                        {/* Show remaining count on last image */}
                        {index === 5 && participation.images.length > 6 && (
                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              +{participation.images.length - 6}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No photos from this event</p>
                </div>
              )}

              {/* View Event Link */}
              <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
                <Link href={`/events/${participation.event.id}`}>
                  View Event Details
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image Viewer */}
      <EventGalleryViewer
        images={selectedImages}
        initialIndex={selectedImageIndex}
        isOpen={selectedImageIndex >= 0}
        onClose={() => setSelectedImageIndex(-1)}
      />
    </div>
  );
}
