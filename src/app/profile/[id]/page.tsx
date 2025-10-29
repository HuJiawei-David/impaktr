'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Award, 
  Calendar, 
  MapPin, 
  Globe, 
  Mail,
  Share2,
  TrendingUp,
  Clock,
  Star,
  Users,
  UserPlus,
  UserCheck,
  Trophy,
  Target,
  Heart,
  ChevronRight,
  MessageCircle,
  Building2,
  Zap,
  BarChart3,
  TrendingUp as TrendingUpIcon,
  Plus,
  MessageSquare,
  ThumbsUp,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getSDGById } from '@/constants/sdgs';
import { ShareProfileModal } from '@/components/profile/ShareProfileModal';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  image?: string;
  bio?: string;
  city?: string;
  country?: string;
  website?: string;
  tier: string;
  impactScore: number;
  volunteerHours: number;
  eventsJoined: number;
  badgesEarned: number;
  isFollowing: boolean;
  connectionStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  connectionId?: string | null;
  isConnectionRequester?: boolean;
  badges: {
    id: string;
    name: string;
    sdgNumber: number;
    tier: string;
    earnedAt: string;
  }[];
  recentActivities: {
    id: string;
    type: string;
    title: string;
    date: string;
    sdg?: number;
  }[];
  stats: {
    followers: number;
    following: number;
    connections: number;
    rank: number;
  };
  // New employer-focused fields
  activeSince: string;
  streak: number;
  longestStreak: number;
  organizationsWorkedWith: {
    id: string;
    name: string;
    logo: string | null;
    events: number;
    hours: number;
  }[];
  sdgBreakdown: {
    sdgNumber: number;
    events: number;
    hours: number;
    badges: number;
  }[];
  autoTaggedSkills: {
    skill: string;
    eventCount: number;
  }[];
  certificateCount: number;
  certificates: {
    id: string;
    title: string;
    description?: string;
    type: string;
    issuedAt: string;
    issuedBy?: string;
    certificateUrl?: string;
    event?: {
      id: string;
      title: string;
      organization?: {
        id: string;
        name: string;
        logo?: string;
      };
    };
  }[];
}

const getTierColor = (tier: string) => {
  const tierMap: Record<string, string> = {
    'BEGINNER': 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
    'SUPPORTER': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    'ADVOCATE': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    'CHAMPION': 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    'HERO': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    'LEGEND': 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30',
  };
  return tierMap[tier] || tierMap['BEGINNER'];
};

const formatTierName = (tier: string) => {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
};

export default function PublicProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED' | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'activities' | 'badges' | 'recommendations' | 'certificates' | 'connections'>('about');
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [recommendationText, setRecommendationText] = useState('');
  const [recommendationType, setRecommendationType] = useState<'individual' | 'organization'>('individual');
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    // If viewing own profile, redirect to /profile
    if (session?.user?.id === userId) {
      router.push('/profile');
      return;
    }
    
    if (!session) {
      router.push('/signin');
      return;
    }
    
    fetchProfile();
  }, [session, status, userId]);

  // Fetch recommendations when recommendations tab becomes active
  useEffect(() => {
    if (activeTab === 'recommendations' && profile) {
      fetchRecommendations();
    }
  }, [activeTab, profile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/profile?id=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data.profile);
      setConnectionStatus(data.profile.connectionStatus || null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!session?.user?.id) return;
    
    setConnectionLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/connect`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to manage connection');
      }

      const data = await response.json();
      setConnectionStatus(data.connectionStatus);
      
      // Update connection count
      if (profile && data.connectionStatus === 'ACCEPTED') {
        setProfile({
          ...profile,
          stats: {
            ...profile.stats,
            connections: profile.stats.connections + 1
          }
        });
      } else if (profile && data.connectionStatus === null && connectionStatus === 'ACCEPTED') {
        setProfile({
          ...profile,
          stats: {
            ...profile.stats,
            connections: Math.max(0, profile.stats.connections - 1)
          }
        });
      }
    } catch (err) {
      console.error('Error managing connection:', err);
    } finally {
      setConnectionLoading(false);
    }
  };
  
  const handleAcceptConnection = async () => {
    if (!session?.user?.id || !profile?.connectionId) return;
    
    setConnectionLoading(true);
    try {
      const response = await fetch(`/api/users/connections/accept/${profile.connectionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to accept connection');
      }

      setConnectionStatus('ACCEPTED');
      
      // Update connection count
      if (profile) {
        setProfile({
          ...profile,
          stats: {
            ...profile.stats,
            connections: profile.stats.connections + 1
          }
        });
      }
    } catch (err) {
      console.error('Error accepting connection:', err);
    } finally {
      setConnectionLoading(false);
    }
  };
  
  const handleRejectConnection = async () => {
    if (!session?.user?.id || !profile?.connectionId) return;
    
    setConnectionLoading(true);
    try {
      const response = await fetch(`/api/users/connections/reject/${profile.connectionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reject connection');
      }

      setConnectionStatus(null);
    } catch (err) {
      console.error('Error rejecting connection:', err);
    } finally {
      setConnectionLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const response = await fetch(`/api/recommendations?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Recommendations data:', data);
        console.log('First recommendation:', data.recommendations?.[0]);
        setRecommendations(data.recommendations || []);
      } else {
        const errorData = await response.json();
        console.error('Recommendations API error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleSubmitRecommendation = async () => {
    if (!recommendationText.trim()) return;
    
    setRecommendationLoading(true);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          text: recommendationText,
          type: recommendationType,
        }),
      });
      
      if (response.ok) {
        setRecommendationText('');
        setShowRecommendationForm(false);
        // Refresh recommendations after successful submission
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Error submitting recommendation:', error);
    } finally {
      setRecommendationLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Profile Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This user doesn't exist or their profile is private.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-64 md:h-80 relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-7xl md:text-9xl font-bold opacity-20">
                {profile.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Back Button */}
            <div className="absolute top-4 left-4">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-purple-500 hover:border-purple-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-48 pb-6">
            <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl">
              <CardContent className="p-6">
                {/* Tier Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  <Badge className={`px-3 py-1 text-sm font-medium ${getTierColor(profile.tier)}`}>
                    {formatTierName(profile.tier)}
                  </Badge>
          </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Avatar with glow */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
                    <Avatar className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-gray-900 shadow-lg">
                {profile.image ? (
                  <AvatarImage src={profile.image} alt={profile.name} />
                ) : (
                        <AvatarFallback className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {profile.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
                  </div>

                  {/* User Details */}
                  <div className="flex-1 w-full md:w-auto min-w-0">
                    <div className="space-y-4">
                      {/* Name */}
                      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight text-center md:text-left">
                      {profile.name}
                    </h1>

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed text-center md:text-left">
                          {profile.bio}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-base">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                            <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            {profile.city || profile.country 
                              ? `${profile.city ? profile.city : ''}${profile.city && profile.country ? ', ' : ''}${profile.country ? profile.country : ''}`
                              : 'Global'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold">{profile.stats.connections}</span>
                          <span className="text-gray-500 dark:text-gray-400">connections</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Active since {new Date(profile.activeSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                    </div>
                  </div>

                      {/* Streak Info */}
                      {(profile.streak > 0 || profile.longestStreak > 0) && (
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                          {profile.streak > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                              <span className="text-orange-600 dark:text-orange-400 font-semibold">🔥</span>
                              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                {profile.streak} day streak
                              </span>
                            </div>
                          )}
                          {profile.longestStreak > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                              <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                Best: {profile.longestStreak} days
                              </span>
                  </div>
                          )}
                </div>
                )}

                {/* Contact Info */}
                  {profile.website && (
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                        {/* Connection buttons */}
                        {connectionStatus === 'ACCEPTED' ? (
                          <Button
                            onClick={handleConnect}
                            disabled={connectionLoading}
                            variant="outline"
                            className="flex-1 sm:flex-none !border-blue-500 !text-blue-600 dark:!text-blue-400 !bg-transparent hover:!bg-transparent hover:!text-blue-600 dark:hover:!text-blue-400 hover:!border-blue-500 hover:!opacity-100 !shadow-none hover:!shadow-none"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Connected
                          </Button>
                        ) : connectionStatus === 'PENDING' ? (
                          <>
                            {!profile?.isConnectionRequester ? (
                              // We received the request - show Accept/Reject
                              <>
                                <Button
                                  onClick={handleAcceptConnection}
                                  disabled={connectionLoading}
                                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Accept
                                </Button>
                                <Button
                                  onClick={handleRejectConnection}
                                  disabled={connectionLoading}
                                  variant="outline"
                                  className="flex-1 sm:flex-none"
                                >
                                  Reject
                                </Button>
                              </>
                            ) : (
                              // We sent the request - show Pending (can cancel)
                              <Button
                                onClick={handleConnect}
                                disabled={connectionLoading}
                                variant="outline"
                                className="flex-1 sm:flex-none"
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Pending
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            onClick={handleConnect}
                            disabled={connectionLoading}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                        <Button variant="outline" className="flex-1 sm:flex-none text-sm px-4 py-2">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 sm:flex-none text-sm px-4 py-2"
                          onClick={() => setShareModalOpen(true)}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Profile
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Impact Score</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.impactScore}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hours</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.volunteerHours}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.eventsJoined}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Badges</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.badgesEarned}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Pill Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={activeTab === 'about' ? 'default' : 'outline'}
                onClick={() => setActiveTab('about')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'about' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                About
              </Button>
              <Button
                variant={activeTab === 'activities' ? 'default' : 'outline'}
                onClick={() => setActiveTab('activities')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'activities' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Activities ({profile.eventsJoined})
              </Button>
              <Button
                variant={activeTab === 'badges' ? 'default' : 'outline'}
                onClick={() => setActiveTab('badges')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'badges' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Badges & Progress ({profile.badgesEarned})
              </Button>
              <Button
                variant={activeTab === 'recommendations' ? 'default' : 'outline'}
                onClick={() => setActiveTab('recommendations')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'recommendations' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Recommendations ({recommendations.length})
              </Button>
              <Button
                variant={activeTab === 'certificates' ? 'default' : 'outline'}
                onClick={() => setActiveTab('certificates')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'certificates' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Certificates ({profile.certificateCount})
              </Button>
              <Button
                variant={activeTab === 'connections' ? 'default' : 'outline'}
                onClick={() => setActiveTab('connections')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'connections' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Connections ({profile.stats.connections})
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* Bio Section */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.bio ? (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {profile.bio}
                      </p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        No bio available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Organizations Worked With */}
                {profile.organizationsWorkedWith && profile.organizationsWorkedWith.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Organizations Worked With ({profile.organizationsWorkedWith.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.organizationsWorkedWith.map((org) => (
                          <Link 
                            key={org.id} 
                            href={`/organizations/${org.id}`}
                            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                          >
                            <Avatar className="w-12 h-12 flex-shrink-0">
                              {org.logo ? (
                                <AvatarImage src={org.logo} alt={org.name} />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                  {org.name.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {org.name}
                              </h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {org.events} events
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {org.hours}h
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SDG Expertise & Auto-Tagged Skills */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SDG Breakdown */}
                  {profile.sdgBreakdown && profile.sdgBreakdown.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          Top SDG Focus Areas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {profile.sdgBreakdown.map((sdg) => {
                            const sdgInfo = getSDGById(sdg.sdgNumber);
                            if (!sdgInfo) return null;
                            
                            return (
                              <div key={sdg.sdgNumber} className="space-y-2">
                                <div className="flex items-start gap-3">
                                  <div
                                    className="w-10 h-10 rounded flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                    style={{ backgroundColor: sdgInfo.color }}
                                  >
                                    <div className="text-[8px]">SDG</div>
                                    <div className="text-[10px]">{sdgInfo.id}</div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                                      {sdgInfo.title}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                      <span>{sdg.events} events</span>
                                      <span>•</span>
                                      <span>{sdg.hours}h</span>
                                      <span>•</span>
                                      <span>{sdg.badges} badges</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Auto-Tagged Skills */}
                  {profile.autoTaggedSkills && profile.autoTaggedSkills.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-600" />
                          Demonstrated Skills
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Skills automatically verified through event participation
                        </p>
                        <div className="space-y-3">
                          {profile.autoTaggedSkills.map((skill, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {skill.skill}
                                </span>
                              </div>
                              <Badge variant="secondary" className="px-3 py-1">
                                {skill.eventCount} {skill.eventCount === 1 ? 'event' : 'events'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Certificates Badge */}
                {profile.certificateCount > 0 && (
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {profile.certificateCount} Verified {profile.certificateCount === 1 ? 'Certificate' : 'Certificates'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Issued by verified organizations for completed volunteer work
                          </p>
                        </div>
                        <Badge className="px-4 py-2 text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          Verified ✓
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'activities' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                    Recent Activities ({profile.eventsJoined})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.recentActivities && profile.recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {profile.recentActivities.map((activity) => {
                      const sdg = activity.sdg ? getSDGById(activity.sdg) : null;
                      
                      return (
                        <div key={activity.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-start gap-3">
                            {sdg && (
                              <div
                                className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                style={{ backgroundColor: sdg.color }}
                              >
                                <div className="text-[8px]">SDG</div>
                                  <div className="text-[10px]">{sdg.id}</div>
                              </div>
                            )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                {activity.title}
                              </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {new Date(activity.date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                    No recent activities
                  </p>
                )}
              </CardContent>
            </Card>
            )}

            {activeTab === 'badges' && (
              <div className="space-y-6">
                {/* Overall Rank Progress */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Overall Rank Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {profile.tier}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Current Rank
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Impact Score</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {profile.impactScore.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Volunteer Hours</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {profile.volunteerHours}h
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Events Joined</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {profile.eventsJoined}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Next Rank
                          </p>
                          <Badge className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {profile.tier === 'BEGINNER' ? 'SUPPORTER' : 
                             profile.tier === 'SUPPORTER' ? 'ADVOCATE' :
                             profile.tier === 'ADVOCATE' ? 'BUILDER' :
                             profile.tier === 'BUILDER' ? 'CHAMPION' :
                             profile.tier === 'CHAMPION' ? 'LEGEND' : 'MAXED OUT'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* All Badges */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-600" />
                        All Badges ({profile.badgesEarned})
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.badges && profile.badges.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.badges.map((badge) => {
                          const sdg = getSDGById(badge.sdgNumber);
                          return (
                            <div key={badge.id} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              {sdg && (
                                <div
                                  className="w-12 h-12 rounded flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                  style={{ backgroundColor: sdg.color }}
                                >
                                  <div className="text-[8px]">SDG</div>
                                  <div className="text-[10px]">{sdg.id}</div>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {badge.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {badge.tier}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  Earned {new Date(badge.earnedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                        No badges earned yet
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* SDG Badge Progress */}
                {profile.sdgBreakdown && profile.sdgBreakdown.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        SDG Badge Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.sdgBreakdown.map((sdg) => {
                          const sdgInfo = getSDGById(sdg.sdgNumber);
                          if (!sdgInfo) return null;
                          
                          // Calculate progress percentage (simplified)
                          const totalPossibleBadges = 4; // Supporter, Advocate, Builder, Champion
                          const progressPercentage = Math.min((sdg.badges / totalPossibleBadges) * 100, 100);
                          
                          return (
                            <div key={sdg.sdgNumber} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <div className="flex items-start gap-3 mb-3">
                                <div
                                  className="w-12 h-12 rounded flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                  style={{ backgroundColor: sdgInfo.color }}
                                >
                                  <div className="text-[8px]">SDG</div>
                                  <div className="text-[10px]">{sdgInfo.id}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                                    {sdgInfo.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {sdg.badges} of {totalPossibleBadges} badges earned
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {Math.round(progressPercentage)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={progressPercentage} 
                                  className="h-2"
                                />
                              </div>
                              
                              <div className="flex items-center justify-between mt-3 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {sdg.events} events
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {sdg.hours}h
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Achievement Summary */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <TrendingUpIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        Achievement Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {profile.badgesEarned}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Badges Earned
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {profile.sdgBreakdown?.length || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            SDG Areas
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Keep participating in events to earn more badges and advance your rank!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                {/* Write Recommendation Button */}
                {session?.user?.id !== userId && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                            Write a Recommendation
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Share your experience working with {profile.name}
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowRecommendationForm(true)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Write Recommendation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendation Form */}
                {showRecommendationForm && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Write a Recommendation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Recommendation Type
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="individual"
                              checked={recommendationType === 'individual'}
                              onChange={(e) => setRecommendationType(e.target.value as 'individual' | 'organization')}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Individual to Individual</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="organization"
                              checked={recommendationType === 'organization'}
                              onChange={(e) => setRecommendationType(e.target.value as 'individual' | 'organization')}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Organization to Individual</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Your Recommendation
                        </label>
                        <textarea
                          value={recommendationText}
                          onChange={(e) => setRecommendationText(e.target.value)}
                          placeholder="Share your experience working with this person. What made them stand out? What impact did they make?"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSubmitRecommendation}
                          disabled={!recommendationText.trim() || recommendationLoading}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          {recommendationLoading ? 'Submitting...' : 'Submit Recommendation'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowRecommendationForm(false);
                            setRecommendationText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Real Recommendations */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ThumbsUp className="w-5 h-5 text-green-600" />
                      Recommendations & Testimonials ({recommendations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recommendationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : recommendations.length > 0 ? (
                      <div className="space-y-6">
                        {recommendations.map((rec) => (
                          <div key={rec.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-10 h-10 flex-shrink-0">
                                {rec.authorImage ? (
                                  <AvatarImage src={rec.authorImage} alt={rec.authorName} />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                    {rec.authorName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Link href={`/profile/${rec.authorId || rec.author?.id || '#'}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {rec.authorName}
                                  </Link>
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs px-3 py-1 ${
                                      rec.authorType === 'organization' 
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                        : rec.authorTier === 'HELPER' 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                          : rec.authorTier === 'ADVOCATE'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                            : rec.authorTier === 'BUILDER'
                                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                              : rec.authorTier === 'CHAMPION'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                    }`}
                                  >
                                    {rec.authorType === 'organization' ? 'Organization' : rec.authorTier || 'Individual'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  "{rec.text}"
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{new Date(rec.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                  <span>•</span>
                                  <span>{rec.eventsTogether} events together</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Empty State - only shown when no recommendations */
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center">
                          <Star className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                          No Recommendations Yet
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                          Organizations and individuals can write recommendations and testimonials about your volunteer work and impact.
                        </p>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            💡 <strong>For Organizations:</strong> Write recommendations for volunteers who have made a significant impact
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            💡 <strong>For Individuals:</strong> Recommend organizations you've worked with and had great experiences
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'certificates' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    Certificates ({profile.certificateCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.certificates && profile.certificates.length > 0 ? (
                    <div className="space-y-4">
                      {profile.certificates.map((certificate) => (
                        <Card key={certificate.id} className="border border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                    <Award className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                      {certificate.title}
                                    </h3>
                                    {certificate.event && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        For: {certificate.event.title}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="ml-13 space-y-2">
                                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Certificate ID:</span>
                                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                                        {certificate.id.slice(-8).toUpperCase()}
                                      </code>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Issued:</span>
                                      <span>{new Date(certificate.issuedAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}</span>
                                    </div>
                                  </div>
                                  
                                  {certificate.issuedBy && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                      <span className="font-medium">Issued by:</span>
                                      <span>{certificate.issuedBy}</span>
                                    </div>
                                  )}
                                  
                                  {certificate.event?.organization && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <span className="font-medium">Organization:</span>
                                      <div className="flex items-center gap-2">
                                        {certificate.event.organization.logo && (
                                          <img 
                                            src={certificate.event.organization.logo} 
                                            alt={certificate.event.organization.name}
                                            className="w-4 h-4 rounded-full object-cover"
                                          />
                                        )}
                                        <span>{certificate.event.organization.name}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {certificate.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                      {certificate.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2 ml-4">
                                <Badge className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                  Verified ✓
                                </Badge>
                                {certificate.certificateUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    onClick={() => window.open(certificate.certificateUrl, '_blank')}
                                  >
                                    View Certificate
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Award className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        No Certificates Yet
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Complete volunteer events to earn verified certificates from organizations
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'connections' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Connections ({profile.stats.connections})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                      {profile.stats.connections} Connections
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Professional connections in the impact community
                    </p>
                    <Button variant="outline" size="sm">
                      View All Connections
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Leaderboard Position */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardContent className="p-6 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                  Leaderboard Rank
                </h3>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  #{profile.stats.rank}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Global ranking
                </p>
                <Link href="/leaderboards">
                  <Button variant="outline" size="sm" className="w-full">
                    View Leaderboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Since</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(profile.activeSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
          </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Streak</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile.streak} days
                  </span>
        </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Best Streak</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile.longestStreak} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Organizations</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile.organizationsWorkedWith?.length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

      </div>
        </div>

      </div>

      {/* Share Profile Modal */}
      {profile && (
        <ShareProfileModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          profileUrl={`${window.location.origin}/profile/${userId}`}
          userName={profile.name}
        />
      )}
    </div>
  );
}

