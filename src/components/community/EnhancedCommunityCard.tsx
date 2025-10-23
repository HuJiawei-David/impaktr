'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  MapPin, 
  Users, 
  Star,
  ChevronRight
} from 'lucide-react';
import { getSDGById } from '@/constants/sdgs';

interface EnhancedCommunityCardProps {
  community: {
    id: string;
    name: string;
    description: string;
    category: string;
    sdgFocus?: number[];
    memberCount: number;
    postCount: number;
    recentActivity: string;
    isPublic: boolean;
    isJoined?: boolean;
    bannerImage?: string;
    avatar?: string;
    tags?: string[];
    location?: {
      city: string;
      country: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    distance?: number;
    rating?: number;
    memberAvatars?: string[];
    primarySDG?: number;
  };
  onJoin?: (communityId: string) => void;
  onView?: (communityId: string) => void;
  onShare?: (communityId: string) => void;
}

export function EnhancedCommunityCard({ 
  community, 
  onJoin, 
  onView, 
  onShare 
}: EnhancedCommunityCardProps) {
  const primarySDG = community.primarySDG ? getSDGById(community.primarySDG) : null;
  const sdgTags = community.sdgFocus?.map(id => getSDGById(id)).filter(Boolean) || [];

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm">
      <div className="relative">
        {/* Community Banner Image */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg relative overflow-hidden">
          {community.bannerImage ? (
            <img 
              src={community.bannerImage} 
              alt={community.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-12 h-12 text-white opacity-50" />
            </div>
          )}
          
          {/* SDG Badge */}
          {primarySDG && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-white/90 text-gray-900 hover:bg-white">
                <img src={primarySDG.image} alt="" className="w-3 h-3 mr-1" />
                SDG {primarySDG.id}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Location (Meetup-style) */}
          <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {community.location?.city || 'Virtual'}, {community.location?.country || 'Global'}
            {community.distance && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                {community.distance}km away
              </span>
            )}
          </div>

          {/* Community Name */}
          <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
            {community.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {community.description}
          </p>

          {/* Member Count & Avatars */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {community.memberAvatars?.slice(0, 3).map((avatar, index) => (
                  <Avatar key={index} className="w-6 h-6 border-2 border-white">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-xs">
                      {community.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )) || (
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <Avatar key={i} className="w-6 h-6 border-2 border-white bg-gray-200">
                        <AvatarFallback className="text-xs">
                          {community.name.charAt(i - 1)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-600">
                {community.memberCount.toLocaleString()} members
              </span>
            </div>
            
            {/* Rating (if available) */}
            {community.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{community.rating}</span>
              </div>
            )}
          </div>

          {/* SDG Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {sdgTags.slice(0, 3).map((sdg) => (
              <Badge key={sdg?.id} variant="outline" className="text-xs">
                <img src={sdg?.image} alt="" className="w-3 h-3 mr-1" />
                {sdg?.title}
              </Badge>
            ))}
            {sdgTags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{sdgTags.length - 3} more
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onView?.(community.id);
              }}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              View Community
            </Button>
            {!community.isJoined && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin?.(community.id);
                }}
                variant="outline"
                size="sm"
              >
                Join
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
