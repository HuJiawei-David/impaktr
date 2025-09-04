// /home/ubuntu/impaktrweb/src/components/events/EventGalleryViewer.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Share2, 
  Trash2,
  User,
  Calendar,
  Heart,
  MessageSquare,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatDate, getInitials } from '@/lib/utils';

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
  likes?: number;
  comments?: number;
}

interface EventGalleryViewerProps {
  images: EventImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (imageId: string) => void;
  canDelete?: (image: EventImage) => boolean;
  onLike?: (imageId: string) => void;
  onComment?: (imageId: string) => void;
}

export function EventGalleryViewer({
  images,
  initialIndex,
  isOpen,
  onClose,
  onDelete,
  canDelete,
  onLike,
  onComment
}: EventGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const currentImage = images[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Event Photo',
          text: currentImage.caption || 'Check out this photo from the event!',
          url: currentImage.url,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(currentImage.url);
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'setup': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'action': return 'bg-green-100 text-green-800 border-green-200';
      case 'results': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentImage.uploadedBy.avatar} alt={currentImage.uploadedBy.name} />
                <AvatarFallback className="text-xs">
                  {getInitials(currentImage.uploadedBy.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{currentImage.uploadedBy.name}</p>
                <p className="text-sm text-white/70">{formatDate(currentImage.uploadedAt)}</p>
              </div>
              {currentImage.category && (
                <Badge variant="secondary" className={`${getCategoryColor(currentImage.category)}`}>
                  {currentImage.category}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-white/70">
                {currentIndex + 1} of {images.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsZoomed(!isZoomed)}
                className="text-white hover:bg-white/10"
              >
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Image */}
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={currentImage.url}
            alt={currentImage.caption || 'Event photo'}
            fill
            className={`object-contain transition-transform duration-200 ${
              isZoomed ? 'scale-150 cursor-grab' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
            priority
          />

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="lg"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                onClick={goToPrevious}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                onClick={goToNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>

        {/* Bottom Info & Actions */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="max-w-4xl mx-auto">
            {currentImage.caption && (
              <p className="text-white mb-4 text-center">{currentImage.caption}</p>
            )}
            
            <div className="flex items-center justify-between">
              {/* Engagement */}
              <div className="flex items-center space-x-4">
                {onLike && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLike(currentImage.id)}
                    className="text-white hover:bg-white/10 flex items-center space-x-1"
                  >
                    <Heart className="w-4 h-4" />
                    {currentImage.likes && <span>{currentImage.likes}</span>}
                  </Button>
                )}
                
                {onComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onComment(currentImage.id)}
                    className="text-white hover:bg-white/10 flex items-center space-x-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {currentImage.comments && <span>{currentImage.comments}</span>}
                  </Button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-white hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(currentImage.url, '_blank')}
                  className="text-white hover:bg-white/10"
                >
                  <Download className="w-4 h-4" />
                </Button>

                {onDelete && canDelete?.(currentImage) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(currentImage.id)}
                    className="text-white hover:bg-red-600/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 z-10">
            <div className="flex justify-center space-x-2 px-4 max-w-4xl mx-auto overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentIndex 
                      ? 'border-white' 
                      : 'border-transparent hover:border-white/50'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
