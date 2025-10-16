// home/ubuntu/impaktrweb/src/app/dashboard/page.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  Calendar as CalendarIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ImpaktrScore } from '@/components/dashboard/ImpaktrScore';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { BadgeProgress } from '@/components/dashboard/BadgeProgress';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { GamificationJourney } from '@/components/dashboard/GamificationJourney';
import { SDGBadgeCollection } from '@/components/dashboard/SDGBadgeCollection';
import { AchievementFeed } from '@/components/dashboard/AchievementFeed';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { FeaturedOrganizations } from '@/components/dashboard/FeaturedOrganizations';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { sdgs, getSDGById } from '@/constants/sdgs';
import Link from 'next/link';

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  languages?: string[];
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  occupation?: string;
  organization?: string;
  sdgFocus?: number[];
  isPublic?: boolean;
  showEmail?: boolean;
  notifications?: {
    email: boolean;
    push: boolean;
    badges: boolean;
    events: boolean;
    verifications: boolean;
    monthlyReports: boolean;
    eventReminders: boolean;
    certificateIssued: boolean;
  };
}

interface ProfileData {
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    userType?: string;
    profileComplete?: boolean;
    profile?: UserProfile;
    badges?: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      category: string;
      earnedAt: string;
    }>;
    achievements?: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      points: number;
      verifiedAt: string;
      createdAt: string;
    }>;
    scoreHistory?: Array<{
      id: string;
      oldScore: number;
      newScore: number;
      change: number;
      reason: string;
      createdAt: string;
    }>;
    _count?: {
      participations: number;
      certificates: number;
      followers: number;
      follows: number;
    };
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  const hasRedirected = useRef(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

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
      }
    } catch (e) {
      // no-op
    } finally {
      setIsCreatingPost(false);
    }
  };

  // DON'T redirect - let users access any dashboard they want
  // Organizations can view individual dashboard if they want

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (isLoading || !user?.id) {
        return;
      }
      
      setProfileLoading(true);
      setProfileError(null);
      
      try {
        // Force fresh data by adding a timestamp to bypass cache
        const response = await fetch(`/api/users/profile?t=${Date.now()}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        console.log('Profile data received:', data);
        console.log('User type:', data.user?.userType);
        setProfileData(data);
        
        // Redirect organization users to organization dashboard
        if (data.user?.userType && data.user.userType !== 'INDIVIDUAL' && !isRedirecting) {
          console.log('Redirecting to organization dashboard for userType:', data.user.userType);
          setIsRedirecting(true);
          // Use window.location.href to prevent redirect loops
          window.location.href = '/organization/dashboard';
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setProfileError(error instanceof Error ? error.message : 'Failed to fetch profile data');
      } finally {
        setProfileLoading(false);
      }
    };

    if (user?.id) {
      fetchProfileData();
    }
  }, [user?.id, isLoading, router, isRedirecting]);

  if (isLoading || isRedirecting || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner 
          text={isRedirecting ? 'Redirecting to organization dashboard...' : 'Loading...'}
          size="lg"
        />
      </div>
    );
  }

  if (!user) {
    router.push('/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Compact Professional Header */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left: Profile Info */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Avatar className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                    <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                    <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                      {user?.name?.charAt(0) || 'U'}
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
                    {user?.name || 'User'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 normal-case">
                    Impact Contributor • {user?.userType === 'NGO' ? 'NGO' : user?.userType === 'COMPANY' ? 'Company' : 'Individual'}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Globe className="w-3 h-3 mr-1" />
                      Malaysia
                    </span>
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-2 font-medium">
                      ⚡ Contributor
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Right: Quick Stats & Actions */}
              <div className="flex items-center space-x-6">
                <div className="hidden md:flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">2,347</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Impact Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">87.5</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">12</div>
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
                    onClick={() => {
                      const profileUrl = `${window.location.origin}/profile/${user?.id}`;
                      navigator.clipboard.writeText(profileUrl);
                      alert('Profile link copied to clipboard!');
                    }}
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SDG Interests Section */}
        {profileLoading ? (
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner text="Loading SDG focus areas..." size="sm" />
              </div>
            </CardContent>
          </Card>
        ) : profileError ? (
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-8">
            <CardContent className="p-6">
              <div className="text-center text-red-600 dark:text-red-400">
                <p>Error loading profile data: {profileError}</p>
              </div>
            </CardContent>
          </Card>
        ) : profileData?.user?.profile?.sdgFocus && profileData.user.profile.sdgFocus.length > 0 ? (
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
                {profileData.user.profile.sdgFocus.map((sdgId: number) => {
                  const sdg = getSDGById(sdgId);
                  if (!sdg) return null;
                  
                  return (
                    <div
                      key={sdgId}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="text-2xl">{sdg.icon}</span>
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
                          {sdg.shortTitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : profileData?.user?.profile && (
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Your SDG Focus Areas
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select the UN Sustainable Development Goals you&apos;re passionate about
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You haven&apos;t selected any SDG focus areas yet.
                </p>
                <Link href="/profile/edit">
                  <Button variant="outline" className="inline-flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add SDG Focus Areas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* LinkedIn-style Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Stats & Featured Organizations */}
          <div className="lg:col-span-3 space-y-4">
            {/* Your Impact Stats */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">2,347</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Impact Score</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">87.5</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Hours</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">12</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Badges</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                    onClick={() => router.push('/events')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Find Events
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                    onClick={() => router.push('/profile/badges')}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    View Badges
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                    onClick={() => router.push('/leaderboards')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Badge Progress */}
            <BadgeProgress />

            {/* Featured Organizations */}
            <FeaturedOrganizations />
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
                        <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
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
                          <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm">
                            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
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
                      <Button onClick={handleCreatePost} disabled={isCreatingPost || !newPostContent.trim()} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full px-6">
                        {isCreatingPost ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievement Feed */}
            <AchievementFeed maxItems={5} />
          </div>

          {/* Right Sidebar - Upcoming Events & Connections */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upcoming Events */}
            <UpcomingEventsWidget />

            {/* Impact Summary */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Impact Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Global Rank</span>
                    <span className="font-medium text-gray-900 dark:text-white">#2,847</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Country Rank</span>
                    <span className="font-medium text-gray-900 dark:text-white">#284</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">SDG Areas</span>
                    <span className="font-medium text-gray-900 dark:text-white">6 SDGs</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-500">Progress to Builder</span>
                    <span className="font-medium text-gray-900 dark:text-white">74%</span>
                  </div>
                  <Progress value={74} className="h-1.5" />
                  <p className="text-xs text-gray-400 mt-1">53 points needed</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Connections/Followers */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Recent Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex -space-x-2">
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">JD</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarFallback className="bg-green-500 text-white text-xs">SM</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarFallback className="bg-purple-500 text-white text-xs">AL</AvatarFallback>
                  </Avatar>
                  <div className="w-8 h-8 border-2 border-white bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-600">+12</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">15 new connections this week</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}