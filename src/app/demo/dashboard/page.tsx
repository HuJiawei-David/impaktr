'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar,
  TrendingUp,
  Award,
  Users,
  Clock,
  MapPin,
  Plus,
  ChevronRight,
  Star,
  Target,
  Zap,
  Globe,
  Building2,
  Heart,
  ArrowUpRight,
  Eye,
  Share2,
  MessageCircle,
  ThumbsUp,
  User,
  Image as ImageIcon,
  Video,
  FileText,
  Calendar as CalendarIcon,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Trophy,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { getSDGById } from '@/constants/sdgs';

// Mock user data
const mockUser = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  image: '',
  userType: 'INDIVIDUAL',
  impactScore: 2347,
  hours: 87.5,
  badges: 12,
  rank: 2847,
  countryRank: 284,
  tier: 'Contributor',
  sdgFocus: [1, 3, 4, 11, 13, 17],
  location: 'San Francisco, USA'
};

const mockAchievements = [
  {
    id: '1',
    type: 'badge_earned',
    title: 'Community Champion',
    description: 'Earned the Community Champion badge for organizing 10+ local events',
    user: { name: 'Alex Johnson', image: '' },
    points: 500,
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    type: 'event_completed',
    title: 'Beach Cleanup Success!',
    description: 'Completed volunteering at Ocean Conservation Beach Cleanup',
    user: { name: 'Alex Johnson', image: '' },
    points: 250,
    timestamp: '1 day ago'
  },
  {
    id: '3',
    type: 'level_up',
    title: 'Level Up!',
    description: 'Reached Level 12 - Keep making an impact!',
    user: { name: 'Alex Johnson', image: '' },
    points: 1000,
    timestamp: '3 days ago'
  },
  {
    id: '4',
    type: 'milestone',
    title: '50 Hours Milestone',
    description: 'Achieved 50 volunteer hours total',
    user: { name: 'Alex Johnson', image: '' },
    points: 500,
    timestamp: '1 week ago'
  }
];

const mockUpcomingEvents = [
  {
    id: '1',
    title: 'Community Garden Planting',
    date: 'Tomorrow, 9:00 AM',
    location: 'Green Valley Park',
    organization: 'Green City Initiative',
    attendees: 24,
    category: 'Workshop'
  },
  {
    id: '2',
    title: 'Food Bank Volunteer Day',
    date: 'Mar 25, 2:00 PM',
    location: 'Downtown Community Center',
    organization: 'Community Care',
    attendees: 18,
    category: 'Volunteer'
  },
  {
    id: '3',
    title: 'Youth Mentorship Program',
    date: 'Mar 28, 4:00 PM',
    location: 'City Library',
    organization: 'Future Leaders',
    attendees: 12,
    category: 'Networking'
  },
  {
    id: '4',
    title: 'Health & Wellness Fair',
    date: 'Saturday, 9:00 AM',
    location: 'Community Center',
    organization: 'Community Health Champions',
    attendees: 120,
    category: 'Event'
  }
];

const mockFeaturedOrgs = [
  { id: '1', name: 'Ocean Conservancy', logo: '', members: '1,247', focus: 'Environment' },
  { id: '2', name: 'Green Earth Initiative', logo: '', members: '892', focus: 'Environment' },
  { id: '3', name: 'Community First', logo: '', members: '654', focus: 'Healthcare' },
  { id: '4', name: 'Future Leaders', logo: '', members: '432', focus: 'Education' }
];

const mockBadgeProgress = [
  { name: 'Event Hero', progress: 80, current: 8, total: 10, icon: '🎯' },
  { name: 'Time Champion', progress: 65, current: 65, total: 100, icon: '⏰' },
  { name: 'SDG Ambassador', progress: 40, current: 4, total: 10, icon: '🌍' }
];

export default function DemoDashboardPage() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [badgeTab, setBadgeTab] = useState('progress');

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'badge_earned': return 'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-gray-700';
      case 'level_up': return 'bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700';
      case 'milestone': return 'bg-purple-50 dark:bg-gray-800 border-purple-200 dark:border-gray-700';
      case 'event_completed': return 'bg-green-50 dark:bg-gray-800 border-green-200 dark:border-gray-700';
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'badge_earned': return '🏆';
      case 'level_up': return '⬆️';
      case 'milestone': return '🎉';
      case 'event_completed': return '✅';
      default: return '⭐';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Preview Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-white/30"></div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6" />
                <h1 className="text-xl font-semibold">Individual Dashboard Demo</h1>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Preview Mode
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compact Professional Header */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left: Profile Info */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Avatar className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                    <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                      AJ
                    </AvatarFallback>
                  </Avatar>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <div className="text-white text-center">
                      <User className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs font-medium">Edit</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {mockUser.name}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 normal-case">
                    Impact Contributor • Individual
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Globe className="w-3 h-3 mr-1" />
                      {mockUser.location}
                    </span>
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-2 font-medium">
                      ⚡ {mockUser.tier}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Right: Quick Stats & Actions */}
              <div className="flex items-center space-x-6">
                <div className="hidden md:flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{mockUser.impactScore.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Impact Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{mockUser.hours}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{mockUser.badges}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Badges</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="text-xs px-4 py-3 h-auto">
                    <User className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 text-xs px-4 py-3 h-auto"
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SDG Focus Areas */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Your SDG Focus Areas
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The UN Sustainable Development Goals you&apos;re passionate about
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mockUser.sdgFocus.map((sdgId: number) => {
                const sdg = getSDGById(sdgId);
                if (!sdg) return null;
                
                return (
                  <div
                    key={sdgId}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                      <Image 
                        src={sdg.image} 
                        alt={`SDG ${sdg.id}: ${sdg.title}`}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          SDG {sdg.id}
                        </span>
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sdg.color }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {sdg.title}
                      </p>
        </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* LinkedIn-style Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Stats & Featured Organizations */}
          <div className="lg:col-span-3 space-y-4">
            {/* Your Impact Stats */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-3 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {mockUser.impactScore.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Impact Score</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white text-center">{mockUser.hours}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">Hours</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white text-center">{mockUser.badges}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">Badges</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-2">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                </div>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Find Events
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    View Badges
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Badge Progress */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-2">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  Badge Progress
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white text-center">12</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">Earned</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white text-center">3</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">In Progress</div>
                  </div>
                </div>

                {/* View All Link */}
                <div className="mb-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    View All Badges
                  </Button>
                </div>

                {/* Badge Filter Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setBadgeTab('progress')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      badgeTab === 'progress'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => setBadgeTab('earned')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      badgeTab === 'earned'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Recently Earned
                  </button>
                </div>

                {/* Badge Cards */}
                <div className="space-y-3">
                  {badgeTab === 'progress' && (
                    <>
                      {/* Badge 1 - In Progress */}
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* SDG Badge - Top */}
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: '#E5243B' }}
                              >
                                <div className="text-xs font-bold">SDG</div>
                                <div className="text-sm font-bold leading-none">1</div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">
                                  No Poverty Supporter
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  SUPPORTER
                                </p>
                              </div>
                            </div>

                            {/* Progress - Bottom */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium text-blue-600">75%</span>
                              </div>
                              <Progress value={75} className="h-2" />
                              <div className="text-xs text-muted-foreground">
                                Need 1.5 more hours and 1 more activity
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Badge 2 - In Progress */}
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* SDG Badge - Top */}
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: '#3F7E44' }}
                              >
                                <div className="text-xs font-bold">SDG</div>
                                <div className="text-sm font-bold leading-none">13</div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">
                                  Climate Action Builder
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  BUILDER
                                </p>
                              </div>
                            </div>

                            {/* Progress - Bottom */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium text-yellow-600">45%</span>
                              </div>
                              <Progress value={45} className="h-2" />
                              <div className="text-xs text-muted-foreground">
                                Need 13 more hours
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Badge 3 - In Progress */}
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* SDG Badge - Top */}
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: '#C5192D' }}
                              >
                                <div className="text-xs font-bold">SDG</div>
                                <div className="text-sm font-bold leading-none">3</div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">
                                  Good Health Supporter
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  SUPPORTER
                                </p>
                              </div>
                            </div>

                            {/* Progress - Bottom */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium text-gray-600">30%</span>
                              </div>
                              <Progress value={30} className="h-2" />
                              <div className="text-xs text-muted-foreground">
                                Need 3.5 more hours
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {badgeTab === 'earned' && (
                    <>
                      {/* Recently Earned Badge 1 */}
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* SDG Badge - Top */}
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: '#3F7E44' }}
                              >
                                <div className="text-xs font-bold">SDG</div>
                                <div className="text-sm font-bold leading-none">13</div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm flex items-center">
                                  Climate Action Supporter
                                  <Star className="w-3 h-3 ml-1 text-yellow-500 fill-current" />
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  SUPPORTER
                                </p>
                              </div>
                            </div>

                            {/* Earned Badge */}
                            <Badge variant="success" className="text-xs px-2 py-1 w-fit flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Earned
                            </Badge>

                            {/* Next Tier */}
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                                Next: Climate Action Builder
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Need 25 hours and 3 activities
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recently Earned Badge 2 */}
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* SDG Badge - Top */}
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: '#C5192D' }}
                              >
                                <div className="text-xs font-bold">SDG</div>
                                <div className="text-sm font-bold leading-none">4</div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm flex items-center">
                                  Quality Education Builder
                                  <Star className="w-3 h-3 ml-1 text-yellow-500 fill-current" />
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  BUILDER
                                </p>
                              </div>
                            </div>

                            {/* Earned Badge */}
                            <Badge variant="success" className="text-xs px-2 py-1 w-fit flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Earned
                            </Badge>

                            {/* Next Tier */}
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                                Next: Quality Education Champion
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Need 100 hours and 10 activities
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Call to Action */}
                <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm">Keep Building Impact!</h4>
                      <p className="text-xs text-muted-foreground">
                        Join more events to unlock new badges and progress your existing ones
                      </p>
                    </div>
                    <Button size="sm" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3">
                      Find Events
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Organizations */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-900 dark:text-white">Featured Organizations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockFeaturedOrgs.map((org) => (
                  <div key={org.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-transparent hover:shadow-md cursor-pointer group transition-all">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {org.name.split(' ').map((word: string) => word[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {org.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          org.focus === 'Environment'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : org.focus === 'Healthcare'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : org.focus === 'Education'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {org.focus}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {org.members} members
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                      >
                        <UserPlus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                  >
                    Discover More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed - Center */}
          <div className="lg:col-span-6 space-y-4">
            {/* Create Post - LinkedIn Style */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                {!showCreatePost ? (
                  <>
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                          AJ
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
                        <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium">Photo</span>
                      </Button>
                      <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowCreatePost(true)}>
                        <Video className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium">Video</span>
                      </Button>
                      <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowCreatePost(true)}>
                        <CalendarIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium">Event</span>
                      </Button>
                      <Button variant="ghost" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowCreatePost(true)}>
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium">Article</span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                            AJ
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{mockUser.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Individual</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setShowCreatePost(false); setNewPostContent(''); }}>
                        ✕
                      </Button>
                    </div>
                    <Textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What do you want to talk about?"
                      className="min-h-[120px] border-0 focus-visible:ring-0 text-base"
                      autoFocus
                    />
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <ImageIcon className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Video className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <FileText className="w-5 h-5" />
                        </Button>
                      </div>
                      <Button disabled={!newPostContent.trim()} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full px-6">
                        Post
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievement Feed */}
            <div className="space-y-3">
              {mockAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm"
                >
                  {/* Post Header */}
                  <div className="flex items-start space-x-3 mb-3">
                    <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {achievement.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                          {achievement.user.name}
                        </h4>
                        <Badge className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Impact Contributor
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {achievement.timestamp}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {achievement.type === 'badge_earned' && <Award className="w-5 h-5 text-yellow-500" />}
                      {achievement.type === 'level_up' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                      {achievement.type === 'milestone' && <Target className="w-5 h-5 text-purple-500" />}
                      {achievement.type === 'event_completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-7 px-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Follow
                      </Button>
                    </div>
                  </div>

                  {/* Achievement Card */}
                  <div className={`${getAchievementColor(achievement.type)} rounded-lg p-4 mb-3 border`}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-bold text-gray-900 dark:text-gray-100">
                            {achievement.title}
                          </h5>
                        </div>
                        
                        <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                          {achievement.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-orange-500" />
                            <span>+{achievement.points} points</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interaction Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>12</span>
                      </button>
                      
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>3</span>
                      </button>
                      
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-yellow-600 transition-colors">
                        <Zap className="w-4 h-4" />
                        <span>8 Kudos</span>
                      </button>
                      
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>2</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Upcoming Events & Connections */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upcoming Events */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-900 dark:text-white">Upcoming Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockUpcomingEvents.map((event) => (
                  <div key={event.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent border-l-4 border-l-blue-500 cursor-pointer group hover:shadow-md transition-all">
                    <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                      {event.title}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location || 'TBD'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-3 h-3" />
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge className={`text-xs ${
                        event.category === 'Workshop' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : event.category === 'Networking'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : event.category === 'Event'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : event.category === 'Volunteer'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {event.category}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                  >
                    View All Events
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Impact Summary */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-2">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  Impact Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-transparent">
                    <span className="text-gray-500 dark:text-gray-400">Global Rank</span>
                    <span className="font-medium text-gray-900 dark:text-white">#{mockUser.rank.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-transparent">
                    <span className="text-gray-500 dark:text-gray-400">Country Rank</span>
                    <span className="font-medium text-gray-900 dark:text-white">#{mockUser.countryRank}</span>
                  </div>
                  <div className="flex justify-between text-xs bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-transparent">
                    <span className="text-gray-500 dark:text-gray-400">SDG Areas</span>
                    <span className="font-medium text-gray-900 dark:text-white">{mockUser.sdgFocus.length} SDGs</span>
          </div>
        </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Progress to Builder</span>
                    <span className="font-medium text-gray-900 dark:text-white">74%</span>
                  </div>
                  <Progress value={74} className="h-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">53 points needed</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Connections/Followers */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-2">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Recent Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex -space-x-2 mb-3">
                  <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-800">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">JD</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-800">
                    <AvatarFallback className="bg-green-500 text-white text-xs">SM</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-800">
                    <AvatarFallback className="bg-purple-500 text-white text-xs">AL</AvatarFallback>
                  </Avatar>
                  <div className="w-8 h-8 border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold">+12</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-transparent">
                  <p className="text-xs text-gray-600 dark:text-gray-400">15 new connections this week</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of individuals making a difference in their communities
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-6 h-auto">
                Sign Up Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 border-white hover:bg-white/90 text-lg px-8 py-6 h-auto">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-white/80 text-sm mt-6">
            No credit card required • Get started in minutes
          </p>
        </div>
      </div>
    </div>
  );
}
