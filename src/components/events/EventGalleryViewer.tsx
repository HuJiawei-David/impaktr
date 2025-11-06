// /home/ubuntu/impaktrweb/src/components/events/EventGalleryViewer.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Dialog, DialogContent, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { createPortal } from 'react-dom';
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

  // Lock body scroll when gallery viewer is open
  useEffect(() => {
    if (!isOpen) return;
    
    // Save original overflow style
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      // Restore original styles when gallery closes
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  }, [images.length]);

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
  }, [isOpen, goToPrevious, goToNext, onClose]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Event Photo',
          text: currentImage.caption || 'Check out this photo from the event!',
          url: currentImage.url,
        });
      } catch (error) {
        // Share cancelled
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

  if (!currentImage || !isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
      onWheel={(e) => {
        // Only prevent scroll if we're scrolling the backdrop, not the gallery content
        const target = e.target as HTMLElement;
        if (target === e.currentTarget || target.closest('.gallery-backdrop')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onTouchMove={(e) => {
        // Only prevent touch scroll if we're touching the backdrop
        const target = e.target as HTMLElement;
        if (target === e.currentTarget || target.closest('.gallery-backdrop')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div 
        className="relative w-[90vw] max-w-5xl rounded-xl shadow-2xl flex flex-col overflow-hidden my-auto max-h-[90vh]"
        style={{ backgroundColor: '#1a1a1a' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - positioned outside transform context */}
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-10 h-10 p-0 rounded-full"
            style={{ color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
            title="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Image Area */}
        <div className="relative flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#000', minHeight: '500px', maxHeight: '70vh' }}>
          <Image
            src={currentImage.url}
            alt={currentImage.caption || 'Event photo'}
            width={800}
            height={600}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain'
            }}
            unoptimized
          />
          
          {/* Navigation Arrows - positioned with proper z-index */}
          {images.length > 1 && (
            <>
              <div 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0"
                  style={{ 
                    color: 'white', 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              </div>
              <div 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0"
                  style={{ 
                    color: 'white', 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Info Section - scrollable if content is long */}
        <div className="p-6 space-y-4 overflow-y-auto flex-shrink-0" style={{ backgroundColor: '#1a1a1a', maxHeight: '30vh' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-lg" style={{ color: 'white' }}>{currentImage.uploadedBy.name}</p>
              {currentImage.caption && (
                <p className="text-sm mt-1" style={{ color: '#a0a0a0' }}>{currentImage.caption}</p>
              )}
            </div>
            {images.length > 1 && (
              <span className="text-sm" style={{ color: '#666' }}>{currentIndex + 1} / {images.length}</span>
            )}
          </div>
          
          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all"
                  style={{
                    border: index === currentIndex ? '2px solid #9333ea' : '1px solid #404040',
                    opacity: index === currentIndex ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = index === currentIndex ? '1' : '0.5'}
                >
                  <Image
                    src={image.url}
                    alt=""
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
