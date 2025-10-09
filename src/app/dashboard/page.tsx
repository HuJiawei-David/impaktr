// home/ubuntu/impaktrweb/src/app/dashboard/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
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
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImpaktrScore } from '@/components/dashboard/ImpaktrScore';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { BadgeProgress } from '@/components/dashboard/BadgeProgress';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { GamificationJourney } from '@/components/dashboard/GamificationJourney';
import { SDGBadgeCollection } from '@/components/dashboard/SDGBadgeCollection';
import { AchievementFeed } from '@/components/dashboard/AchievementFeed';
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
  notifications?: any;
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
    badges?: any[];
    achievements?: any[];
    scoreHistory?: any[];
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
  
  // Profile data state
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;
      
      setProfileLoading(true);
      setProfileError(null);
      
      try {
        const response = await fetch('/api/users/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        setProfileData(data);
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
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    redirect('/api/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">

        {/* Compact Professional Header */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left: Profile Info */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Avatar className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                    <AvatarImage src={user.image || ''} alt={user.name || ''} />
                    <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                      {user.name?.charAt(0) || 'U'}
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
                    {user.name || 'User'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 normal-case">
                    Impact Contributor • {user.userType?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Individual'}
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
                  <Button variant="outline" size="sm" className="text-xs px-4 py-2 h-auto">
                    <User className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-xs px-4 py-2 h-auto"
                    onClick={() => {
                      const profileUrl = `${window.location.origin}/profile/${user.id}`;
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
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading SDG focus areas...</span>
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
                The UN Sustainable Development Goals you're passionate about
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
                Select the UN Sustainable Development Goals you're passionate about
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You haven't selected any SDG focus areas yet.
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
        <div className="grid lg:grid-cols-8 gap-6">
          {/* Left Sidebar - Compact Profile & Navigation */}
          <div className="lg:col-span-2 space-y-4">
            {/* Compact Gamification Journey */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <GamificationJourney compact />
              </CardContent>
            </Card>

            {/* SDG Badge Collection - Compact */}
            <SDGBadgeCollection compact />

            {/* Navigation Links */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-4 space-y-2">
                <Link href="/events" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Events</span>
                </Link>
                <Link href="/leaderboards" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Leaderboards</span>
                </Link>
                <Link href="/profile" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Award className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Badges</span>
                </Link>
                <Link href="/organizations" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Building2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Organizations</span>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed - Center */}
          <div className="lg:col-span-4 space-y-4">
            {/* Create Post / Event */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.image || ''} alt={user.name || ''} />
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" className="flex-1 justify-start text-gray-500 hover:bg-gray-50">
                    Share your impact journey...
                  </Button>
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                  <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50">
                    <Users className="w-4 h-4 mr-2" />
                    Join Event
                  </Button>
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50">
                    <Award className="w-4 h-4 mr-2" />
                    Share Badge
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Feed */}
            <AchievementFeed maxItems={5} />
          </div>

          {/* Right Sidebar - Compact Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Events */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Your Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Beach Cleanup</div>
                    <div className="text-xs text-gray-500">Tomorrow 9:00 AM</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Math Tutoring</div>
                    <div className="text-xs text-gray-500">Saturday 2:00 PM</div>
                  </div>
                </div>
                <Link href="/events">
                  <Button variant="ghost" size="sm" className="w-full text-xs mt-2">
                    View all events
                  </Button>
                </Link>
              </CardContent>
            </Card>

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