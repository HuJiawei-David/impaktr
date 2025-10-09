'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  MessageCircle,
  Heart,
  Share2,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  Star,
  ThumbsUp,
  MessageSquare,
  Eye,
  Bookmark,
  Globe,
  Building2,
  Sparkles,
  UserPlus,
  Zap,
  TrendingUp,
  Award,
  Camera,
  Image,
  Hash,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('feed');
  const [feedFilter, setFeedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const communityGroups = [
    {
      id: 0,
      name: 'My Impact Community',
      description: 'A community I created to share my sustainability journey and connect with like-minded individuals. Join me in making a positive impact!',
      members: 1,
      posts: 1,
      category: 'Personal',
      image: '/api/placeholder/400/200',
      isJoined: true,
      recentActivity: 'Just now'
    },
    {
      id: 1,
      name: 'Environmental Action Network',
      description: 'Join thousands of eco-warriors making a difference through local environmental projects',
      members: 2847,
      posts: 156,
      category: 'Environment',
      image: '/api/placeholder/400/200',
      isJoined: true,
      recentActivity: '2 hours ago'
    },
    {
      id: 2,
      name: 'Youth Mentorship Circle',
      description: 'Connecting experienced professionals with young minds seeking guidance and support',
      members: 1923,
      posts: 89,
      category: 'Education',
      image: '/api/placeholder/400/200',
      isJoined: false,
      recentActivity: '4 hours ago'
    },
    {
      id: 3,
      name: 'Community Health Champions',
      description: 'Healthcare volunteers working together to improve community wellness and accessibility',
      members: 1456,
      posts: 203,
      category: 'Healthcare',
      image: '/api/placeholder/400/200',
      isJoined: true,
      recentActivity: '1 hour ago'
    }
  ];

  const recentPosts = [
    {
      id: 0,
      author: {
        name: 'You',
        avatar: session?.user?.image || '/api/placeholder/40/40',
        badge: 'You'
      },
      content: 'Just shared my latest impact story! Completed a community garden project with 20 volunteers. We planted 100 native plants and created a sustainable food source for our neighborhood. The sense of community and environmental impact was incredible! 🌱🌍',
      image: '/api/placeholder/500/300',
      timestamp: 'Just now',
      likes: 12,
      comments: 5,
      shares: 2,
      views: 47,
      group: 'Environmental Action Network'
    },
    {
      id: 1,
      author: {
        name: 'Sarah Chen',
        avatar: '/api/placeholder/40/40',
        badge: 'Eco Warrior'
      },
      content: 'Just organized our biggest beach cleanup yet! 🌊 Over 200 volunteers showed up and we collected 500kg of waste. The community spirit was incredible!',
      image: '/api/placeholder/500/300',
      timestamp: '2 hours ago',
      likes: 124,
      comments: 18,
      shares: 7,
      group: 'Environmental Action Network'
    },
    {
      id: 2,
      author: {
        name: 'Marcus Johnson',
        avatar: '/api/placeholder/40/40',
        badge: 'Mentor'
      },
      content: 'Proud to share that 15 students from our mentorship program just got accepted to their dream universities! 🎓 The future is bright.',
      timestamp: '4 hours ago',
      likes: 89,
      comments: 12,
      shares: 23,
      group: 'Youth Mentorship Circle'
    },
    {
      id: 3,
      author: {
        name: 'Dr. Lisa Park',
        avatar: '/api/placeholder/40/40',
        badge: 'Health Champion'
      },
      content: 'Free health screening event this Saturday at Community Center. We\'ve already helped 500+ people this month! Every volunteer makes a difference. 💪',
      timestamp: '6 hours ago',
      likes: 67,
      comments: 9,
      shares: 15,
      group: 'Community Health Champions'
    }
  ];

  const upcomingEvents = [
    {
      title: 'My Sustainability Workshop',
      date: 'Next Saturday, 2:00 PM',
      location: 'Local Community Center',
      attendees: 1,
      organizer: 'You',
      type: 'Workshop'
    },
    {
      title: 'Community Garden Workshop',
      date: 'Tomorrow, 10:00 AM',
      location: 'Green Valley Park',
      attendees: 45,
      organizer: 'Environmental Action Network',
      type: 'Workshop'
    },
    {
      title: 'Career Mentorship Meetup',
      date: 'Friday, 6:00 PM',
      location: 'Downtown Library',
      attendees: 28,
      organizer: 'Youth Mentorship Circle',
      type: 'Networking'
    },
    {
      title: 'Health & Wellness Fair',
      date: 'Saturday, 9:00 AM',
      location: 'Community Center',
      attendees: 120,
      organizer: 'Community Health Champions',
      type: 'Event'
    }
  ];

  const topContributors = [
    {
      name: 'Alex Chen',
      avatar: '/api/placeholder/32/32',
      points: 2847,
      contributions: 156,
      specialty: 'Environmental Projects'
    },
    {
      name: 'Maria Rodriguez',
      avatar: '/api/placeholder/32/32',
      points: 2456,
      contributions: 134,
      specialty: 'Community Outreach'
    },
    {
      name: 'David Kim',
      avatar: '/api/placeholder/32/32',
      points: 2234,
      contributions: 128,
      specialty: 'Youth Programs'
    }
  ];

  const discussions = [
    {
      title: "How to Start Your Own Community Garden - My Experience",
      replies: 0,
      lastActivity: "Just now",
      tags: ["SDG 11", "Community", "Sustainability"],
      author: "You"
    },
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
  ];

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Users className="w-8 h-8 mr-3 text-purple-600" />
              Community
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with fellow changemakers and share your impact journey
            </p>
          </div>

          {/* Community Stats Quick View */}
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold">12,847</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Members</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">2,456</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Active Today</div>
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search communities, posts, or people..."
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Posts</span>
                  <span className="font-semibold">2,456</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</span>
                  <span className="font-semibold">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">New This Week</span>
                  <span className="font-semibold">234</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Top SDG Focus</span>
                  <Badge variant="secondary">SDG 13</Badge>
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

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Upcoming Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {event.title}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-3 h-3" />
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger 
                  value="feed" 
                  className={`hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900 dark:hover:text-purple-300 transition-all duration-200 ${
                    activeTab === 'feed' 
                      ? 'text-purple-700 bg-purple-100 scale-110 border-b-2 border-purple-600 dark:text-purple-300 dark:bg-purple-900 dark:border-purple-400' 
                      : ''
                  }`}
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger 
                  value="communities" 
                  className={`hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900 dark:hover:text-purple-300 transition-all duration-200 ${
                    activeTab === 'communities' 
                      ? 'text-purple-700 bg-purple-100 scale-110 border-b-2 border-purple-600 dark:text-purple-300 dark:bg-purple-900 dark:border-purple-400' 
                      : ''
                  }`}
                >
                  Communities
                </TabsTrigger>
                <TabsTrigger 
                  value="events" 
                  className={`hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900 dark:hover:text-purple-300 transition-all duration-200 ${
                    activeTab === 'events' 
                      ? 'text-purple-700 bg-purple-100 scale-110 border-b-2 border-purple-600 dark:text-purple-300 dark:bg-purple-900 dark:border-purple-400' 
                      : ''
                  }`}
                >
                  Events
                </TabsTrigger>
                <TabsTrigger 
                  value="discussions" 
                  className={`hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900 dark:hover:text-purple-300 transition-all duration-200 ${
                    activeTab === 'discussions' 
                      ? 'text-purple-700 bg-purple-100 scale-110 border-b-2 border-purple-600 dark:text-purple-300 dark:bg-purple-900 dark:border-purple-400' 
                      : ''
                  }`}
                >
                  Discussions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-6">
                {/* Inline Post Creator */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar>
                        <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                        <AvatarFallback>
                          {session?.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-gray-600 dark:text-gray-400"
                        >
                          Share your impact with the community...
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                          <Image className="w-4 h-4 mr-2" />
                          Photo
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          Event
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                          <Award className="w-4 h-4 mr-2" />
                          Achievement
                        </Button>
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Posts Feed */}
                <div className="space-y-6">
                  {recentPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        {/* Post Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.author.avatar} alt={post.author.name} />
                              <AvatarFallback>{post.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {post.author.name}
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                  {post.author.badge}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {post.group} • {post.timestamp}
                              </p>
                            </div>
                          </div>
                          {post.author.name === 'You' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Post
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 hover:text-red-700 focus:text-red-700">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Post
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button variant="ghost" size="sm">
                              <Bookmark className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Post Content */}
                        <p className="text-gray-900 dark:text-white mb-4">
                          {post.content}
                        </p>

                        {/* Post Image */}
                        {post.image && (
                          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg mb-4 flex items-center justify-center">
                            <Camera className="w-12 h-12 text-gray-400" />
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between w-full">
                            <button className="flex items-center justify-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span className="text-sm">{post.likes}</span>
                            </button>
                            <button className="flex items-center justify-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors flex-1">
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-sm">{post.comments}</span>
                            </button>
                            <button className="flex items-center justify-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex-1">
                              <Share2 className="w-4 h-4" />
                              <span className="text-sm">{post.shares}</span>
                            </button>
                            {post.author.name === 'You' && post.views ? (
                              <div className="flex items-center justify-center space-x-1 text-gray-500 dark:text-gray-500 flex-1">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">{post.views}</span>
                              </div>
                            ) : (
                              <div className="flex-1"></div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="communities" className="space-y-6">
                {/* Community Groups */}
                <div className="grid grid-cols-1 gap-6">
                  {communityGroups.map((group) => (
                    <Card key={group.id} className="hover:shadow-lg transition-all duration-300">
                      <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-t-lg flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                              {group.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {group.description}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {group.category}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{group.members.toLocaleString()} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{group.posts} posts</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{group.recentActivity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button 
                            size="sm" 
                            className={group.isJoined ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {group.isJoined ? (
                              <>
                                <Heart className="w-4 h-4 mr-2" />
                                Joined
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Join
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                {/* Events */}
                <div className="grid grid-cols-1 gap-6">
                  {upcomingEvents.map((event, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-300">
                      <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-t-lg flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-green-600 dark:text-green-400" />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                              {event.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              Organized by {event.organizer}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {event.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{event.attendees} attending</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Calendar className="w-4 h-4 mr-2" />
                            Attend
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="discussions" className="space-y-6">
                {/* Discussion Topics */}
                <div className="grid gap-4">
                  {discussions.map((discussion, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold line-clamp-1">{discussion.title}</h3>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{discussion.lastActivity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">by {discussion.author}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">•</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{discussion.replies} replies</span>
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
            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <span>Top Contributors</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-bold text-gray-500 dark:text-gray-400 w-4">
                        {index + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contributor.avatar} alt={contributor.name} />
                        <AvatarFallback className="text-xs">
                          {contributor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {contributor.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {contributor.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {contributor.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {contributor.contributions} posts
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

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
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {org.name.split(' ').map(word => word[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{org.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{org.members} members • {org.focus}</p>
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
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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