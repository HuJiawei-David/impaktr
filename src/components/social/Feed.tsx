// home/ubuntu/impaktrweb/src/components/social/Feed.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Award, 
  Calendar,
  TrendingUp,
  MapPin,
  Users,
  ExternalLink,
  MoreHorizontal,
  Flag,
  Bookmark
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { PostCreator } from './PostCreator';

interface Post {
  id: string;
  type: 'event_joined' | 'badge_earned' | 'achievement' | 'general' | 'event_completed' | 'rank_up';
  content?: string;
  images: string[];
  user: {
    id: string;
    name: string;
    avatar: string;
    currentRank: string;
  };
  event?: {
    id: string;
    title: string;
    sdgTags: number[];
    location: {
      city: string;
      isVirtual: boolean;
    };
  };
  badge?: {
    id: string;
    name: string;
    sdgNumber: number;
    tier: string;
  };
  achievement?: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  likes: {
    id: string;
    userId: string;
  }[];
  comments: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      avatar: string;
    };
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface FeedProps {
  feedType?: 'all' | 'following' | 'community';
  userId?: string;
}

export function Feed({ feedType = 'all', userId }: FeedProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPosts();
  }, [feedType, userId]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (feedType) params.set('type', feedType);
      if (userId) params.set('userId', userId);

      const response = await fetch(`/api/social/posts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const isLiked = post.likes.some(like => like.userId === session.user?.id);
            return {
              ...post,
              likes: isLiked 
                ? post.likes.filter(like => like.userId !== session.user?.id)
                : [...post.likes, { id: Date.now().toString(), userId: session.user?.id! }]
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!session?.user || !newComment[postId]?.trim()) return;

    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment[postId].trim(),
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, comment]
            };
          }
          return post;
        }));
        setNewComment(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getPostContent = (post: Post) => {
    switch (post.type) {
      case 'event_joined':
        return {
          title: `${post.user.name} joined an event`,
          content: post.event?.title || '',
          subtitle: post.event ? `${post.event.location.city}${post.event.location.isVirtual ? ' (Virtual)' : ''}` : '',
          icon: <Calendar className="w-5 h-5 text-blue-500" />
        };
      
      case 'badge_earned':
        return {
          title: `${post.user.name} earned a new badge!`,
          content: post.badge?.name || '',
          subtitle: `SDG ${post.badge?.sdgNumber} - ${post.badge?.tier}`,
          icon: <Award className="w-5 h-5 text-green-500" />
        };
      
      case 'achievement':
        return {
          title: `${post.user.name} unlocked an achievement`,
          content: post.achievement?.name || '',
          subtitle: post.achievement?.description || '',
          icon: <TrendingUp className="w-5 h-5 text-purple-500" />
        };
      
      case 'rank_up':
        return {
          title: `${post.user.name} reached a new rank!`,
          content: post.user.currentRank,
          subtitle: 'Congratulations on your impact journey!',
          icon: <Award className="w-5 h-5 text-orange-500" />
        };
      
      case 'event_completed':
        return {
          title: `${post.user.name} completed an event`,
          content: post.event?.title || '',
          subtitle: 'Impact hours have been verified',
          icon: <Calendar className="w-5 h-5 text-green-500" />
        };
      
      default:
        return {
          title: post.user.name,
          content: post.content || '',
          subtitle: '',
          icon: null
        };
    }
  };

  const handleShare = async (post: Post) => {
    const shareData = {
      title: `${post.user.name}'s Impact Activity - Impaktr`,
      text: getPostContent(post).content,
      url: `${window.location.origin}/posts/${post.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      // Show toast notification
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-20 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Post Creator */}
      {session?.user && !userId && (
        <Card>
          <CardContent className="p-6">
            <div className="flex space-x-4">
              <Avatar>
                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                <AvatarFallback>
                  {getInitials(session.user.name || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => setShowPostCreator(true)}
                >
                  Share your impact journey...
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Creator Modal */}
      {showPostCreator && (
        <PostCreator
          onClose={() => setShowPostCreator(false)}
          onPostCreated={(newPost) => {
            setPosts(prev => [newPost, ...prev]);
            setShowPostCreator(false);
          }}
        />
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              {feedType === 'following' 
                ? "Follow some users to see their impact activities here"
                : "Start participating in events to share your impact journey"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => {
          const postContent = getPostContent(post);
          const isLiked = post.likes.some(like => like.userId === session?.user?.id);
          const showComments = expandedComments.has(post.id);

          return (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-3">
                    <Avatar>
                      <AvatarImage src={post.user.avatar} alt={post.user.name} />
                      <AvatarFallback>
                        {getInitials(post.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {postContent.icon}
                        <h4 className="font-medium">{postContent.title}</h4>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {post.user.currentRank}
                        </Badge>
                        <span>•</span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save Post
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Flag className="w-4 h-4 mr-2" />
                        Report Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Main Content */}
                <div className="space-y-3">
                  {postContent.content && (
                    <div>
                      <h3 className="font-semibold text-lg">{postContent.content}</h3>
                      {postContent.subtitle && (
                        <p className="text-muted-foreground">{postContent.subtitle}</p>
                      )}
                    </div>
                  )}

                  {post.content && post.type === 'general' && (
                    <p className="text-foreground">{post.content}</p>
                  )}

                  {/* SDG Tags */}
                  {post.event?.sdgTags && post.event.sdgTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.event.sdgTags.map((sdgNumber) => (
                        <Badge key={sdgNumber} variant="sdg" sdgNumber={sdgNumber} className="text-xs">
                          SDG {sdgNumber}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Images */}
                  {post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 max-w-md">
                      {post.images.slice(0, 4).map((image, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                          {index === 3 && post.images.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                              +{post.images.length - 4}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes.length}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1"
                      onClick={() => handleShare(post)}
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </Button>
                  </div>

                  {/* Engagement Summary */}
                  {(post.likes.length > 0 || post.comments.length > 0) && (
                    <div className="text-sm text-muted-foreground">
                      {post.likes.length > 0 && `${post.likes.length} ${post.likes.length === 1 ? 'like' : 'likes'}`}
                      {post.likes.length > 0 && post.comments.length > 0 && ' • '}
                      {post.comments.length > 0 && `${post.comments.length} ${post.comments.length === 1 ? 'comment' : 'comments'}`}
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                {showComments && (
                  <div className="pt-4 space-y-4">
                    {/* Add Comment */}
                    {session?.user && (
                      <div className="flex space-x-3">
                        {/* Comment form would go here */}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}