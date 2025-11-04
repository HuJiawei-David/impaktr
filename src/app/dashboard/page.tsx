// home/ubuntu/impaktrweb/src/app/dashboard/page.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  MessageCircle,
  ThumbsUp,
  User,
  UserPlus,
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
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { BadgeProgress } from '@/components/dashboard/BadgeProgress';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { GamificationJourney } from '@/components/dashboard/GamificationJourney';
import { SDGBadgeCollection } from '@/components/dashboard/SDGBadgeCollection';
import { AchievementFeed } from '@/components/dashboard/AchievementFeed';
import { UnifiedFeed } from '@/components/dashboard/UnifiedFeed';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { FeaturedOrganizations } from '@/components/dashboard/FeaturedOrganizations';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getSDGById } from '@/constants/sdgs';
import Link from 'next/link';

// Helper function to get rank badge color
function getRankBadgeColor(rank: string): string {
  const rankColors: Record<string, string> = {
    'Helper': '#9CA3AF',
    'Supporter': '#22C55E',
    'Contributor': '#3B82F6',
    'Builder': '#A855F7',
    'Advocate': '#F97316',
    'Changemaker': '#EC4899',
    'Mentor': '#6366F1',
    'Leader': '#F59E0B',
    'Ambassador': '#8B5CF6',
    'Global Citizen': '#10B981',
  };
  return rankColors[rank] || '#9CA3AF';
}

// Helper function to format tier enum to display name
function formatUserTier(tier: string | null | undefined): string {
  if (!tier) return '';
  switch (tier) {
    case 'HELPER': return 'Helper';
    case 'SUPPORTER': return 'Supporter';
    case 'CONTRIBUTOR': return 'Contributor';
    case 'BUILDER': return 'Builder';
    case 'ADVOCATE': return 'Advocate';
    case 'CHANGEMAKER': return 'Changemaker';
    case 'MENTOR': return 'Mentor';
    case 'LEADER': return 'Leader';
    case 'AMBASSADOR': return 'Ambassador';
    case 'GLOBAL_CITIZEN': return 'Global Citizen';
    default: return tier;
  }
}

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
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
    tier?: string;
    impactScore?: number;
    profileComplete?: boolean;
    profile?: UserProfile;
    stats?: {
      volunteerHours: number;
      eventsJoined: number;
      badgesEarned: number;
      followers: number;
      following: number;
      rank: string;
    };
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
  const [showAllSDGs, setShowAllSDGs] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Array<{
    id: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      tier: string | null;
      city: string | null;
      country: string | null;
      occupation: string | null;
    };
    sentAt: Date;
  }>>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [badgeProgressData, setBadgeProgressData] = useState<{
    sdgBadges?: Array<{
      sdgNumber: number;
      tiers: Array<{
        progress: { hours: number; activities: number };
        earned: boolean;
      }>;
    }>;
  } | null>(null);

  const fetchPendingConnections = useCallback(async () => {
    if (!user?.id) return;
    
    setPendingLoading(true);
    try {
      const response = await fetch('/api/users/connections/pending');
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.received || []);
      }
    } catch (error) {
      console.error('Error fetching pending connections:', error);
    } finally {
      setPendingLoading(false);
    }
  }, [user?.id]);

  const fetchBadgeProgress = useCallback(async () => {
    if (!profileData?.user?.id) return;
    
    try {
      const response = await fetch(`/api/badges?type=individual&userId=${profileData.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setBadgeProgressData({
          sdgBadges: data.sdgBadges || []
        });
      }
    } catch (error) {
      console.error('Error fetching badge progress:', error);
    }
  }, [profileData?.user?.id]);

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
          let errorData: { error?: string; details?: string } = { error: 'Unknown error' };
          try {
            const text = await response.text();
            if (text) {
              errorData = JSON.parse(text);
            }
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorData = { 
              error: `HTTP ${response.status}: ${response.statusText}`,
              details: 'Failed to parse error response'
            };
          }
          console.error('Profile API error:', response.status, errorData);
          throw new Error(errorData.error || errorData.details || `Failed to fetch profile data: ${response.status}`);
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
      fetchPendingConnections();
    }
  }, [user?.id, isLoading, router, isRedirecting, fetchPendingConnections]);

  // Fetch badge progress when profile data is available
  useEffect(() => {
    if (profileData?.user?.id) {
      fetchBadgeProgress();
    }
  }, [profileData?.user?.id, fetchBadgeProgress]);

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

        {/* Profile Header - Community Style */}
        <div className="relative pb-6">
          <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl">
            <CardContent className="p-6">
                {/* User Type/Rank Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  {user?.userType === 'INDIVIDUAL' && profileData?.user?.tier ? (
                    (() => {
                      const tierDisplayName = formatUserTier(profileData.user.tier);
                      const tierColor = getRankBadgeColor(tierDisplayName);
                      return (
                        <Badge 
                          className="text-xs px-3 py-1 font-medium"
                          style={{
                            backgroundColor: `${tierColor}20`,
                            color: tierColor,
                            borderColor: tierColor,
                            borderWidth: '1px'
                          }}
                        >
                          {tierDisplayName}
                        </Badge>
                      );
                    })()
                  ) : (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 font-medium">
                      ⚡ {user?.userType === 'NGO' ? 'NGO' : user?.userType === 'COMPANY' ? 'Company' : 'Individual'}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
                    <Avatar className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-gray-900 shadow-lg rounded-full">
                      <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                      <AvatarFallback className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
                        {user?.name?.split(' ').map(word => word[0]).join('').slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Profile Details */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="flex items-start gap-3 flex-wrap">
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                          {user?.name || 'User'}
                        </h1>
                      </div>
                      
                      {/* Description */}
                      {profileData?.user?.profile?.bio && (
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
                          {profileData.user.profile.bio}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-6 text-base">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold">{profileData?.user?.impactScore?.toLocaleString() || 0}</span>
                          <span className="text-gray-500 dark:text-gray-400">impact score</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-semibold">{profileData?.user?.stats?.volunteerHours || 0}</span>
                          <span className="text-gray-500 dark:text-gray-400">hours</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="font-semibold">{profileData?.user?.stats?.badgesEarned || 0}</span>
                          <span className="text-gray-500 dark:text-gray-400">badges</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                            <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            {profileData?.user?.profile?.city && profileData?.user?.profile?.country 
                              ? `${profileData.user.profile.city}, ${profileData.user.profile.country}`
                              : profileData?.user?.profile?.city || profileData?.user?.profile?.country || 'Location not set'
                            }
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Link href="/profile">
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 text-sm px-4 py-2"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Profile Page
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

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
              <div className="space-y-4">
                {/* First Row - Always Visible */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {profileData.user.profile.sdgFocus.slice(0, 4).map((sdgId: number) => {
                    const sdg = getSDGById(sdgId);
                    if (!sdg) return null;
                    
                    return (
                      <div
                        key={sdgId}
                        className="flex items-center space-x-3 p-3 border-2 rounded-lg bg-white dark:bg-gray-800"
                        style={{ borderColor: sdg.color }}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                          <Image 
                            src={sdg.image} 
                            alt={`SDG ${sdg.id}: ${sdg.title}`}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              if (target.parentElement) {
                                target.parentElement.style.backgroundColor = sdg.color;
                                target.parentElement.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                                    ${sdg.id}
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            SDG {sdg.id}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {sdg.title}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Additional SDGs - Collapsible */}
                {profileData.user.profile.sdgFocus.length > 4 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAllSDGs(!showAllSDGs)}
                      className="flex items-center justify-center w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <span className="mr-2">
                        {showAllSDGs ? 'Show Less' : `Show ${profileData.user.profile.sdgFocus.length - 4} More`}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${showAllSDGs ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {showAllSDGs && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
                        {profileData.user.profile.sdgFocus.slice(4).map((sdgId: number) => {
                          const sdg = getSDGById(sdgId);
                          if (!sdg) return null;
                          
                          return (
                            <div
                              key={sdgId}
                              className="flex items-center space-x-3 p-3 border-2 rounded-lg bg-white dark:bg-gray-800"
                              style={{ borderColor: sdg.color }}
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                                <Image 
                                  src={sdg.image} 
                                  alt={`SDG ${sdg.id}: ${sdg.title}`}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    if (target.parentElement) {
                                      target.parentElement.style.backgroundColor = sdg.color;
                                      target.parentElement.innerHTML = `
                                        <div class="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                                          ${sdg.id}
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                  SDG {sdg.id}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {sdg.title}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
              <CardContent className="p-5">
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                      {profileData?.user?.impactScore?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">Impact Score</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white text-center">
                      {profileData?.user?.stats?.volunteerHours || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">Hours</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white text-center">
                      {profileData?.user?.stats?.badgesEarned || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">Badges</div>
                  </div>
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
                          {profileData?.user?.tier && (
                            <Badge 
                              className="text-xs px-3 py-1 font-medium" 
                              style={{
                                backgroundColor: `${getRankBadgeColor(formatUserTier(profileData.user.tier))}20`,
                                color: getRankBadgeColor(formatUserTier(profileData.user.tier)),
                                borderColor: getRankBadgeColor(formatUserTier(profileData.user.tier)),
                                borderWidth: '1px'
                              }}
                            >
                              {formatUserTier(profileData.user.tier)}
                            </Badge>
                          )}
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

            {/* Unified Social Feed */}
            <UnifiedFeed type="all" limit={10} />
          </div>

          {/* Right Sidebar - Upcoming Events & Connections */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upcoming Events */}
            <UpcomingEventsWidget />

            {/* Impact Summary */}
            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-gray-800">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
              
              <CardHeader className="relative pb-3">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-2">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  Impact Summary
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative p-4 pt-0 space-y-4">
                {/* Global Rank - Prominent Display */}
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {profileData?.user?.stats?.rank ? `#${profileData.user.stats.rank}` : '#-'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Global Rank</div>
                </div>

                {/* Additional Stats */}
                <div className="space-y-2">
                  {(() => {
                    const sdgCount = badgeProgressData?.sdgBadges?.filter(sdg => 
                      sdg.tiers.some(t => t.progress.hours > 0 || t.earned || t.progress.activities > 0)
                    ).length || 0;
                    return sdgCount > 0 ? (
                      <div className="flex justify-between text-xs bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-transparent">
                        <span className="text-gray-500 dark:text-gray-400">SDG Areas</span>
                        <span className="font-medium text-gray-900 dark:text-white">{sdgCount} SDGs</span>
                      </div>
                    ) : null;
                  })()}
                  {profileData?.user?.stats?.followers !== undefined && (
                    <div className="flex justify-between text-xs bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-transparent">
                      <span className="text-gray-500 dark:text-gray-400">Connections</span>
                      <span className="font-medium text-gray-900 dark:text-white">{profileData.user.stats.followers}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Connection Requests */}
            {pendingRequests.length > 0 && (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 border-l-4 border-l-yellow-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mr-2">
                        <UserPlus className="w-4 h-4 text-white" />
                      </div>
                      Connection Requests ({pendingRequests.length})
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {pendingRequests.slice(0, 3).map((request) => (
                    <Link
                      key={request.id}
                      href={`/profile/${request.user.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={request.user.image || ''} alt={request.user.name || ''} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                          {request.user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {request.user.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Wants to connect
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </Link>
                  ))}
                  {pendingRequests.length > 3 && (
                    <Link href="/profile?tab=connections">
                      <Button variant="ghost" size="sm" className="w-full text-xs">
                        View All {pendingRequests.length} Requests
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

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
          </div>
        </div>
      </div>
    </div>
  );
}