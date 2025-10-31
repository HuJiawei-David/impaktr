// home/ubuntu/impaktrweb/src/components/events/EventGallery.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, 
  X, 
  Upload, 
  Image as ImageIcon,
  Eye,
  Grid3X3,
  Filter,
  SortAsc
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDropzone } from 'react-dropzone';
import { EventGalleryThumbnail } from './EventGalleryThumbnail';
import { EventGalleryViewer } from './EventGalleryViewer';
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
  likes?: number;
  comments?: number;
}

interface EventGalleryProps {
  eventId: string;
  canUpload?: boolean;
  initialImages?: EventImage[];
  isPreview?: boolean;
  maxPreviewImages?: number;
  showFullGalleryLink?: boolean;
}

export function EventGallery({ 
  eventId, 
  canUpload = false, 
  initialImages = [],
  isPreview = false,
  maxPreviewImages = 6,
  showFullGalleryLink = true
}: EventGalleryProps) {
  const { data: session } = useSession();
  const [images, setImages] = useState<EventImage[]>(initialImages);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newImageCaption, setNewImageCaption] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/gallery`);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  }, [eventId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const onDrop = (acceptedFiles: File[]) => {
    setUploadFiles(acceptedFiles.slice(0, 5)); // Limit to 5 files
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5
  });

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });
      
      if (newImageCaption) {
        formData.append('caption', newImageCaption);
      }

      const response = await fetch(`/api/events/${eventId}/gallery`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImages(prev => [...prev, ...data.images]);
        setUploadFiles([]);
        setNewImageCaption('');
        setShowUploadDialog(false);
      } else {
        throw new Error('Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/gallery/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        setSelectedImageIndex(-1);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const canDeleteImage = (image: EventImage) => {
    return canUpload && session?.user?.id === image.uploadedBy.id;
  };

  const handleImageClick = (image: EventImage) => {
    const index = filteredImages.findIndex(img => img.id === image.id);
    setSelectedImageIndex(index);
  };

  // Filter and sort images
  const filteredImages = images
    .filter(image => {
      if (categoryFilter === 'all') return true;
      return image.category === categoryFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case 'newest':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

  const displayImages = isPreview && maxPreviewImages ? 
    filteredImages.slice(0, maxPreviewImages) : filteredImages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {isPreview ? 'Recent Photos' : 'Event Gallery'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {filteredImages.length} {filteredImages.length === 1 ? 'photo' : 'photos'}
            {isPreview && filteredImages.length > maxPreviewImages && 
              ` (showing ${maxPreviewImages})`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isPreview && showFullGalleryLink && filteredImages.length > 0 && (
            <Button variant="outline" asChild>
              <Link href={`/events/${eventId}/gallery`}>
                <Grid3X3 className="w-4 h-4 mr-2" />
                View All
              </Link>
            </Button>
          )}
          
          {canUpload && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Photos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Photos</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                    {isDragActive ? (
                      <p>Drop the photos here...</p>
                    ) : (
                      <div>
                        <p className="mb-2">Drag & drop photos here, or click to select</p>
                        <p className="text-sm text-muted-foreground">
                          Supports JPG, PNG, WebP (max 5 files)
                        </p>
                      </div>
                    )}
                  </div>

                  {uploadFiles.length > 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${index + 1}`}
                              width={200}
                              height={96}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label htmlFor="caption">Caption (Optional)</Label>
                        <Input
                          id="caption"
                          placeholder="Add a caption for these photos..."
                          value={newImageCaption}
                          onChange={(e) => setNewImageCaption(e.target.value)}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUploadFiles([]);
                            setNewImageCaption('');
                          }}
                        >
                          Clear
                        </Button>
                        <Button onClick={handleUpload} disabled={isUploading}>
                          {isUploading ? 'Uploading...' : 'Upload Photos'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters - Only show in full gallery mode */}
      {!isPreview && filteredImages.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Photos</SelectItem>
                  <SelectItem value="setup">Setup</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="results">Results</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      {displayImages.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No photos yet</h3>
              <p className="text-muted-foreground mb-4">
                {canUpload 
                  ? "Start building memories by uploading the first photo!"
                  : "Photos from this event will appear here."
                }
              </p>
              {canUpload && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Photo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EventGalleryThumbnail
          images={displayImages}
          onImageClick={handleImageClick}
          onDeleteImage={handleDeleteImage}
          canDelete={canDeleteImage}
          maxDisplay={isPreview ? maxPreviewImages : undefined}
          columns={isPreview ? 3 : 4}
        />
      )}

      {/* Image Viewer */}
      <EventGalleryViewer
        images={filteredImages}
        initialIndex={selectedImageIndex}
        isOpen={selectedImageIndex >= 0}
        onClose={() => setSelectedImageIndex(-1)}
        onDelete={handleDeleteImage}
        canDelete={canDeleteImage}
      />
    </div>
  );
}