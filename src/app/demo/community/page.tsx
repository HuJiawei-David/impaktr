'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
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
  Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

export default function CommunityDemo() {
  const communityGroups = [
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-white/30"></div>
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <h1 className="text-xl font-semibold">Community Demo</h1>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Preview Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-6 text-purple-200" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Join the Community
          </h1>
          <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
            Connect with like-minded impact makers. Share experiences, collaborate on projects, and amplify your social impact together.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search communities, posts, or people..."
                className="pl-12 pr-4 py-4 text-lg bg-white/10 border-white/20 text-white placeholder-white/60"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-purple-600 hover:bg-gray-100">
                Search
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-4 text-lg">
              <UserPlus className="w-5 h-5 mr-2" />
              Join Community
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Post
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Community Groups */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Communities
                </h2>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-8">
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
            </div>

            {/* Recent Posts */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Recent Posts
              </h2>

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
                        <Button variant="ghost" size="sm">
                          <Bookmark className="w-4 h-4" />
                        </Button>
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
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <ThumbsUp className="w-5 h-5" />
                            <span>{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            <MessageSquare className="w-5 h-5" />
                            <span>{post.comments}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span>{post.shares}</span>
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Community Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    12,847
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active Members
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    2,456
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Posts This Month
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    156
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Events Organized
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to join our community?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Connect with thousands of impact makers, share your journey, and collaborate on meaningful projects that create lasting change.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Join the Movement
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}







