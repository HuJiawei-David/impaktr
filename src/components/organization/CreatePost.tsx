'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Clock,
  Users,
  Target,
  Send,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getSDGById } from '@/constants/sdgs';
import Image from 'next/image';

interface CreatePostProps {
  organizationId: string;
  onPostCreated?: () => void;
  onCancel?: () => void;
}

export function CreatePost({ organizationId, onPostCreated, onCancel }: CreatePostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
      setIsExpanded(false);

      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Collapsed state - compact button to create post
  if (!isExpanded) {
    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <Button
            onClick={() => setIsExpanded(true)}
            variant="outline"
            className="w-full justify-start text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full h-12"
          >
            <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Start a post...
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Expanded state - full form
  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header with Post Type and Close */}
          <div className="flex items-center justify-between mb-4">
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger className="w-[200px]">
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(false);
                if (onCancel) onCancel();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content Textarea */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to talk about?"
            className="min-h-[120px] resize-none border-0 focus-visible:ring-0 text-base"
            required
            autoFocus
          />

          {/* Expanded Options (collapsible) */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1">
              <ChevronDown className="w-4 h-4 group-open:hidden" />
              <ChevronUp className="w-4 h-4 hidden group-open:block" />
              Add details (optional)
            </summary>
            
            <div className="mt-4 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Media Upload Placeholders */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Add Images</p>
                </button>
                <button
                  type="button"
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-green-500 dark:hover:border-green-500 transition-colors"
                >
                  <Video className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Add Video</p>
                </button>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Location (optional)
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where did this happen?"
                  className="h-9"
                />
              </div>

              {/* SDG Focus - Badge Style */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Target className="w-3 h-3 inline mr-1" />
                  SDG Focus Areas
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((sdgId) => {
                    const sdgInfo = getSDGById(sdgId);
                    if (!sdgInfo) return null;
                    const isSelected = selectedSDGs.includes(sdgId);
                    
                    return (
                      <Badge
                        key={sdgId}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleToggleSDG(sdgId)}
                        className={`px-3 py-1 text-sm flex items-center gap-1.5 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-2 shadow-md' 
                            : 'hover:border-opacity-100'
                        }`}
                        style={isSelected ? { 
                          borderColor: sdgInfo.color,
                          backgroundColor: `${sdgInfo.color}15`,
                          color: sdgInfo.color
                        } : { borderColor: sdgInfo.color }}
                      >
                        <Image 
                          src={sdgInfo.image || ''} 
                          alt={`SDG ${sdgInfo.id}`}
                          width={16}
                          height={16}
                          className="w-4 h-4 flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <span className="font-semibold">SDG {sdgInfo.id}</span>
                        <span className="text-gray-600 dark:text-gray-400">{sdgInfo.title}</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Impact Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Hours
                  </label>
                  <Input
                    type="number"
                    value={hoursReported}
                    onChange={(e) => setHoursReported(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    min="0"
                    step="0.5"
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Users className="w-3 h-3 inline mr-1" />
                    People Reached
                  </label>
                  <Input
                    type="number"
                    value={peopleReached}
                    onChange={(e) => setPeopleReached(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    min="0"
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Users className="w-3 h-3 inline mr-1" />
                    Volunteers
                  </label>
                  <Input
                    type="number"
                    value={volunteersCount}
                    onChange={(e) => setVolunteersCount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    min="0"
                    className="h-9"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="h-9"
                  />
                  <Button type="button" onClick={handleAddTag} size="sm" className="h-9">
                    <X className="w-4 h-4 rotate-45" />
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

              {/* Visibility */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pin Post */}
              <div className="flex items-center space-x-2">
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
          </details>

          {/* Action Buttons */}
          <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsExpanded(false);
                if (onCancel) onCancel();
              }}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !content.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-6"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
