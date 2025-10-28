'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  ThumbsUp,
  Star,
  Award,
  Calendar,
  MapPin,
  Users,
  Clock,
  TrendingUp,
  Building2,
  UserPlus,
  MoreHorizontal,
  Flag,
  Bookmark,
  Copy
} from 'lucide-react';
import { getSDGById } from '@/constants/sdgs';
import Image from 'next/image';
import Link from 'next/link';
import { CreatePost } from '@/components/organization/CreatePost';

interface FeedItem {
  id: string;
  feedType: 'organization_post' | 'user_post';
  timestamp: string;
  
  // Common post fields
  content?: string;
  type?: string;
  visibility?: string;
  mediaUrls?: string[];
  imageUrl?: string;
  tags?: string[];
  location?: string;
  sdg?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Organization post fields
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
    logo?: string;
    slug?: string;
    tier?: string;
    type?: string;
  };
  postType?: string;
  images?: string[];
  videos?: string[];
  eventId?: string;
  event?: {
    id: string;
    title: string;
    startDate: string;
    imageUrl?: string;
  };
  sdgs?: number[];
  hoursReported?: number;
  peopleReached?: number;
  volunteersCount?: number;
  likes?: number;
  shares?: number;
  kudos?: number;
  comments?: Array<{
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
    createdAt: string;
  }>;
  reactions?: Array<{
    id: string;
    type: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  _count?: {
    comments: number;
    reactions: number;
  };

  // User post fields
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userTitle?: string;
  userType?: string;
  
  interactions?: {
    likes: number;
    comments: number;
    shares: number;
    userHasLiked: boolean;
  };
}

interface UnifiedFeedProps {
  type?: 'all' | 'organizations' | 'achievements' | 'following';
  limit?: number;
  showCreatePost?: boolean;
  organizationId?: string;
  isOrganizationAdmin?: boolean; // Only show create post if user is admin
}

export function UnifiedFeed({ type = 'all', limit = 20, showCreatePost = false, organizationId, isOrganizationAdmin = false }: UnifiedFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFeed();
  }, [type]);

  const fetchFeed = async (loadMore = false) => {
    try {
      setLoading(true);
      const currentOffset = loadMore ? offset : 0;
      
      const response = await fetch(`/api/feed/unified?type=${type}&limit=${limit}&offset=${currentOffset}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }
      
      const data = await response.json();
      
      if (loadMore) {
        setFeedItems(prev => [...prev, ...data.items]);
      } else {
        setFeedItems(data.items);
      }
      
      setHasMore(data.hasMore);
      setOffset(currentOffset + data.items.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchFeed(true);
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const currentReaction = userReactions[postId];
      
      if (currentReaction === reactionType) {
        // Remove reaction
        await fetch(`/api/organizations/posts/${postId}/reactions`, {
          method: 'DELETE',
        });
        setUserReactions(prev => {
          const newReactions = { ...prev };
          delete newReactions[postId];
          return newReactions;
        });
      } else {
        // Add/change reaction
        await fetch(`/api/organizations/posts/${postId}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: reactionType }),
        });
        setUserReactions(prev => ({
          ...prev,
          [postId]: reactionType
        }));
      }
      
      // Refresh the feed to get updated counts
      fetchFeed();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const postUrl = `${window.location.origin}/organizations/posts/${postId}`;
      await navigator.clipboard.writeText(postUrl);
      alert('Post link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleCopyLink = async (postId: string) => {
    try {
      const postUrl = `${window.location.origin}/organizations/posts/${postId}`;
      await navigator.clipboard.writeText(postUrl);
      alert('Post link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      // TODO: Implement bookmark functionality
      alert('Bookmark functionality coming soon!');
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleReport = async (postId: string) => {
    try {
      // TODO: Implement report functionality
      alert('Report functionality coming soon!');
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getPostTypeIcon = (postType: string) => {
    switch (postType) {
      case 'EVENT_ANNOUNCE': return <Calendar className="w-4 h-4" />;
      case 'EVENT_RECAP': return <Award className="w-4 h-4" />;
      case 'IMPACT_STORY': return <TrendingUp className="w-4 h-4" />;
      case 'ACHIEVEMENT': return <Star className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const getPostTypeColor = (postType: string) => {
    switch (postType) {
      case 'EVENT_ANNOUNCE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'EVENT_RECAP': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'IMPACT_STORY': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ACHIEVEMENT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'badge_earned': return <Award className="w-4 h-4 text-yellow-500" />;
      case 'milestone_reached': return <Star className="w-4 h-4 text-blue-500" />;
      case 'certificate_earned': return <Award className="w-4 h-4 text-green-500" />;
      default: return <TrendingUp className="w-4 h-4 text-purple-500" />;
    }
  };

  const formatOrgTier = (tier: string) => {
    switch (tier) {
      case 'IMPACT_STARTER': return 'Impact Starter';
      case 'COMMUNITY_BUILDER': return 'Community Builder';
      case 'IMPACT_DRIVER': return 'Impact Driver';
      case 'COMMUNITY_ALLY': return 'Community Ally';
      case 'CSR_PRACTITIONER': return 'CSR Practitioner';
      case 'CSR_LEADER': return 'CSR Leader';
      case 'ESG_CHAMPION': return 'ESG Champion';
      case 'TRUSTED_PARTNER': return 'Trusted Partner';
      case 'INDUSTRY_BENCHMARK': return 'Industry Benchmark';
      case 'GLOBAL_IMPACT_LEADER': return 'Global Impact Leader';
      default: return tier;
    }
  };

  const formatUserTier = (tier: string) => {
    switch (tier) {
      case 'HELPER': return 'Helper';
      case 'SUPPORTER': return 'Supporter';
      case 'CONTRIBUTOR': return 'Contributor';
      case 'BUILDER': return 'Builder';
      case 'ADVOCATE': return 'Advocate';
      case 'CHANGEMAKER': return 'Changemaker';
      case 'MENTOR': return 'Mentor';
      case 'LEADER': return 'Leader';
      case 'AMBASSADOR': return 'Ambassador';
      case 'GLOBAL_CITIZEN': return 'Global Citizen';
      default: return tier;
    }
  };

  if (loading && feedItems.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={() => fetchFeed()} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Post Interface - Only for Organization Admins */}
      {showCreatePost && organizationId && isOrganizationAdmin && (
        <CreatePost 
          organizationId={organizationId}
          onPostCreated={() => fetchFeed()}
        />
      )}
      
      {feedItems.map((item) => (
        <Card key={item.id} className="border-0 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            {item.feedType === 'organization_post' ? (
              // Organization Post
              <div>
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={item.organization?.logo} alt={item.organization?.name} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {item.organization?.name?.split(' ').map(word => word[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/organizations/${item.organization?.id}`}>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                            {item.organization?.name}
                          </h4>
                        </Link>
                        {item.organization?.tier && (
                          <Badge className="text-xs px-2 py-0.5 bg-blue-600 dark:bg-blue-700 text-white border-0">
                            {formatOrgTier(item.organization.tier)}
                          </Badge>
                        )}
                        {item.postType && (
                          <Badge className={`text-xs px-2 py-0.5 ${getPostTypeColor(item.postType)}`}>
                            {getPostTypeIcon(item.postType)}
                            <span className="ml-1">{item.postType.replace('_', ' ')}</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(item.timestamp)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyLink(item.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBookmark(item.id)}>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReport(item.id)} className="text-red-600">
                        <Flag className="w-4 h-4 mr-2" />
                        Report Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Post Content */}
                {item.content && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {item.content}
                  </p>
                )}

                {/* Event Link */}
                {item.event && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3">
                      {item.event.imageUrl && (
                        <Image
                          src={item.event.imageUrl}
                          alt={item.event.title}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h5 className="font-medium text-blue-900 dark:text-blue-100">
                          {item.event.title}
                        </h5>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {new Date(item.event.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Images */}
                {item.images && item.images.length > 0 && (
                  <div className="mb-4">
                    {item.images.length === 1 ? (
                      <Image
                        src={item.images[0]}
                        alt="Post image"
                        width={600}
                        height={400}
                        className="w-full h-auto rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {item.images.slice(0, 4).map((image, index) => (
                          <Image
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            width={300}
                            height={200}
                            className="w-full h-32 rounded-lg object-cover"
                          />
                        ))}
                        {item.images.length > 4 && (
                          <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">
                              +{item.images.length - 4} more
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Impact Metrics */}
                {(item.hoursReported || item.peopleReached || item.volunteersCount) && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h6 className="font-medium text-green-900 dark:text-green-100 mb-2">Impact Summary</h6>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {item.hoursReported && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 dark:text-green-300">
                            {item.hoursReported} hours
                          </span>
                        </div>
                      )}
                      {item.peopleReached && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 dark:text-green-300">
                            {item.peopleReached} people reached
                          </span>
                        </div>
                      )}
                      {item.volunteersCount && (
                        <div className="flex items-center space-x-1">
                          <UserPlus className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 dark:text-green-300">
                            {item.volunteersCount} volunteers
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SDG Tags */}
                {item.sdgs && item.sdgs.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.sdgs.map((sdgId) => {
                      const sdg = getSDGById(sdgId);
                      return sdg ? (
                        <Badge
                          key={sdgId}
                          variant="outline"
                          className="text-xs px-2 py-1"
                          style={{ borderColor: sdg.color }}
                        >
                          <Image src={sdg.image} alt="" width={12} height={12} className="w-3 h-3 mr-1" />
                          SDG {sdg.id}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Post Interactions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-6">
                    <button 
                      onClick={() => handleReaction(item.id, 'LIKE')}
                      className={`flex items-center space-x-1 transition-colors ${
                        item.interactions?.userHasLiked 
                          ? 'text-red-600' 
                          : 'text-gray-500 hover:text-red-600'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      <span>{item.interactions?.likes || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>{item.interactions?.comments || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleShare(item.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{item.interactions?.shares || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // User Post
              <div>
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={item.userAvatar} alt={item.userName} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {item.userName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/profile/${item.userId}`}>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                            {item.userName}
                          </h4>
                        </Link>
                        {item.userTitle && (
                          <Badge className="text-xs px-2 py-0.5 bg-purple-600 dark:bg-purple-700 text-white border-0">
                            {formatUserTier(item.userTitle)}
                          </Badge>
                        )}
                        {/* Debug info - remove after testing */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-red-500">
                            Debug: userTitle={item.userTitle || 'undefined'}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(item.timestamp)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyLink(item.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBookmark(item.id)}>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReport(item.id)} className="text-red-600">
                        <Flag className="w-4 h-4 mr-2" />
                        Report Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Post Content */}
                {item.content && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {item.content}
                  </p>
                )}

                {/* Images */}
                {item.mediaUrls && item.mediaUrls.length > 0 && (
                  <div className="mb-4">
                    {item.mediaUrls.length === 1 ? (
                      <Image
                        src={item.mediaUrls[0]}
                        alt="Post image"
                        width={600}
                        height={400}
                        className="w-full h-auto rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {item.mediaUrls.slice(0, 4).map((image, index) => (
                          <Image
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            width={300}
                            height={200}
                            className="w-full h-32 rounded-lg object-cover"
                          />
                        ))}
                        {item.mediaUrls.length > 4 && (
                          <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">
                              +{item.mediaUrls.length - 4} more
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-2 py-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Post Interactions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-6">
                    <button 
                      onClick={() => handleReaction(item.id, 'LIKE')}
                      className={`flex items-center space-x-1 transition-colors ${
                        item.interactions?.userHasLiked 
                          ? 'text-red-600' 
                          : 'text-gray-500 hover:text-red-600'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      <span>{item.interactions?.likes || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>{item.interactions?.comments || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleShare(item.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{item.interactions?.shares || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button 
            onClick={handleLoadMore}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Loading...' : 'Load More Posts'}
          </Button>
        </div>
      )}

      {feedItems.length === 0 && !loading && (
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              No posts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Be the first to share an update or achievement!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
