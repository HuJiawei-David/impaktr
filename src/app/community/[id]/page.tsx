'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users,
  MessageCircle,
  Calendar,
  Globe,
  Lock,
  Settings,
  Plus,
  Share2,
  UserPlus,
  CheckCircle,
  Star,
  Pin,
  MoreHorizontal,
  Search,
  MapPin,
  Award,
  Clock,
  Building2,
  Heart
} from 'lucide-react';
import { getSDGById } from '@/constants/sdgs';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  sdgFocus: number[];
  privacy: string;
  isPublic: boolean;
  bannerImage?: string;
  avatar?: string;
  tags: string[];
  rules: string[];
  location?: string;
  language?: string;
  memberCount: number;
  postCount: number;
  resourceCount: number;
  isJoined: boolean;
  userRole: string | null;
  isModerator: boolean;
  moderatorRole: string | null;
  createdBy: string;
  createdAt: string;
  memberAvatars?: string[];
  createdByUser: {
    id: string;
    name: string;
    image?: string;
  };
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      image?: string;
      impactScore: number;
      tier: string;
    };
  }>;
  moderators: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  posts: Array<{
    id: string;
    content: string;
    type: string;
    imageUrl?: string;
    mediaUrls: string[];
    tags: string[];
    isPinned: boolean;
    createdAt: string;
    user: {
      id: string;
      name: string;
      image?: string;
      impactScore: number;
      tier: string;
    };
  }>;
  resources: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    url?: string;
    fileUrl?: string;
    createdAt: string;
    uploader: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
}

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'about'>('feed');
  const [joining, setJoining] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  const fetchCommunity = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/communities/${communityId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch community');
      }
        const data = await response.json();
        
        // Add some seed posts for demonstration
        const communityWithPosts = {
          ...data.community,
          posts: [
            {
              id: '1',
              content: 'Just completed our community beach cleanup event! 🌊♻️ We collected over 200kg of waste and had 50+ volunteers join us. The impact we can make when we work together is incredible!',
              imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=400&fit=crop',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              isPinned: false,
              tags: ['beach-cleanup', 'environment', 'volunteer'],
              user: {
                id: 'user1',
                name: 'Sarah Chen',
                image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
                tier: 'Builder'
              }
            },
            {
              id: '2',
              content: 'Excited to announce our upcoming climate action workshop next Saturday! We\'ll be covering sustainable living practices and how to reduce your carbon footprint. All skill levels welcome!',
              createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
              isPinned: true,
              tags: ['workshop', 'climate-action', 'education'],
              user: {
                id: 'user2',
                name: 'Mike Rodriguez',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                tier: 'Contributor'
              }
            },
            {
              id: '3',
              content: 'Thank you to everyone who participated in our tree planting initiative! 🌳 We successfully planted 100 native trees in the local park. Every tree counts in our fight against climate change.',
              imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              isPinned: false,
              tags: ['tree-planting', 'climate-change', 'community'],
              user: {
                id: 'user3',
                name: 'Emma Thompson',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
                tier: 'Champion'
              }
            },
            {
              id: '4',
              content: 'Just finished reading "Drawdown" - highly recommend it to anyone interested in climate solutions! The book outlines 100 solutions to reverse global warming. What are you all reading lately?',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
              isPinned: false,
              tags: ['book-recommendation', 'climate-solutions', 'discussion'],
              user: {
                id: 'user4',
                name: 'David Kim',
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                tier: 'Contributor'
              }
            },
            {
              id: '5',
              content: 'Our community garden is thriving! 🥬🍅 Check out these beautiful organic vegetables we\'ve grown. If you\'re interested in sustainable agriculture, join us for our weekly gardening sessions.',
              imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop',
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
              isPinned: false,
              tags: ['community-garden', 'organic', 'sustainable-agriculture'],
              user: {
                id: 'user5',
                name: 'Lisa Wang',
                image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
                tier: 'Builder'
              }
            }
          ]
        };
        
        setCommunity(communityWithPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    try {
      setIsCreatingPost(true);
      const formData = new FormData();
      formData.append('content', newPostContent);
      formData.append('type', 'GENERAL');
      formData.append('visibility', 'PUBLIC');
      const res = await fetch('/api/social/posts', { method: 'POST', body: formData });
      if (res.ok) {
        setShowCreatePost(false);
        setNewPostContent('');
        // Refresh community data to show new post
        fetchCommunity();
      }
    } catch (e) {
      console.error('Error creating post:', e);
    } finally {
      setIsCreatingPost(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }
    fetchCommunity();
  }, [session, status, communityId, fetchCommunity, router]);

  const handleJoin = async () => {
    if (!community) return;
    
    try {
      setJoining(true);
      
      // Check if community is private
      if (!community.isPublic || community.privacy === 'PRIVATE' || community.privacy === 'INVITE_ONLY') {
        // Send join request for private communities
        const response = await fetch('/api/communities/request-join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ communityId: community.id })
        });

        if (!response.ok) {
          throw new Error('Failed to send join request');
        }

        alert('Join request sent! The community admin will review your request.');
      } else {
        // Join public community directly
        const response = await fetch('/api/communities/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ communityId: community.id })
        });

        if (!response.ok) {
          throw new Error('Failed to join community');
        }

        alert('Successfully joined the community!');
      }

      // Refresh community data
      await fetchCommunity();
    } catch (err) {
      console.error('Error joining community:', err);
      alert(err instanceof Error ? err.message : 'Failed to join community');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!community) return;
    
    try {
      const response = await fetch(`/api/communities/leave?communityId=${community.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to leave community');
      }

      // Refresh community data
      await fetchCommunity();
    } catch (err) {
      console.error('Error leaving community:', err);
      alert('Failed to leave community');
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'PUBLIC':
        return <Globe className="w-4 h-4" />;
      case 'PRIVATE':
        return <Lock className="w-4 h-4" />;
      case 'INVITE_ONLY':
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case 'PUBLIC':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PRIVATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'INVITE_ONLY':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading community..." />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Community Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'The community you\'re looking for doesn\'t exist or you don\'t have access to it.'}
            </p>
            <Button 
              onClick={() => router.push('/community')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Back to Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Community Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-64 md:h-80 relative overflow-hidden">
          {community.bannerImage ? (
            <>
              <Image 
                src={community.bannerImage} 
                alt={community.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 relative">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-7xl md:text-9xl font-bold opacity-20">
                  {community.name.charAt(0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Community Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 pb-6">
            <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl">
              <CardContent className="p-6">
                {/* Privacy Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  <Badge 
                    className={`px-2 py-1 text-xs font-medium flex items-center gap-1 ${getPrivacyColor(community.privacy)}`}
                  >
                    {getPrivacyIcon(community.privacy)}
                    <span>{community.privacy.charAt(0).toUpperCase() + community.privacy.slice(1).toLowerCase()}</span>
                  </Badge>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-75"></div>
                    <Avatar className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-gray-900 shadow-lg rounded-2xl">
                      <AvatarImage src={community.avatar} alt={community.name} />
                      <AvatarFallback className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl">
                        {community.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Community Details */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="flex items-start gap-3 flex-wrap">
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                          {community.name}
                        </h1>
                      </div>
                      
                      {/* Description */}
                      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
                        {community.description}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-6 text-base">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold">{community.memberCount}</span>
                          <span className="text-gray-500 dark:text-gray-400">members</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-semibold">{community.postCount}</span>
                          <span className="text-gray-500 dark:text-gray-400">posts</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            {new Date(community.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>

                      {/* SDG Alignments */}
                      {community.sdgFocus && community.sdgFocus.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {community.sdgFocus.map((sdgId) => {
                            const sdg = getSDGById(sdgId);
                            return (
                              <Badge 
                                key={sdgId} 
                                variant="outline" 
                                className="px-3 py-1 text-sm flex items-center gap-1.5"
                                style={{ borderColor: sdg?.color }}
                              >
                                <Image src={sdg?.image || ''} alt="" width={16} height={16} className="w-4 h-4" />
                                <span>{sdg?.title}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Tags */}
                      {community.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {community.tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Bottom Right of Profile Header */}
                <div className="flex justify-end mt-6">
                  <div className="flex items-center gap-3">
                    {community.isJoined ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={handleLeave}
                          className="whitespace-nowrap border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Joined
                        </Button>
                        {community.userRole && ['OWNER', 'ADMIN'].includes(community.userRole) && (
                          <Button 
                            variant="outline" 
                            className="whitespace-nowrap border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button 
                        onClick={handleJoin}
                        disabled={joining}
                        className="whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all"
                      >
                        {community.isPublic ? (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            {joining ? 'Joining...' : 'Join Community'}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            {joining ? 'Requesting...' : 'Request to Join'}
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      className="whitespace-nowrap border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Pill Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeTab === 'feed' ? 'default' : 'outline'}
            onClick={() => setActiveTab('feed')}
            className={`rounded-full px-6 py-2 ${
              activeTab === 'feed' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Feed
          </Button>
          <Button
            variant={activeTab === 'members' ? 'default' : 'outline'}
            onClick={() => setActiveTab('members')}
            className={`rounded-full px-6 py-2 ${
              activeTab === 'members' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Members ({community.memberCount})
          </Button>
          <Button
            variant={activeTab === 'about' ? 'default' : 'outline'}
            onClick={() => setActiveTab('about')}
            className={`rounded-full px-6 py-2 ${
              activeTab === 'about' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Globe className="w-4 h-4 mr-2" />
            About
          </Button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'feed' && (
            <>
              {!community.isJoined && !community.isPublic ? (
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                      <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Private Community</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      This is a private community. Join to view the feed and connect with members.
                    </p>
                    <Button 
                      onClick={handleJoin}
                      disabled={joining}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-6"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {joining ? 'Requesting...' : 'Request to Join'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {/* Post Composer - LinkedIn Style */}
                  {community.isJoined && (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardContent className="p-4">
                        {!showCreatePost ? (
                          <>
                            <div className="flex items-center space-x-3 mb-4">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={session?.user?.image || undefined} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                                  {session?.user?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <Button 
                                variant="outline" 
                                className="flex-1 justify-start text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 pl-4 rounded-full"
                                onClick={() => setShowCreatePost(true)}
                              >
                                Start a post...
                              </Button>
                            </div>
                            <div className="flex items-center justify-around pt-2 border-t border-gray-200 dark:border-gray-700">
                              <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowCreatePost(true)}>
                                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium">Photo</span>
                              </Button>
                              <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowCreatePost(true)}>
                                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium">Event</span>
                              </Button>
                              <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowCreatePost(true)}>
                                <Pin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium">Article</span>
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={session?.user?.image || undefined} />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                                    {session?.user?.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">{session?.user?.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Community Member</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => { setShowCreatePost(false); setNewPostContent(''); }}>
                                ✕
                              </Button>
                            </div>
                            <textarea
                              value={newPostContent}
                              onChange={(e) => setNewPostContent(e.target.value)}
                              placeholder="What do you want to talk about?"
                              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-base min-h-[120px]"
                              autoFocus
                            />
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <Plus className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <Calendar className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <Pin className="w-5 h-5" />
                                </Button>
                              </div>
                              <Button 
                                onClick={handleCreatePost} 
                                disabled={isCreatingPost || !newPostContent.trim()} 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full px-6"
                              >
                                {isCreatingPost ? 'Posting...' : 'Post'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Community Posts */}
                  {community.posts.length === 0 ? (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardContent className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                          <MessageCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No posts yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Be the first to share something with the community!
                        </p>
                        {community.isJoined && (
                          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Post
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {community.posts.map((post) => (
                        <Card key={post.id} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm">
                          <CardContent className="p-4">
                            {/* Post Header */}
                            <div className="flex items-start space-x-3 mb-3">
                              <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                                <AvatarImage src={post.user.image} />
                                <AvatarFallback className="bg-blue-500 text-white text-sm">
                                  {post.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                    {post.user.name}
                                  </h4>
                                  <Badge className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    {post.user.tier}
                                  </Badge>
                                  {post.isPinned && (
                                    <Badge className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                      <Pin className="w-3 h-3 mr-1" />
                                      Pinned
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(post.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-7 px-2"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Post Content */}
                            <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
                              {post.content}
                            </p>
                            
                            {/* Post Image */}
                            {post.imageUrl && (
                              <div className="mb-3 rounded-lg overflow-hidden">
                                <Image 
                                  src={post.imageUrl} 
                                  alt="Post image"
                                  width={600}
                                  height={400}
                                  className="w-full h-auto"
                                />
                              </div>
                            )}
                            
                            {/* Post Tags */}
                            {post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {post.tags.map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Interaction Buttons */}
                            <div className="flex items-center space-x-4">
                              <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                                <Heart className="w-4 h-4" />
                                <span>Like</span>
                              </button>
                              
                              <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span>Comment</span>
                              </button>
                              
                              <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600 transition-colors">
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'members' && (
            <>
              {!community.isJoined && !community.isPublic ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Private Community</h3>
                    <p className="text-muted-foreground mb-6">
                      This is a private community. You need to be a member to view members.
                    </p>
                    <Button 
                      onClick={handleJoin}
                      disabled={joining}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {joining ? 'Requesting...' : 'Request to Join'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          Community Members ({community.memberCount})
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Connect and collaborate with fellow members
                        </p>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Search */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search members by name, organization, or occupation..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Members List */}
                  <div className="space-y-4">
                    {community.members.length === 0 ? (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                          <p className="text-muted-foreground">
                            Be the first to join this community!
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {community.members.map((member) => (
                          <Card key={member.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                {/* Member Info */}
                                <div className="flex items-center space-x-4">
                                  <div className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all rounded-full">
                                    <Avatar className="w-14 h-14">
                                      <AvatarImage 
                                        src={member.user.image} 
                                        alt={member.user.name} 
                                      />
                                      <AvatarFallback className="text-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                        {member.user.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <h3 className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                        {member.user.name}
                                      </h3>
                                      <Badge variant="outline" className="text-xs">
                                        {member.user.tier}
                                      </Badge>
                                      {member.role === 'OWNER' && (
                                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                                          Owner
                                        </Badge>
                                      )}
                                      {member.role === 'ADMIN' && (
                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                          Admin
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                      <div className="flex items-center">
                                        <Star className="w-4 h-4 mr-1" />
                                        <span>Score: {member.user.impactScore.toLocaleString()}</span>
                                      </div>
                                      <div className="text-muted-foreground">
                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center h-10 px-4"
                                  >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Connect
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-10 px-4"
                                  >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Message
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      About {community.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                      {community.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Who Should Join Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      Who Should Join
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      This community is perfect for individuals who are passionate about {community.category.toLowerCase()} and want to make a meaningful impact. 
                      Whether you&apos;re a beginner looking to learn or an experienced advocate wanting to share your knowledge, 
                      we welcome anyone who shares our commitment to creating positive change.
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Passionate about {community.category.toLowerCase()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Committed to making a difference</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Open to learning and sharing</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What We Do Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      What We Do
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      Our {community.category.toLowerCase()} community brings together passionate individuals to create meaningful impact through collaborative initiatives and regular engagement.
                    </p>
                    
                    {/* SDG Focus Areas */}
                    {community.sdgFocus.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Our Focus Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {community.sdgFocus.map((sdgId) => {
                            const sdg = getSDGById(sdgId);
                            return (
                              <Badge 
                                key={sdgId} 
                                variant="outline" 
                                className="px-3 py-2 text-sm font-medium flex items-center gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                                style={{ borderColor: sdg?.color }}
                              >
                                <Image src={sdg?.image || ''} alt="" width={16} height={16} className="w-4 h-4" />
                                <span className="text-gray-700 dark:text-gray-300">{sdg?.title}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Community Interests/Tags */}
                    {community.tags.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Community Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {community.tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="px-3 py-1 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Community Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-red-600" />
                      Community Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {community.rules.length > 0 ? (
                      <ul className="space-y-3">
                        {community.rules.map((rule, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6">
                        <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">No specific guidelines set</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          This community follows general respectful behavior guidelines.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Simplified Community Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Community Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Category */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Category
                      </h4>
                      <Badge 
                        variant="outline" 
                        className="px-4 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                      >
                        {community.category}
                      </Badge>
                    </div>
                    
                    {/* SDG Focus */}
                    {community.sdgFocus.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          SDG Focus
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {community.sdgFocus.map((sdgId) => {
                            const sdg = getSDGById(sdgId);
                            return (
                              <Badge 
                                key={sdgId} 
                                variant="outline" 
                                className="px-3 py-2 text-sm font-medium flex items-center gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                                style={{ borderColor: sdg?.color }}
                              >
                                <Image src={sdg?.image || ''} alt="" width={16} height={16} className="w-4 h-4" />
                                <span className="text-gray-700 dark:text-gray-300">{sdg?.title}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Privacy Status */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Privacy
                      </h4>
                      <Badge 
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${getPrivacyColor(community.privacy)}`}
                      >
                        {getPrivacyIcon(community.privacy)}
                        <span>{community.privacy.charAt(0).toUpperCase() + community.privacy.slice(1).toLowerCase()}</span>
                      </Badge>
                    </div>

                    {/* Member Count & Avatars */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        Members
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {community.memberAvatars?.slice(0, 3).map((avatar: string, index: number) => (
                            <Avatar key={index} className="w-8 h-8 border-2 border-white dark:border-gray-900">
                              <AvatarImage src={avatar} />
                              <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                {community.name.charAt(index)}
                              </AvatarFallback>
                            </Avatar>
                          )) || (
                            <div className="flex -space-x-2">
                              {[1, 2, 3].map((i) => (
                                <Avatar key={i} className="w-8 h-8 border-2 border-white dark:border-gray-900 bg-gray-200">
                                  <AvatarFallback className="text-xs">
                                    {community.name.charAt(i - 1)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-pink-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {community.memberCount.toLocaleString()} members
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    {community.location && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Location
                        </h4>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{community.location}</span>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {community.tags && community.tags.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {community.tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="px-3 py-1 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Created By */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-purple-600" />
                      Created By
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={community.createdByUser.image} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {community.createdByUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{community.createdByUser.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Community Owner</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Created {new Date(community.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}