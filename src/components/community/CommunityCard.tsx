'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users,
  MessageCircle,
  Calendar,
  Eye,
  Share2,
  UserPlus,
  CheckCircle,
  Globe,
  Lock,
  Star
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  sdgFocus?: number[];
  privacy?: string;
  memberCount: number;
  postCount: number;
  recentActivity?: string;
  isPublic: boolean;
  isJoined?: boolean;
  isCreatedByMe?: boolean;
  userRole?: string | null;
  bannerImage?: string;
  avatar?: string;
  tags?: string[];
  createdByUser?: {
    id: string;
    name: string;
    image?: string;
  };
}

interface CommunityCardProps {
  community: Community;
  onJoin?: (communityId: string) => void;
  onView?: (communityId: string) => void;
  onShare?: (communityId: string) => void;
}

export function CommunityCard({ 
  community, 
  onJoin, 
  onView, 
  onShare 
}: CommunityCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'environment':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'education':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'healthcare':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'social':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'technology':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'business':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200 cursor-pointer group overflow-visible">
      <CardContent className="p-0">
        {/* Banner */}
        <div className="relative h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
          {community.bannerImage ? (
            <Image 
              src={community.bannerImage} 
              alt={community.name}
              fill
              className="object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {community.name.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Owner Badge */}
          {community.isCreatedByMe && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold px-3 py-1 border-0 shadow-md">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Owner
              </Badge>
            </div>
          )}
          
          {/* Privacy Badge */}
          <div className="absolute top-2 right-2">
            {community.privacy === 'PUBLIC' ? (
              <Badge className="bg-white/90 text-gray-700 hover:bg-white/90">
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Badge>
            ) : community.privacy === 'PRIVATE' ? (
              <Badge className="bg-gray-800/90 text-white hover:bg-gray-800/90">
                <Lock className="w-3 h-3 mr-1" />
                Private
              </Badge>
            ) : (
              <Badge className="bg-purple-800/90 text-white hover:bg-purple-800/90">
                <Lock className="w-3 h-3 mr-1" />
                Invite Only
              </Badge>
            )}
          </div>

          {/* Community Avatar */}
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
            <Avatar className="w-14 h-14 border-4 border-white dark:border-gray-800">
              {community.avatar ? (
                <Image 
                  src={community.avatar} 
                  alt={community.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-base">
                  {community.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {community.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {community.description}
              </p>
            </div>
          </div>

          {/* Category Badge */}
          <div className="mb-3">
            <Badge className={`text-xs ${getCategoryColor(community.category)}`}>
              {community.category}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{formatMemberCount(community.memberCount)} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span>{community.postCount} posts</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{community.recentActivity}</span>
            </div>
          </div>

          {/* Tags */}
          {community.tags && community.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {community.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
              {community.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{community.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(community.id);
                }}
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.(community.id);
                }}
              >
                <Share2 className="w-3 h-3" />
              </Button>
            </div>
            
            {community.isJoined ? (
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin?.(community.id);
                }}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Joined
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin?.(community.id);
                }}
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Join
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
