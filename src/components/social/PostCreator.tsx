// home/ubuntu/impaktrweb/src/components/social/PostCreator.tsx

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, Image, MapPin, Calendar, Award, Users, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInitials } from '@/lib/utils';

interface PostCreatorProps {
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

export function PostCreator({ onClose, onPostCreated }: PostCreatorProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'general' | 'achievement' | 'event'>('general');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedAchievement, setSelectedAchievement] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length <= 4) {
      setImages(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('type', postType);
      
      if (selectedEvent) formData.append('eventId', selectedEvent);
      if (selectedAchievement) formData.append('achievementId', selectedAchievement);

      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const response = await fetch('/api/social/posts', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newPost = await response.json();
        onPostCreated(newPost);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Share Your Impact</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                <AvatarFallback>
                  {getInitials(session.user.name || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{session.user.name}</h4>
                <p className="text-sm text-muted-foreground">Share with your community</p>
              </div>
            </div>

            {/* Post Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Post Type</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={postType === 'general' ? 'default' : 'outline'}
                  className="flex flex-col items-center p-4 h-auto"
                  onClick={() => setPostType('general')}
                >
                  <Users className="w-5 h-5 mb-2" />
                  <span className="text-xs">General</span>
                </Button>
                <Button
                  type="button"
                  variant={postType === 'event' ? 'default' : 'outline'}
                  className="flex flex-col items-center p-4 h-auto"
                  onClick={() => setPostType('event')}
                >
                  <Calendar className="w-5 h-5 mb-2" />
                  <span className="text-xs">Event</span>
                </Button>
                <Button
                  type="button"
                  variant={postType === 'achievement' ? 'default' : 'outline'}
                  className="flex flex-col items-center p-4 h-auto"
                  onClick={() => setPostType('achievement')}
                >
                  <Award className="w-5 h-5 mb-2" />
                  <span className="text-xs">Achievement</span>
                </Button>
              </div>
            </div>

            {/* Event Selection */}
            {postType === 'event' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Event</label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event you participated in" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event-1">Beach Cleanup Drive - Marina Bay</SelectItem>
                    <SelectItem value="event-2">Food Distribution - Community Center</SelectItem>
                    <SelectItem value="event-3">Tree Planting - Botanic Gardens</SelectItem>
                    <SelectItem value="event-4">Tutoring Program - Local School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Achievement Selection */}
            {postType === 'achievement' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Achievement</label>
                <Select value={selectedAchievement} onValueChange={setSelectedAchievement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a recent achievement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="badge-1">Climate Action Supporter Badge</SelectItem>
                    <SelectItem value="badge-2">Education Champion Badge</SelectItem>
                    <SelectItem value="rank-1">Promoted to Contributor</SelectItem>
                    <SelectItem value="milestone-1">100 Hours Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Content */}
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                What's on your mind?
              </label>
              <Textarea
                id="content"
                placeholder={
                  postType === 'general' 
                    ? "Share your thoughts about making an impact..."
                    : postType === 'event'
                    ? "How was your experience at this event?"
                    : "Tell us about your achievement!"
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Photos (Optional)</label>
                {images.length < 4 && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Add Photos
                      </span>
                    </Button>
                  </label>
                )}
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Options */}
            <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add location</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tag people</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {postType === 'general' && "Share your impact journey with the community"}
                {postType === 'event' && "Let others know about your event experience"}
                {postType === 'achievement' && "Celebrate your achievements with everyone"}
              </div>
              
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || (!content.trim() && images.length === 0)}
                >
                  {isSubmitting ? 'Posting...' : 'Share Post'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}