'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Users, 
  MapPin, 
  Calendar,
  User,
  Building2,
  Heart,
  MessageCircle,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { getTierBadgeColor } from '@/lib/utils';
import { getSDGById } from '@/constants/sdgs';
import { toast } from 'react-hot-toast';

interface Follower {
  id: string;
  name: string;
  email: string;
  image?: string;
  userType: string;
  bio?: string;
  location?: string;
  sdgFocus: number[];
  tier: string;
  followedAt: string;
}

interface FollowersListProps {
  organizationId: string;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export function FollowersList({ organizationId, isAdmin = false, onRefresh }: FollowersListProps) {
  const router = useRouter();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchFollowers = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      console.log('Fetching followers for page:', pageNum, 'organization:', organizationId);
      const response = await fetch(`/api/organizations/${organizationId}/followers?page=${pageNum}&limit=20`);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch followers: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Followers data:', data);
      setFollowers(data.followers);
      setHasNext(data.pagination.hasNext);
      setHasPrev(data.pagination.hasPrev);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Error fetching followers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowers(page);
  }, [organizationId, page]);

  const getUserTypeDisplay = (userType: string) => {
    switch (userType) {
      case 'NGO':
        return 'NGO';
      case 'COMPANY':
        return 'Company';
      case 'INDIVIDUAL':
        return 'Individual';
      default:
        return 'Individual';
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'NGO':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'COMPANY':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'INDIVIDUAL':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTierName = (tier: string) => {
    // Handle organization tiers (IMPACT_STARTER -> Impact Starter)
    if (tier.includes('_')) {
      return tier.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    // Handle individual tiers (HELPER -> Helper)
    return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  };

  const handleMessageUser = (userId: string) => {
    router.push(`/messages?user=${userId}`);
  };

  const handleRemoveFollower = async (followerId: string, followerName: string) => {
    if (!isAdmin) return;
    
    if (!confirm(`Are you sure you want to remove ${followerName} from your followers? They will no longer be able to follow your organization.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/followers/${followerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to remove follower' }));
        throw new Error(errorData.error || 'Failed to remove follower');
      }

      toast.success('Follower removed successfully');
      // Refresh the followers list
      await fetchFollowers(page);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error removing follower:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove follower');
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center">
            <LoadingSpinner />
            <span className="mt-2 text-gray-600 dark:text-gray-400">Loading followers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
        <CardContent className="p-8">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Error Loading Followers
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button 
              onClick={() => fetchFollowers(page)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (followers.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
        <CardContent className="p-8">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              No Followers Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This organization doesn't have any followers yet. Be the first to follow!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Users className="w-5 h-5 text-blue-600" />
            Organization Followers
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'person' : 'people'} following this organization
          </p>
        </CardHeader>
      </Card>

      {/* Followers List */}
      <div className="grid gap-4">
        {followers.map((follower) => (
          <Card key={follower.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-700 dark:border dark:border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <Link href={`/profile/${follower.id}`}>
                  <Avatar className="w-12 h-12 cursor-pointer">
                    {follower.image ? (
                      <AvatarImage src={follower.image} alt={follower.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                        {follower.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Link>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/profile/${follower.id}`}>
                      <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {follower.name}
                      </h3>
                    </Link>
                    <Badge className={`text-xs px-3 py-1 ${getTierBadgeColor(follower.tier)}`}>
                      {formatTierName(follower.tier)}
                    </Badge>
                  </div>

                  {/* Bio */}
                  {follower.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {follower.bio}
                    </p>
                  )}

                  {/* Location */}
                  {follower.location && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      {follower.location}
                    </div>
                  )}

                  {/* SDG Focus */}
                  {follower.sdgFocus && follower.sdgFocus.length > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">SDGs:</span>
                      <div className="flex gap-1">
                        {follower.sdgFocus.slice(0, 3).map((sdgId) => {
                          const sdg = getSDGById(sdgId);
                          if (!sdg) return null;
                          return (
                            <div
                              key={sdgId}
                              className="w-6 h-6 rounded-full overflow-hidden shadow-sm"
                              style={{ backgroundColor: sdg.color }}
                              title={`SDG ${sdg.id}: ${sdg.title}`}
                            >
                              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                {sdg.id}
                              </div>
                            </div>
                          );
                        })}
                        {follower.sdgFocus.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              +{follower.sdgFocus.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Followed Date */}
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    Followed on {formatDate(follower.followedAt)}
                  </div>
                </div>
                
                {/* Action buttons for admins */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMessageUser(follower.id)}
                      className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Message user"
                    >
                      <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFollower(follower.id, follower.name)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      title="Remove follower"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {(hasNext || hasPrev) && (
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={!hasPrev}
                className="flex items-center gap-2"
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={!hasNext}
                className="flex items-center gap-2"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
