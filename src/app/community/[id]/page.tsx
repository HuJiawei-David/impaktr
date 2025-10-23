'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
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
  MoreHorizontal
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'events' | 'resources' | 'about'>('feed');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }
    fetchCommunity();
  }, [session, status, communityId]);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/communities/${communityId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch community');
      }
      const data = await response.json();
      setCommunity(data.community);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
              <img 
                src={community.bannerImage} 
                alt={community.name}
                className="w-full h-full object-cover"
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
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-4 flex-1">
                        {/* Name and Privacy */}
                        <div className="flex items-start gap-3 flex-wrap">
                          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                            {community.name}
                          </h1>
                          <Badge 
                            className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 ${getPrivacyColor(community.privacy)}`}
                          >
                            {getPrivacyIcon(community.privacy)}
                            <span>{community.privacy}</span>
                          </Badge>
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

                      {/* Action Buttons */}
                      <div className="flex lg:flex-col items-start gap-2">
                        {community.isJoined ? (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={handleLeave}
                              className="w-full lg:w-auto whitespace-nowrap border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Joined
                            </Button>
                            {community.userRole && ['OWNER', 'ADMIN'].includes(community.userRole) && (
                              <Button 
                                variant="outline" 
                                className="w-full lg:w-auto whitespace-nowrap border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                            className="w-full lg:w-auto whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all"
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
                          className="w-full lg:w-auto whitespace-nowrap border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
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
            variant={activeTab === 'events' ? 'default' : 'outline'}
            onClick={() => setActiveTab('events')}
            className={`rounded-full px-6 py-2 ${
              activeTab === 'events' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Events
          </Button>
          <Button
            variant={activeTab === 'resources' ? 'default' : 'outline'}
            onClick={() => setActiveTab('resources')}
            className={`rounded-full px-6 py-2 ${
              activeTab === 'resources' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Star className="w-4 h-4 mr-2" />
            Resources ({community.resourceCount})
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
                <Card>
                  <CardContent className="p-12 text-center">
                    <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Private Community</h3>
                    <p className="text-muted-foreground mb-6">
                      This is a private community. You need to be a member to view the feed.
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
              {/* Post Composer */}
              {community.isJoined && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={session?.user?.image || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {session?.user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <textarea
                          placeholder="Share something with the community..."
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                          rows={3}
                        />
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Plus className="w-4 h-4 mr-1" />
                              Image
                            </Button>
                            <Button variant="outline" size="sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              Event
                            </Button>
                          </div>
                          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Posts */}
              <div className="space-y-4">
                {community.posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.user.image} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {post.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{post.user.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {post.user.tier}
                            </Badge>
                            {post.isPinned && (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                                <Pin className="w-3 h-3 mr-1" />
                                Pinned
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-3">
                            {post.content}
                          </p>
                          {post.imageUrl && (
                            <img 
                              src={post.imageUrl} 
                              alt="Post image"
                              className="w-full max-w-md rounded-lg mb-3"
                            />
                          )}
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {post.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {community.members.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.user.image} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {member.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{member.user.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {member.user.tier}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.user.impactScore.toLocaleString()} pts
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {community.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {community.description}
                    </p>
                  </CardContent>
                </Card>

                {community.rules.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Community Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {community.rules.map((rule, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Community Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Category</h4>
                      <Badge variant="outline">{community.category}</Badge>
                    </div>
                    
                    {community.sdgFocus.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">SDG Focus</h4>
                        <div className="flex flex-wrap gap-1">
                          {community.sdgFocus.map((sdg) => (
                            <Badge key={sdg} variant="secondary" className="text-xs">
                              SDG {sdg}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {community.location && (
                      <div>
                        <h4 className="font-semibold mb-2">Location</h4>
                        <p className="text-sm text-muted-foreground">{community.location}</p>
                      </div>
                    )}

                    {community.language && (
                      <div>
                        <h4 className="font-semibold mb-2">Language</h4>
                        <p className="text-sm text-muted-foreground">{community.language}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Created By</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={community.createdByUser.image} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {community.createdByUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{community.createdByUser.name}</h4>
                        <p className="text-sm text-muted-foreground">Community Owner</p>
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