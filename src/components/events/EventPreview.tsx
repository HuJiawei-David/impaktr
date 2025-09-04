// home/ubuntu/impaktrweb/src/components/events/EventPreview.tsx

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Calendar,
  MapPin,
  Clock,
  Users,
  Award,
  Share2,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Globe,
  Navigation,
  Camera,
  Download,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDate, formatTimeAgo, getInitials, getSDGColor, getSDGName } from '@/lib/utils';
import Image from 'next/image';

interface EventPreviewProps {
  event: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: {
      address?: string;
      city: string;
      country: string;
      coordinates?: { lat: number; lng: number };
      isVirtual: boolean;
    };
    maxParticipants?: number;
    currentParticipants: number;
    sdgTags: number[];
    skills: string[];
    intensity: number;
    verificationType: 'SELF' | 'PEER' | 'ORGANIZER' | 'GPS' | 'AUTOMATIC';
    images: string[];
    documents: string[];
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
    updatedAt: string;
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  };
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onJoin?: () => void;
}

export function EventPreview({ 
  event, 
  showActions = true, 
  onEdit, 
  onDelete, 
  onPublish, 
  onJoin 
}: EventPreviewProps) {
  const { data: session } = useSession();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const isCreator = session?.user?.id === event.creator.id;
  const isFull = event.maxParticipants && event.currentParticipants >= event.maxParticipants;
  const isUpcoming = new Date(event.startDate) > new Date();
  const isToday = new Date(event.startDate).toDateString() === new Date().toDateString();
  const isPast = new Date(event.startDate) < new Date();

  const getStatusColor = () => {
    switch (event.status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity <= 0.8) return { label: 'Light', color: 'text-green-600' };
    if (intensity <= 1.0) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'High', color: 'text-red-600' };
  };

  const getVerificationIcon = () => {
    switch (event.verificationType) {
      case 'GPS':
        return <Navigation className="w-4 h-4" />;
      case 'ORGANIZER':
        return <CheckCircle className="w-4 h-4" />;
      case 'PEER':
        return <Users className="w-4 h-4" />;
      case 'AUTOMATIC':
        return <Award className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: event.description.substring(0, 150) + '...',
      url: `${window.location.origin}/events/${event.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const intensityInfo = getIntensityLabel(event.intensity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
            <Badge className={getStatusColor()}>
              {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
            </Badge>
            {isToday && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                Today
              </Badge>
            )}
            {isFull && (
              <Badge variant="destructive">
                Full
              </Badge>
            )}
          </div>

          {/* Creator/Organization Info */}
          <div className="flex items-center space-x-3 text-muted-foreground mb-4">
            <Avatar className="w-8 h-8">
              <AvatarImage 
                src={event.organization?.logo || event.creator.avatar} 
                alt={event.organization?.name || event.creator.name}
              />
              <AvatarFallback className="text-sm">
                {getInitials(event.organization?.name || event.creator.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-foreground">
                {event.organization?.name || event.creator.name}
              </div>
              <div className="text-sm">
                Created {formatTimeAgo(event.createdAt)}
                {event.updatedAt !== event.createdAt && (
                  <span> • Updated {formatTimeAgo(event.updatedAt)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            {isCreator && (
              <>
                {event.status === 'DRAFT' && onPublish && (
                  <Button size="sm" onClick={onPublish}>
                    Publish
                  </Button>
                )}
                
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{event.title}"? This action cannot be undone.
                          {event.currentParticipants > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              This event has {event.currentParticipants} participants who will be notified.
                            </div>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Deleting...' : 'Delete Event'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}

            {!isCreator && session && onJoin && event.status === 'ACTIVE' && (
              <Button 
                onClick={onJoin} 
                disabled={isFull || isPast}
                className="min-w-[100px]"
              >
                {isFull ? 'Event Full' : isPast ? 'Event Ended' : 'Join Event'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Event Images */}
      {event.images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="md:col-span-2 relative h-64 md:h-80 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => {
              setSelectedImageIndex(0);
              setIsImageModalOpen(true);
            }}
          >
            <Image
              src={event.images[0]}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
          
          {event.images.length > 1 && (
            <div className="space-y-4">
              {event.images.slice(1, 3).map((image, index) => (
                <div 
                  key={index}
                  className="relative h-28 md:h-36 rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => {
                    setSelectedImageIndex(index + 1);
                    setIsImageModalOpen(true);
                  }}
                >
                  <Image
                    src={image}
                    alt={`${event.title} - Image ${index + 2}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {index === 1 && event.images.length > 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{event.images.length - 3} more
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Requirements */}
          {event.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills & Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {event.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    <span className={intensityInfo.color}>
                      {intensityInfo.label} Intensity
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getVerificationIcon()}
                    <span className="capitalize">
                      {event.verificationType.toLowerCase()} Verification
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {event.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Document {index + 1}</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Event Details */}
        <div className="space-y-6">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{formatDate(event.startDate)}</div>
                  {event.endDate && event.endDate !== event.startDate && (
                    <div className="text-sm text-muted-foreground">
                      to {formatDate(event.endDate)}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {new Date(event.startDate).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="flex items-start gap-3">
                {event.location.isVirtual ? (
                  <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                ) : (
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <div className="font-medium">
                    {event.location.isVirtual ? 'Virtual Event' : event.location.city}
                  </div>
                  {!event.location.isVirtual && (
                    <>
                      {event.location.address && (
                        <div className="text-sm text-muted-foreground">
                          {event.location.address}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {event.location.country}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Participants */}
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {event.currentParticipants} participants
                  </div>
                  {event.maxParticipants && (
                    <div className="text-sm text-muted-foreground">
                      Maximum: {event.maxParticipants}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Duration */}
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {event.endDate ? 
                      `${Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60))} hours` :
                      '2-3 hours'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimated duration
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SDG Impact */}
          <Card>
            <CardHeader>
              <CardTitle>SDG Impact Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {event.sdgTags.map((sdgNumber) => (
                  <div key={sdgNumber} className="flex items-center gap-2 p-2 rounded-lg border">
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: getSDGColor(sdgNumber) }}
                    >
                      {sdgNumber}
                    </div>
                    <div className="text-xs">
                      <div className="font-medium">SDG {sdgNumber}</div>
                      <div className="text-muted-foreground">
                        {getSDGName(sdgNumber).split(' ').slice(0, 2).join(' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Event Images</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {event.images[selectedImageIndex] && (
              <div className="relative h-96 w-full">
                <Image
                  src={event.images[selectedImageIndex]}
                  alt={`${event.title} - Image ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            
            {/* Image Navigation */}
            {event.images.length > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {event.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedImageIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}