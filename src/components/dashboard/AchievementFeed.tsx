'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Trophy, 
  Award, 
  Calendar,
  Clock,
  Target,
  ThumbsUp,
  Zap,
  Users,
  TrendingUp,
  Star,
  ChevronRight,
  Plus,
  UserPlus
} from 'lucide-react';
import { getSDGById } from '@/constants/sdgs';

interface AchievementPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userTitle?: string;
  type: 'badge_earned' | 'level_up' | 'milestone' | 'event_completed';
  timestamp: string;
  achievement: {
    sdgNumber?: number;
    badgeName: string;
    tierLevel?: number;
    hours?: number;
    activities?: number;
    eventName?: string;
    description: string;
  };
  interactions: {
    likes: number;
    comments: number;
    shares: number;
    kudos: number;
    userHasLiked: boolean;
    userHasKudos: boolean;
  };
  comments?: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    timestamp: string;
  }>;
}

interface AchievementFeedProps {
  compact?: boolean;
  maxItems?: number;
}

export function AchievementFeed({ compact = false, maxItems = 10 }: AchievementFeedProps) {
  const [posts, setPosts] = useState<AchievementPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});

  const fetchAchievementFeed = useCallback(async () => {
    try {
      // Mock data for demonstration
      const mockPosts: AchievementPost[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'Sarah Chen',
          userAvatar: '',
          userTitle: 'Environmental Advocate',
          type: 'badge_earned',
          timestamp: '2024-01-15T10:30:00Z',
          achievement: {
            sdgNumber: 13,
            badgeName: 'Climate Guardian',
            tierLevel: 4,
            hours: 120,
            activities: 25,
            description: 'Completed 25 climate action activities and contributed 120+ hours to environmental causes!'
          },
          interactions: {
            likes: 24,
            comments: 5,
            shares: 3,
            kudos: 12,
            userHasLiked: false,
            userHasKudos: false
          },
          comments: [
            {
              id: 'c1',
              userId: 'user2',
              userName: 'Mike Johnson',
              userAvatar: '',
              content: 'Incredible achievement! Your dedication to climate action is inspiring 🌍',
              timestamp: '2024-01-15T11:00:00Z'
            },
            {
              id: 'c2',
              userId: 'user3',
              userName: 'Lisa Wang',
              userAvatar: '',
              content: 'Congrats Sarah! Love seeing your impact journey 💚',
              timestamp: '2024-01-15T11:15:00Z'
            }
          ]
        },
        {
          id: '2',
          userId: 'user4',
          userName: 'David Rodriguez',
          userAvatar: '',
          userTitle: 'Education Champion',
          type: 'level_up',
          timestamp: '2024-01-14T16:45:00Z',
          achievement: {
            badgeName: 'Reached Builder Level',
            description: 'Leveled up to Builder with 200 impact points! Ready to build even more positive change.',
          },
          interactions: {
            likes: 18,
            comments: 3,
            shares: 2,
            kudos: 8,
            userHasLiked: true,
            userHasKudos: false
          }
        },
        {
          id: '3',
          userId: 'user5',
          userName: 'Emma Thompson',
          userAvatar: '',
          userTitle: 'Health Advocate',
          type: 'milestone',
          timestamp: '2024-01-13T09:20:00Z',
          achievement: {
            badgeName: '100 Hours Milestone',
            hours: 100,
            description: 'Just hit 100 verified volunteer hours! Every hour makes a difference in our community.',
          },
          interactions: {
            likes: 31,
            comments: 7,
            shares: 4,
            kudos: 15,
            userHasLiked: false,
            userHasKudos: true
          }
        }
      ];
      
      setPosts(mockPosts.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching achievement feed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchAchievementFeed();
  }, [fetchAchievementFeed]);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          interactions: {
            ...post.interactions,
            likes: post.interactions.userHasLiked 
              ? post.interactions.likes - 1 
              : post.interactions.likes + 1,
            userHasLiked: !post.interactions.userHasLiked
          }
        };
      }
      return post;
    }));
  };

  const handleKudos = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          interactions: {
            ...post.interactions,
            kudos: post.interactions.userHasKudos 
              ? post.interactions.kudos - 1 
              : post.interactions.kudos + 1,
            userHasKudos: !post.interactions.userHasKudos
          }
        };
      }
      return post;
    }));
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'badge_earned': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'level_up': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'milestone': return <Target className="w-5 h-5 text-purple-500" />;
      case 'event_completed': return <Calendar className="w-5 h-5 text-green-500" />;
      default: return <Trophy className="w-5 h-5 text-orange-500" />;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'badge_earned': return 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800';
      case 'level_up': return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800';
      case 'milestone': return 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800';
      case 'event_completed': return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800';
      default: return 'from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-700';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return time.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Trophy className="w-5 h-5 mr-2" />
            Achievement Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const sdg = post.achievement.sdgNumber ? getSDGById(post.achievement.sdgNumber) : null;
        
        return (
          <div key={post.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm">
                {/* Post Header */}
                <div className="flex items-start space-x-3 mb-3">
                  <Link href={`/profile/${post.userId}`}>
                    <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                      <AvatarImage src={post.userAvatar} alt={post.userName} />
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {post.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link href={`/profile/${post.userId}`}>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                          {post.userName}
                        </h4>
                      </Link>
                      {post.userTitle && (
                        <Badge className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {post.userTitle}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(post.timestamp)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {getAchievementIcon(post.type)}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-7 px-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Follow
                    </Button>
                  </div>
                </div>

                {/* Achievement Card */}
                <div className={`bg-gradient-to-r ${getAchievementColor(post.type)} rounded-lg p-4 mb-3 border`}>
                  <div className="flex items-start space-x-3">
                    {sdg && (
                      <div
                        className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white font-bold text-xs shadow-sm"
                        style={{ backgroundColor: sdg.color }}
                      >
                        <div>SDG</div>
                        <div className="text-sm">{sdg.id}</div>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h5 className="font-bold text-gray-900 dark:text-white">
                          {post.achievement.badgeName}
                        </h5>
                        {post.achievement.tierLevel && (
                          <Badge className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                            Tier {post.achievement.tierLevel}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {post.achievement.description}
                      </p>
                      
                      {(post.achievement.hours || post.achievement.activities) && (
                        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                          {post.achievement.hours && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{post.achievement.hours} hours</span>
                            </div>
                          )}
                          {post.achievement.activities && (
                            <div className="flex items-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>{post.achievement.activities} activities</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interaction Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1 text-xs transition-colors ${
                        post.interactions.userHasLiked 
                          ? 'text-red-600' 
                          : 'text-gray-500 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.interactions.userHasLiked ? 'fill-current' : ''}`} />
                      <span>{post.interactions.likes}</span>
                    </button>
                    
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.interactions.comments}</span>
                    </button>
                    
                    <button
                      onClick={() => handleKudos(post.id)}
                      className={`flex items-center space-x-1 text-xs transition-colors ${
                        post.interactions.userHasKudos 
                          ? 'text-yellow-600' 
                          : 'text-gray-500 hover:text-yellow-600'
                      }`}
                    >
                      <Zap className={`w-4 h-4 ${post.interactions.userHasKudos ? 'fill-current' : ''}`} />
                      <span>{post.interactions.kudos} Kudos</span>
                    </button>
                    
                    <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>{post.interactions.shares}</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && post.comments && post.comments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="space-y-2">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-2">
                          <Link href={`/profile/${comment.userId}`}>
                            <Avatar className="w-6 h-6 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                              <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                              <AvatarFallback className="bg-gray-500 text-white text-xs">
                                {comment.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                              <Link href={`/profile/${comment.userId}`}>
                                <div className="font-medium text-xs text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer inline">
                                  {comment.userName}
                                </div>
                              </Link>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {comment.content}
                              </p>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-3">
                              {formatTimeAgo(comment.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
        );
      })}
      
      {/* Load More */}
      {!compact && posts.length >= maxItems && (
        <div className="text-center pt-4">
          <Button variant="ghost" size="sm">
            Load More Achievements
          </Button>
        </div>
      )}
    </div>
  );
}


