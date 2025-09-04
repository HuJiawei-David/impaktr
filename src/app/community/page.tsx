// home/ubuntu/impaktrweb/src/app/community/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Calendar,
  Filter,
  Search,
  Globe,
  MapPin,
  Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Feed } from '@/components/social/Feed';
import { PostCreator } from '@/components/social/PostCreator';
import { CommunityStats } from '@/components/community/CommunityStats';
import { TrendingTopics } from '@/components/community/TrendingTopics';
import { SuggestedConnections } from '@/components/community/SuggestedConnections';
import { CommunityLeaderboard } from '@/components/community/CommunityLeaderboard';

interface CommunityStats {
  totalPosts: number;
  totalMembers: number;
  activeToday: number;
  topSDG: number;
  engagement: number;
  newMembers: number;
}

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('feed');
  const [feedFilter, setFeedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/auth/signin');
      return;
    }

    fetchCommunityStats();
  }, [session, status]);

  const fetchCommunityStats = async () => {
    try {
      const response = await fetch('/api/community/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching community stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Users className="w-8 h-8 mr-3 text-primary" />
              Community
            </h1>
            <p className="text-muted-foreground">
              Connect with fellow changemakers and share your impact journey
            </p>
          </div>

          {/* Community Stats Quick View */}
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold">{stats?.totalMembers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Members</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{stats?.activeToday}</div>
              <div className="text-xs text-muted-foreground">Active Today</div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Growing
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search posts, people, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={feedFilter} onValueChange={setFeedFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="following">Following</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="achievements">Achievements</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Stats & Navigation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Posts</span>
                  <span className="font-semibold">{stats?.totalPosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Engagement Rate</span>
                  <span className="font-semibold">{stats?.engagement}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">New This Week</span>
                  <span className="font-semibold">{stats?.newMembers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Top SDG Focus</span>
                  <Badge variant="sdg" sdgNumber={stats?.topSDG || 13}>
                    SDG {stats?.topSDG}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Find Events
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Members
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  View Leaderboards
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Globe className="w-4 h-4 mr-2" />
                  Global Impact
                </Button>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <TrendingTopics />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="feed">Feed</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-6">
                {/* Post Creator */}
                <PostCreator 
                  onClose={() => {}} 
                  onPostCreated={() => window.location.reload()} 
                />

                {/* Feed */}
                <Feed 
                  feedType={feedFilter === 'following' ? 'following' : 'community'}
                  userId={session.user?.id}
                />
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                {/* Recent Achievements Feed */}
                <Feed 
                  feedType="community"
                  userId={session.user?.id}
                />
              </TabsContent>

              <TabsContent value="discussions" className="space-y-6">
                {/* Discussion Topics */}
                <div className="grid gap-4">
                  {[
                    {
                      title: "Climate Action Strategies for 2024",
                      replies: 23,
                      lastActivity: "2 hours ago",
                      tags: ["SDG 13", "Environment"],
                      author: "Green Initiative Malaysia"
                    },
                    {
                      title: "Best Practices for Corporate Volunteering Programs",
                      replies: 15,
                      lastActivity: "4 hours ago",
                      tags: ["Corporate", "CSR"],
                      author: "CSR Network"
                    },
                    {
                      title: "Youth Engagement in Social Impact",
                      replies: 31,
                      lastActivity: "6 hours ago",
                      tags: ["SDG 4", "Youth"],
                      author: "Youth Impact Coalition"
                    }
                  ].map((discussion, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold line-clamp-1">{discussion.title}</h3>
                          <span className="text-xs text-muted-foreground">{discussion.lastActivity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">by {discussion.author}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{discussion.replies} replies</span>
                          </div>
                          <div className="flex space-x-1">
                            {discussion.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Suggested Connections */}
            <SuggestedConnections userId={session.user?.id} />

            {/* Community Leaderboard */}
            <CommunityLeaderboard />

            {/* Featured Organizations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Featured Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "WWF Malaysia", members: "1.2K", focus: "Environment" },
                    { name: "UNICEF", members: "890", focus: "Children" },
                    { name: "Red Crescent", members: "2.1K", focus: "Healthcare" },
                  ].map((org, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {org.name.split(' ').map(word => word[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.members} members • {org.focus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Be respectful and supportive</p>
                  <p>• Share authentic impact stories</p>
                  <p>• Keep discussions constructive</p>
                  <p>• Respect privacy and confidentiality</p>
                  <p>• Report inappropriate content</p>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full">
                  Read Full Guidelines
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}