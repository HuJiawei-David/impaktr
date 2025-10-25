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
    likes?: number;
    replies?: Array<{
      id: string;
      userId: string;
      userName: string;
      userAvatar?: string;
      content: string;
      timestamp: string;
    }>;
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
  const [replyingTo, setReplyingTo] = useState<{postId: string, commentId?: string, replyId?: string, userName: string, isReplyToReply?: boolean} | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const fetchAchievementFeed = useCallback(async () => {
    try {
      // Mock data for demonstration
      const mockPosts: AchievementPost[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'Sarah Chen',
          userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
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
              userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
              content: 'Incredible achievement! Your dedication to climate action is inspiring 🌍',
              timestamp: '2024-01-15T11:00:00Z',
              likes: 3,
              replies: [
                {
                  id: 'r1',
                  userId: 'user1',
                  userName: 'Sarah Chen',
                  userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
                  content: 'Thank you Mike! It\'s been an amazing journey. The community support has been incredible!',
                  timestamp: '2024-01-15T11:15:00Z'
                },
                {
                  id: 'r2',
                  userId: 'user4',
                  userName: 'David Rodriguez',
                  userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
                  content: 'I\'m inspired to start my own climate journey! Any tips for beginners?',
                  timestamp: '2024-01-15T11:30:00Z'
                }
              ]
            },
            {
              id: 'c2',
              userId: 'user3',
              userName: 'Lisa Wang',
              userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
              content: 'Congrats Sarah! Love seeing your impact journey 💚',
              timestamp: '2024-01-15T11:15:00Z',
              likes: 2,
              replies: []
            }
          ]
        },
        {
          id: '2',
          userId: 'user4',
          userName: 'David Rodriguez',
          userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
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
          },
          comments: [
            {
              id: 'c8',
              userId: 'user1',
              userName: 'Sarah Chen',
              userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
              content: 'Congratulations David! Builder level is such an achievement. Can\'t wait to see what you build next! 🚀',
              timestamp: '2024-01-14T17:00:00Z',
              likes: 2,
              replies: []
            },
            {
              id: 'c9',
              userId: 'user3',
              userName: 'Lisa Wang',
              userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
              content: 'Amazing progress! What was the most impactful activity that helped you reach this level?',
              timestamp: '2024-01-14T17:15:00Z',
              likes: 1,
              replies: [
                {
                  id: 'r12',
                  userId: 'user4',
                  userName: 'David Rodriguez',
                  userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
                  content: 'The education workshops I organized were definitely the most impactful. Seeing students light up when they understand new concepts is incredible!',
                  timestamp: '2024-01-14T17:30:00Z'
                }
              ]
            }
          ]
        },
        {
          id: '3',
          userId: 'user5',
          userName: 'Emma Thompson',
          userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
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
          },
          comments: [
            {
              id: 'c10',
              userId: 'user2',
              userName: 'Mike Johnson',
              userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
              content: '100 hours is such a milestone! Your dedication to health advocacy is inspiring. What\'s been your favorite volunteer experience?',
              timestamp: '2024-01-13T10:00:00Z',
              likes: 3,
              replies: [
                {
                  id: 'r13',
                  userId: 'user5',
                  userName: 'Emma Thompson',
                  userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
                  content: 'The mental health awareness workshops have been the most rewarding. Seeing people open up and support each other is beautiful.',
                  timestamp: '2024-01-13T10:15:00Z'
                },
                {
                  id: 'r14',
                  userId: 'user1',
                  userName: 'Sarah Chen',
                  userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
                  content: 'Mental health is so important! I\'d love to learn more about your workshop approach.',
                  timestamp: '2024-01-13T10:30:00Z'
                }
              ]
            },
            {
              id: 'c11',
              userId: 'user6',
              userName: 'Alex Johnson',
              userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
              content: 'Congratulations Emma! 100 hours is incredible. Your impact on community health is amazing! 🏥',
              timestamp: '2024-01-13T11:00:00Z',
              likes: 2,
              replies: []
            }
          ]
        },
        {
          id: '4',
          userId: 'user6',
          userName: 'Alex Johnson',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
          userTitle: 'Community Builder',
          type: 'event_completed',
          timestamp: '2024-01-12T14:15:00Z',
          achievement: {
            badgeName: 'Community Impact Leader',
            eventName: 'Beach Cleanup Drive',
            hours: 8,
            activities: 1,
            description: 'Successfully organized and led a beach cleanup event with 50+ volunteers! Together we collected 200kg of waste and made our coastline cleaner.',
          },
          interactions: {
            likes: 42,
            comments: 12,
            shares: 8,
            kudos: 25,
            userHasLiked: false,
            userHasKudos: false
          },
          comments: [
            {
              id: 'c3',
              userId: 'user1',
              userName: 'Sarah Chen',
              userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
              content: 'Amazing work Alex! The impact you\'re making is incredible. I\'d love to collaborate on future environmental initiatives! 🌊',
              timestamp: '2024-01-12T15:00:00Z',
              likes: 5,
              replies: [
                {
                  id: 'r3',
                  userId: 'user6',
                  userName: 'Alex Johnson',
                  userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
                  content: 'Thank you Sarah! I\'d love to collaborate too. Your climate work has been so inspiring!',
                  timestamp: '2024-01-12T15:15:00Z'
                },
                {
                  id: 'r4',
                  userId: 'user2',
                  userName: 'Mike Johnson',
                  userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
                  content: 'Count me in for the next cleanup! When\'s the next event?',
                  timestamp: '2024-01-12T15:30:00Z'
                },
                {
                  id: 'r5',
                  userId: 'user1',
                  userName: 'Sarah Chen',
                  userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
                  content: 'Perfect! Let\'s plan something for next month. I\'ll reach out to coordinate!',
                  timestamp: '2024-01-12T15:45:00Z'
                }
              ]
            },
            {
              id: 'c4',
              userId: 'user3',
              userName: 'Lisa Wang',
              userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
              content: 'This is exactly what our community needs! Thank you for taking the initiative. The photos look amazing! 📸',
              timestamp: '2024-01-12T16:00:00Z',
              likes: 3,
              replies: [
                {
                  id: 'r6',
                  userId: 'user6',
                  userName: 'Alex Johnson',
                  userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
                  content: 'Thanks Lisa! The community response was overwhelming. Everyone was so enthusiastic!',
                  timestamp: '2024-01-12T16:15:00Z'
                }
              ]
            },
            {
              id: 'c5',
              userId: 'user4',
              userName: 'David Rodriguez',
              userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
              content: 'Incredible impact! 200kg is a huge amount. How did you manage to get so many volunteers?',
              timestamp: '2024-01-12T17:00:00Z',
              likes: 2,
              replies: [
                {
                  id: 'r7',
                  userId: 'user6',
                  userName: 'Alex Johnson',
                  userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
                  content: 'Social media was key! I posted on multiple platforms and the response was amazing. Also reached out to local schools and businesses.',
                  timestamp: '2024-01-12T17:15:00Z'
                },
                {
                  id: 'r8',
                  userId: 'user5',
                  userName: 'Emma Thompson',
                  userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
                  content: 'That\'s a great strategy! I\'d love to learn more about your outreach methods for my health initiatives.',
                  timestamp: '2024-01-12T17:30:00Z'
                }
              ]
            }
          ]
        },
        {
          id: '5',
          userId: 'user7',
          userName: 'Maria Garcia',
          userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
          userTitle: 'Social Impact Leader',
          type: 'badge_earned',
          timestamp: '2024-01-11T11:30:00Z',
          achievement: {
            sdgNumber: 1,
            badgeName: 'Poverty Alleviation Champion',
            tierLevel: 3,
            hours: 150,
            activities: 35,
            description: 'Earned the Poverty Alleviation Champion badge after completing 35 activities focused on reducing poverty and inequality in our community!',
          },
          interactions: {
            likes: 28,
            comments: 8,
            shares: 5,
            kudos: 18,
            userHasLiked: true,
            userHasKudos: true
          },
          comments: [
            {
              id: 'c6',
              userId: 'user1',
              userName: 'Sarah Chen',
              userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
              content: 'Maria, your dedication to fighting poverty is truly inspiring! This badge is so well-deserved. 🙏',
              timestamp: '2024-01-11T12:00:00Z',
              likes: 4,
              replies: [
                {
                  id: 'r9',
                  userId: 'user7',
                  userName: 'Maria Garcia',
                  userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
                  content: 'Thank you Sarah! It\'s been a journey, but seeing the impact we\'re making keeps me motivated.',
                  timestamp: '2024-01-11T12:15:00Z'
                }
              ]
            },
            {
              id: 'c7',
              userId: 'user4',
              userName: 'David Rodriguez',
              userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
              content: '35 activities is incredible! What types of initiatives have you been working on?',
              timestamp: '2024-01-11T13:00:00Z',
              likes: 2,
              replies: [
                {
                  id: 'r10',
                  userId: 'user7',
                  userName: 'Maria Garcia',
                  userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
                  content: 'Food drives, job training programs, financial literacy workshops, and community support networks. Each one has been so rewarding!',
                  timestamp: '2024-01-11T13:15:00Z'
                },
                {
                  id: 'r11',
                  userId: 'user6',
                  userName: 'Alex Johnson',
                  userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
                  content: 'The financial literacy workshops sound amazing! I\'d love to learn more about how you structure those.',
                  timestamp: '2024-01-11T13:30:00Z'
                }
              ]
            }
          ]
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
    console.log('AchievementFeed component loaded with enhanced features!');
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

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleReply = async (postId: string, commentId?: string, replyId?: string) => {
    if (!replyContent.trim()) return;
    
    try {
      setIsSubmittingReply(true);
      
      // For demo purposes, we'll just add the reply to the local state
      const newReply = {
        id: `reply_${Date.now()}`,
        content: replyContent,
        timestamp: new Date().toISOString(),
        userId: 'current_user',
        userName: 'You',
        userAvatar: ''
      };

      // Update the posts state with the new reply
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const updatedComments = post.comments?.map(comment => {
            if (commentId && comment.id === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply]
              };
            }
            return comment;
          }) || [];
          
          return {
            ...post,
            comments: updatedComments
          };
        }
        return post;
      }));

      // Reset reply state
      setReplyContent('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Error submitting reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
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
      case 'badge_earned': return 'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-gray-700';
      case 'level_up': return 'bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700';
      case 'milestone': return 'bg-purple-50 dark:bg-gray-800 border-purple-200 dark:border-gray-700';
      case 'event_completed': return 'bg-green-50 dark:bg-gray-800 border-green-200 dark:border-gray-700';
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
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
                    <div className="flex items-center justify-between">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(post.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Achievement Card */}
                <div className={`${getAchievementColor(post.type)} rounded-lg p-4 mb-3 border`}>
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
                        <h5 className="font-bold text-gray-900 dark:text-gray-100">
                          {post.achievement.badgeName}
                        </h5>
                        {post.achievement.tierLevel && (
                          <Badge className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                            Tier {post.achievement.tierLevel}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                        {post.achievement.description}
                      </p>
                      
                      {(post.achievement.hours || post.achievement.activities) && (
                        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-300">
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
                    
                    <button 
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/achievements/${post.id}`;
                        navigator.clipboard.writeText(shareUrl);
                        alert('Achievement link copied to clipboard!');
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{post.interactions.shares}</span>
                    </button>
                  </div>
                </div>

                {/* Add Comment Button */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => setReplyingTo({postId: post.id, userName: post.userName})}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Add a comment...</span>
                  </button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && post.comments && post.comments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="space-y-3">
                      {post.comments.map((comment) => (
                        <div key={comment.id}>
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={comment.userAvatar || undefined} />
                              <AvatarFallback className="text-xs bg-blue-500 text-white">
                                {comment.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {comment.userName}
                                  </h4>
                                  <Badge className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    Contributor
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs px-2 py-1 h-6 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                  <UserPlus className="w-3 h-3 mr-1" />
                                  Follow
                                </Button>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                                {comment.content}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTimeAgo(comment.timestamp)}
                                </p>
                                <div className="flex items-center space-x-3">
                                  <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                                    <Heart className="w-3 h-3" />
                                    <span>{comment.likes || 0}</span>
                                  </button>
                                  <button 
                                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                    onClick={() => setReplyingTo({postId: post.id, commentId: comment.id, userName: comment.userName})}
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Replies to this comment */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-11 mt-3">
                              {comment.replies.length > 2 && !expandedReplies.has(comment.id) ? (
                                <div className="space-y-3">
                                  {comment.replies.slice(0, 2).map((reply) => (
                                    <div key={reply.id} className="flex items-start space-x-3">
                                      <Avatar className="w-6 h-6 flex-shrink-0">
                                        <AvatarImage src={reply.userAvatar || undefined} />
                                        <AvatarFallback className="text-xs bg-green-500 text-white">
                                          {reply.userName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center space-x-2">
                                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                                              {reply.userName}
                                            </h4>
                                            <Badge className="text-xs px-1 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                              Supporter
                                            </Badge>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs px-1.5 py-0.5 h-5 hover:bg-green-50 dark:hover:bg-green-900/20"
                                          >
                                            <UserPlus className="w-2.5 h-2.5 mr-0.5" />
                                            Follow
                                          </Button>
                                        </div>
                                        <p className="text-xs text-gray-700 dark:text-gray-200 mb-1">
                                          {reply.content}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatTimeAgo(reply.timestamp)}
                                          </p>
                                          <div className="flex items-center space-x-3">
                                            <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                                              <Heart className="w-3 h-3" />
                                              <span>1</span>
                                            </button>
                                            <button 
                                              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                              onClick={() => setReplyingTo({postId: post.id, commentId: comment.id, replyId: reply.id, userName: reply.userName, isReplyToReply: true})}
                                            >
                                              Reply
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <button 
                                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                    onClick={() => toggleReplies(comment.id)}
                                  >
                                    View {comment.replies.length - 2} more replies
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="flex items-start space-x-3">
                                      <Avatar className="w-6 h-6 flex-shrink-0">
                                        <AvatarImage src={reply.userAvatar || undefined} />
                                        <AvatarFallback className="text-xs bg-green-500 text-white">
                                          {reply.userName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center space-x-2">
                                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                                              {reply.userName}
                                            </h4>
                                            <Badge className="text-xs px-1 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                              Supporter
                                            </Badge>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs px-1.5 py-0.5 h-5 hover:bg-green-50 dark:hover:bg-green-900/20"
                                          >
                                            <UserPlus className="w-2.5 h-2.5 mr-0.5" />
                                            Follow
                                          </Button>
                                        </div>
                                        <p className="text-xs text-gray-700 dark:text-gray-200 mb-1">
                                          {reply.content}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatTimeAgo(reply.timestamp)}
                                          </p>
                                          <div className="flex items-center space-x-3">
                                            <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                                              <Heart className="w-3 h-3" />
                                              <span>1</span>
                                            </button>
                                            <button 
                                              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                              onClick={() => setReplyingTo({postId: post.id, commentId: comment.id, replyId: reply.id, userName: reply.userName, isReplyToReply: true})}
                                            >
                                              Reply
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {comment.replies.length > 2 && (
                                    <button 
                                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                      onClick={() => toggleReplies(comment.id)}
                                    >
                                      Show less
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo && replyingTo.postId === post.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                          Y
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {replyingTo.isReplyToReply 
                            ? `Replying to ${replyingTo.userName}'s reply`
                            : `Replying to ${replyingTo.userName}`
                          }
                        </p>
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-sm min-h-[80px]"
                          rows={3}
                        />
                        <div className="flex items-center justify-end space-x-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                            disabled={isSubmittingReply}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReply(post.id, replyingTo.commentId, replyingTo.replyId)}
                            disabled={isSubmittingReply || !replyContent.trim()}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                          >
                            {isSubmittingReply ? 'Replying...' : 'Reply'}
                          </Button>
                        </div>
                      </div>
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


