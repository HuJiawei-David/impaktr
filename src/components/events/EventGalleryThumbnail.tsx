// /home/ubuntu/impaktrweb/src/components/events/EventGalleryThumbnail.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import { Eye, Download, Trash2, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface EventGalleryThumbnailProps {
  images: EventImage[];
  onImageClick: (image: EventImage) => void;
  onDeleteImage?: (imageId: string) => void;
  canDelete?: (image: EventImage) => boolean;
  showMetadata?: boolean;
  columns?: number;
  maxDisplay?: number;
}

export function EventGalleryThumbnail({ 
  images, 
  onImageClick, 
  onDeleteImage,
  canDelete,
  showMetadata = true,
  columns = 4,
  maxDisplay
}: EventGalleryThumbnailProps) {
  const displayImages = maxDisplay ? images.slice(0, maxDisplay) : images;
  const remainingCount = maxDisplay && images.length > maxDisplay ? images.length - maxDisplay : 0;

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'setup': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'action': return 'bg-green-100 text-green-800 border-green-200';
      case 'results': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No photos yet</h3>
        <p className="text-muted-foreground">Photos from this event will appear here.</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols] || gridCols[4]}`}>
      {displayImages.map((image, index) => (
        <div key={image.id} className="relative group">
          {/* Main Image */}
          <div 
            className="aspect-square relative overflow-hidden rounded-lg cursor-pointer bg-muted"
            onClick={() => onImageClick(image)}
          >
            <Image
              src={image.url}
              alt={image.caption || `Event photo ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
              <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>

            {/* Category Badge */}
            {image.category && (
              <div className="absolute top-2 left-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getCategoryColor(image.category)}`}
                >
                  {image.category}
                </Badge>
              </div>
            )}

            {/* Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(image.url, '_blank');
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
              
              {onDeleteImage && canDelete?.(image) && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteImage(image.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Show remaining count on last image */}
            {remainingCount > 0 && index === displayImages.length - 1 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  +{remainingCount} more
                </span>
              </div>
            )}
          </div>

          {/* Metadata */}
          {showMetadata && (
            <div className="mt-2 space-y-1">
              {image.caption && (
                <p className="text-sm text-foreground line-clamp-2">
                  {image.caption}
                </p>
              )}
              
              <div className="flex items-center text-xs text-muted-foreground space-x-2">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{image.uploadedBy.name}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(image.uploadedAt)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
