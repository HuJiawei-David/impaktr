'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  MapPin, 
  Calendar,
  Users,
  Clock,
  Target,
  Send,
  X,
  Plus
} from 'lucide-react';
import { getSDGById } from '@/constants/sdgs';

interface CreatePostProps {
  organizationId: string;
  onPostCreated?: () => void;
  onCancel?: () => void;
}

export function CreatePost({ organizationId, onPostCreated, onCancel }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('UPDATE');
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [hoursReported, setHoursReported] = useState<number | ''>('');
  const [peopleReached, setPeopleReached] = useState<number | ''>('');
  const [volunteersCount, setVolunteersCount] = useState<number | ''>('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');

  const postTypes = [
    { value: 'UPDATE', label: 'General Update', icon: '📝' },
    { value: 'EVENT_ANNOUNCE', label: 'Event Announcement', icon: '📅' },
    { value: 'EVENT_RECAP', label: 'Event Recap', icon: '🎉' },
    { value: 'IMPACT_STORY', label: 'Impact Story', icon: '📈' },
    { value: 'ACHIEVEMENT', label: 'Achievement', icon: '🏆' },
    { value: 'MILESTONE', label: 'Milestone', icon: '🎯' },
    { value: 'PARTNERSHIP', label: 'Partnership', icon: '🤝' },
  ];

  const visibilityOptions = [
    { value: 'PUBLIC', label: 'Public', description: 'Visible to everyone' },
    { value: 'FOLLOWERS', label: 'Followers Only', description: 'Visible to organization followers' },
    { value: 'MEMBERS', label: 'Members Only', description: 'Visible to organization members' },
  ];

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleToggleSDG = (sdgId: number) => {
    if (selectedSDGs.includes(sdgId)) {
      setSelectedSDGs(selectedSDGs.filter(id => id !== sdgId));
    } else {
      setSelectedSDGs([...selectedSDGs, sdgId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter post content');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/organizations/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          content: content.trim(),
          postType,
          images,
          videos,
          location: location.trim() || undefined,
          sdgs: selectedSDGs,
          tags,
          hoursReported: hoursReported || undefined,
          peopleReached: peopleReached || undefined,
          volunteersCount: volunteersCount || undefined,
          visibility,
          isPinned,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // Reset form
      setContent('');
      setImages([]);
      setVideos([]);
      setLocation('');
      setSelectedSDGs([]);
      setTags([]);
      setHoursReported('');
      setPeopleReached('');
      setVolunteersCount('');
      setVisibility('PUBLIC');
      setIsPinned(false);

      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Create New Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Post Type
            </label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What's happening? *
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update, announce an event, or tell your impact story..."
              className="min-h-[120px] resize-none"
              required
            />
          </div>

          {/* Media Upload Placeholders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Add Images</p>
              <p className="text-xs text-gray-400">Up to 10 photos</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <Video className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Add Video</p>
              <p className="text-xs text-gray-400">YouTube/Vimeo links</p>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location (optional)
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where did this happen?"
            />
          </div>

          {/* SDG Focus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              SDG Focus Areas
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((sdgId) => {
                const sdg = getSDGById(sdgId);
                const isSelected = selectedSDGs.includes(sdgId);
                
                return (
                  <button
                    key={sdgId}
                    type="button"
                    onClick={() => handleToggleSDG(sdgId)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-opacity-100 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    style={isSelected ? { borderColor: sdg?.color } : {}}
                  >
                    <div className="w-8 h-8 mx-auto mb-1 rounded overflow-hidden">
                      {sdg && (
                        <img 
                          src={sdg.image} 
                          alt={`SDG ${sdg.id}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="text-xs font-medium text-center">SDG {sdgId}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Impact Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Hours Reported
              </label>
              <Input
                type="number"
                value={hoursReported}
                onChange={(e) => setHoursReported(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                People Reached
              </label>
              <Input
                type="number"
                value={peopleReached}
                onChange={(e) => setPeopleReached(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Volunteers
              </label>
              <Input
                type="number"
                value={volunteersCount}
                onChange={(e) => setVolunteersCount(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Visibility & Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isPinned" className="text-sm text-gray-700 dark:text-gray-300">
                Pin this post
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || !content.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publish Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
