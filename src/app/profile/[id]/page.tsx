'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getSDGById } from '@/constants/sdgs';
import { ShareProfileModal } from '@/components/profile/ShareProfileModal';
import { 
  getSDGBadgeImage,
  getRankBadgeImage
} from '@/lib/badge-config';

// Helper: generate deterministic color classes for skill badges
function getSkillBadgeClasses(skillName: string): string {
  const predefined: Record<string, string> = {
    'Community Service': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Empathy': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'Communication': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  if (predefined[skillName]) return predefined[skillName];
  const palette = [
    'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
    'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
    'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  ];
  let hash = 0;
  for (let i = 0; i < skillName.length; i++) {
    hash = (hash * 31 + skillName.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}

// Helper: generate deterministic color classes for language badges
function getLanguageBadgeClasses(language: string): string {
  const predefined: Record<string, string> = {
    'English': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Spanish': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'French': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'Mandarin': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'German': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Japanese': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'Portuguese': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Italian': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'Arabic': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    'Russian': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  };
  if (predefined[language]) return predefined[language];
  const palette = [
    'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
    'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
    'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  ];
  let hash = 0;
  for (let i = 0; i < language.length; i++) {
    hash = (hash * 31 + language.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}

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
    localRank?: number;
    localTotal?: number;
  };
  // New employer-focused fields
  activeSince: string;
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
  sdgParticipations: {
    sdgNumber: number;
    eventCount: number;
  }[];
  certificateCount: number;
  languages?: string[];
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
  sdgFocus?: number[];
}

const getTierColor = (tier: string) => {
  const tierMap: Record<string, string> = {
    'HELPER': 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800 border border-gray-300 dark:border-gray-700',
    'SUPPORTER': 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40 border border-green-300 dark:border-green-700',
    'CONTRIBUTOR': 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700',
    'BUILDER': 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700',
    'ADVOCATE': 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700',
    'CHANGEMAKER': 'text-pink-700 bg-pink-100 dark:text-pink-300 dark:bg-pink-900/40 border border-pink-300 dark:border-pink-700',
    'MENTOR': 'text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-700',
    'LEADER': 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700',
    'AMBASSADOR': 'text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/40 border border-violet-300 dark:border-violet-700',
    'GLOBAL_CITIZEN': 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700',
  };
  return tierMap[tier] || tierMap['HELPER'];
};

const formatTierName = (tier: string) => {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
};

function getNextRankName(currentTier: string): string | null {
  const order = [
    'HELPER',
    'SUPPORTER',
    'CONTRIBUTOR',
    'BUILDER',
    'ADVOCATE',
    'CHANGEMAKER',
    'MENTOR',
    'LEADER',
    'AMBASSADOR',
    'GLOBAL_CITIZEN'
  ];
  const idx = order.indexOf(currentTier);
  if (idx === -1 || idx === order.length - 1) return null;
  return order[idx + 1];
}

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
  const [recommendations, setRecommendations] = useState<Array<{
    id: string;
    text: string;
    createdAt: string;
    eventsTogether: number;
    authorName: string;
    authorImage?: string;
    authorId: string;
    authorType?: string;
    authorTier?: string;
  }>>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [badgeProgressData, setBadgeProgressData] = useState<{
    rankProgress: {
      currentRank: { rank: string; name: string; icon: string };
      nextRank: { rank: string; name: string; requirements: { minScore: number; minHours: number; minBadges: number }; progress: { score: number; hours: number; badges: number } } | null;
      currentProgress: { score: number; hours: number; badges: number };
    };
    sdgBadges: Array<{
      sdgNumber: number;
      sdgName: string;
      icon: string;
      color: string;
      tiers: Array<{
        tier: string;
        name: string;
        description: string;
        requirements: { minHours: number; minActivities: number };
        progress: { hours: number; activities: number; percentage: number };
        earned: boolean;
      }>;
    }>;
  } | null>(null);
  const [badgeProgressLoading, setBadgeProgressLoading] = useState(false);
  const [connections, setConnections] = useState<Array<{
    id: string;
    connectedAt: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      tier: string | null;
      city: string | null;
      country: string | null;
      occupation: string | null;
      userType?: string;
    };
  }>>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
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
  }, [userId]);

  const fetchRecommendations = useCallback(async () => {
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
  }, [userId]);

  const fetchBadgeProgress = useCallback(async () => {
    setBadgeProgressLoading(true);
    try {
      const response = await fetch(`/api/badges?type=individual&userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Badge progress data:', data);
        setBadgeProgressData({
          rankProgress: {
            currentRank: data.currentRank,
            nextRank: data.nextRank,
            currentProgress: data.currentProgress
          },
          sdgBadges: data.sdgBadges || []
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch badge progress:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching badge progress:', error);
    } finally {
      setBadgeProgressLoading(false);
    }
  }, [userId]);

  const fetchConnections = useCallback(async () => {
    // Only fetch if viewing own profile
    if (!session?.user?.id || session.user.id !== userId) return;
    
    setConnectionsLoading(true);
    try {
      // Fetch connections for the current logged-in user (their own connections)
      const response = await fetch('/api/users/connections');
      
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setConnectionsLoading(false);
    }
  }, [userId, session?.user?.id]);

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
  }, [session, status, userId, fetchProfile, router]);

  // Fetch recommendations count on page load
  useEffect(() => {
    if (profile) {
      fetchRecommendations();
      fetchBadgeProgress();
    }
  }, [profile, fetchRecommendations, fetchBadgeProgress]);

  // Fetch recommendations when recommendations tab becomes active (for full data)
  useEffect(() => {
    if (activeTab === 'recommendations' && profile) {
      fetchRecommendations();
    }
  }, [activeTab, profile, fetchRecommendations]);

  // Fetch badge progress when badges tab becomes active
  useEffect(() => {
    if (activeTab === 'badges' && profile && !badgeProgressData) {
      fetchBadgeProgress();
    }
  }, [activeTab, profile, badgeProgressData, fetchBadgeProgress]);

  // Fetch connections when connections tab becomes active
  useEffect(() => {
    if (activeTab === 'connections' && profile && session?.user?.id) {
      fetchConnections();
    }
  }, [activeTab, profile, session?.user?.id, fetchConnections]);

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
      
      const data = await response.json();
      
      if (response.ok) {
        setRecommendationText('');
        setShowRecommendationForm(false);
        // Refresh recommendations after successful submission
        await fetchRecommendations();
      } else {
        // Show error message to user
        alert(data.error || 'Failed to submit recommendation. Please try again.');
        console.error('Recommendation submission error:', data);
      }
    } catch (error) {
      console.error('Error submitting recommendation:', error);
      alert('An error occurred while submitting your recommendation. Please try again.');
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
        <Card className="max-w-md w-full bg-white dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Profile Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This user doesn&apos;t exist or their profile is private.
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
            <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl bg-white dark:bg-gray-800">
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
                            {profile?.isConnectionRequester ? (
                              // We sent the request - show "Requested" (can cancel)
                              <Button
                                onClick={handleConnect}
                                disabled={connectionLoading}
                                variant="outline"
                                className="flex-1 sm:flex-none"
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Requested
                              </Button>
                            ) : (
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
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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

                {/* Auto-Tagged Skills & SDG Participation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Demonstrated Skills */}
                  {profile.autoTaggedSkills && profile.autoTaggedSkills.length > 0 && (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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
                              <Badge variant="secondary" className={`px-3 py-1 ${getSkillBadgeClasses(skill.skill)}`}>
                                {skill.eventCount} {skill.eventCount === 1 ? 'event' : 'events'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* SDG Participation */}
                  {profile.sdgParticipations && profile.sdgParticipations.length > 0 && (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          SDG Participation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          UN Sustainable Development Goals contributions
                        </p>
                        <div className="space-y-3">
                          {profile.sdgParticipations.map((sdgData, index) => {
                            const sdgInfo = getSDGById(sdgData.sdgNumber);
                            if (!sdgInfo) return null;
                            
                            return (
                              <div key={index} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                    <Image 
                                      src={sdgInfo.image} 
                                      alt={`SDG ${sdgInfo.id}`}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        if (target.parentElement) {
                                          target.parentElement.style.backgroundColor = sdgInfo.color;
                                          target.parentElement.innerHTML = `
                                            <div class="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                              ${sdgInfo.id}
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                      SDG {sdgInfo.id}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                      {sdgInfo.title}
                                    </p>
                                  </div>
                                </div>
                                <Badge className="px-3 py-1 text-white whitespace-nowrap flex-shrink-0" style={{ backgroundColor: sdgInfo.color }}>
                                  {sdgData.eventCount} {sdgData.eventCount === 1 ? 'event' : 'events'}
                                </Badge>
                              </div>
                            );
                          })}
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
                        <Badge className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          Verified ✓
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SDG Focus Areas */}
                {profile.sdgFocus && profile.sdgFocus.length > 0 && (
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        SDG Focus Areas ({profile.sdgFocus.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Sustainable Development Goals of interest
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.sdgFocus.map((sdgId: number) => {
                          const sdgInfo = getSDGById(sdgId);
                          if (!sdgInfo) return null;
                          
                          return (
                            <Badge 
                              key={sdgId} 
                              variant="outline" 
                              className="px-3 py-1 text-sm flex items-center gap-1.5"
                              style={{ borderColor: sdgInfo.color }}
                            >
                              <Image 
                                src={sdgInfo.image || ''} 
                                alt={`SDG ${sdgInfo.id}`}
                                width={16}
                                height={16}
                                className="w-4 h-4 flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              <span className="font-semibold">SDG {sdgInfo.id}</span>
                              <span className="text-gray-600 dark:text-gray-400">{sdgInfo.title}</span>
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'activities' && (
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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
                      type SDGInfo = { id: number; title: string; color: string; image: string };
                      const sdgNums: number[] = Array.isArray((activity as unknown as { sdgs?: number[] }).sdgs)
                        ? ((activity as unknown as { sdgs?: number[] }).sdgs as number[])
                        : activity.sdg ? [activity.sdg] : [];
                      const sdgList: SDGInfo[] = sdgNums
                        .map((n) => getSDGById(n))
                        .filter((s): s is SDGInfo => Boolean(s));
                      
                      return (
                        <div key={activity.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-start gap-3">
                            {/* Removed left SDG stack; we render badges below title/date */}
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
                              {sdgList.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {sdgList.slice(0, 4).map((sdg) => (
                                    <span
                                      key={sdg.id}
                                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                                style={{ backgroundColor: sdg.color }}
                                      title={`SDG ${sdg.id}: ${sdg.title}`}
                              >
                                      SDG {sdg.id}
                                    </span>
                                  ))}
                              </div>
                            )}
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
                <Card className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800">
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
                  
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      Overall Rank Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-6">
                    {/* Current Rank - Large Display */}
                    <div className="text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
                        <Award className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {profile.tier}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Current Rank
                      </p>
          </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {profile.impactScore.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Impact Score</div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {profile.volunteerHours}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Hours</div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {profile.eventsJoined}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Events</div>
                      </div>
                    </div>

                    {/* Next Rank Progress */}
                    {badgeProgressData?.rankProgress?.nextRank ? (
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Next Rank</p>
                            <Badge className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                              {badgeProgressData.rankProgress.nextRank.name}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {Math.round((badgeProgressData.rankProgress.currentProgress.score / badgeProgressData.rankProgress.nextRank.requirements.minScore) * 100)}%
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Complete</p>
                          </div>
                        </div>
                        <Progress 
                          value={(badgeProgressData.rankProgress.currentProgress.score / badgeProgressData.rankProgress.nextRank.requirements.minScore) * 100} 
                          className="h-3 mb-4" 
                        />
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="text-center">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {badgeProgressData.rankProgress.currentProgress.score}/{badgeProgressData.rankProgress.nextRank.requirements.minScore}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">Score</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {badgeProgressData.rankProgress.currentProgress.hours}/{badgeProgressData.rankProgress.nextRank.requirements.minHours}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">Hours</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {badgeProgressData.rankProgress.currentProgress.badges}/{badgeProgressData.rankProgress.nextRank.requirements.minBadges}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">Badges</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-center gap-2 text-yellow-900 dark:text-yellow-200">
                          <Star className="w-6 h-6 fill-current" />
                          <p className="font-semibold text-lg">Maximum Rank Achieved!</p>
                        </div>
                        <p className="text-center text-sm text-yellow-800 dark:text-yellow-300 mt-2">
                          You&apos;ve reached the highest rank. Keep making an impact!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Badges */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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
                {badgeProgressLoading ? (
                  <Card className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-green-500/10" />
                    <CardHeader className="relative">
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        SDG Badge Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                              </div>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                            <div className="flex gap-3">
                              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : badgeProgressData && badgeProgressData.sdgBadges && badgeProgressData.sdgBadges.length > 0 && badgeProgressData.sdgBadges.filter(sdg => sdg.tiers.some(t => t.progress.hours > 0 || t.earned || t.progress.activities > 0)).length > 0 ? (
                  <Card className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-green-500/10" />
                    <CardHeader className="relative">
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        SDG Badge Progress
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Track your progress across UN Sustainable Development Goals
                      </p>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {badgeProgressData.sdgBadges
                          .filter(sdg => sdg.tiers.some(t => t.progress.hours > 0 || t.earned || t.progress.activities > 0))
                          .map((sdgBadge) => {
                            const sdgInfo = getSDGById(sdgBadge.sdgNumber);
                            const earnedTiers = sdgBadge.tiers.filter(tier => tier.earned);
                            const currentTier = earnedTiers.length > 0 ? earnedTiers[earnedTiers.length - 1] : null;
                            const nextTier = sdgBadge.tiers.find(tier => !tier.earned);
                            // All tiers have the same progress.hours value, so just take it from the first tier
                            const totalHours = sdgBadge.tiers.length > 0 ? sdgBadge.tiers[0].progress.hours : 0;
                            const totalActivities = sdgBadge.tiers.length > 0 ? sdgBadge.tiers[0].progress.activities : 0;
                            
                            const getTierBadgeColorClass = (tier: string) => {
                              if (tier === 'SUPPORTER') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                              if (tier === 'BUILDER') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                              if (tier === 'CHAMPION') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
                              if (tier === 'GUARDIAN') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
                              return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
                            };

                            return (
                              <div key={sdgBadge.sdgNumber} className="group relative bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-600 hover:-translate-y-1">
                                {/* Subtle gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 rounded-2xl transition-all duration-300" />
                                
                                <div className="relative">
                                  {/* Header with Badge and Info */}
                                  <div className="flex items-center gap-4 mb-4">
                                    <div className="relative w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden shadow-lg ring-2 ring-white dark:ring-gray-800 group-hover:ring-purple-200 dark:group-hover:ring-purple-800 transition-all">
                                      {currentTier ? (
                                        <Image
                                          src={getSDGBadgeImage(sdgBadge.sdgNumber, currentTier.tier as 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN')}
                                          alt={`${currentTier.name} - SDG ${sdgBadge.sdgNumber}`}
                                          width={64}
                                          height={64}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : sdgInfo ? (
                                        <Image 
                                          src={sdgInfo.image} 
                                          alt={`SDG ${sdgBadge.sdgNumber}`}
                                          width={64}
                                          height={64}
                                          className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                                          <Award className="w-8 h-8 text-gray-400" />
                                        </div>
                                      )}
                                      {earnedTiers.length > 0 && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                          <Star className="w-4 h-4 text-white fill-white" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-base text-gray-900 dark:text-white mb-1">
                                        SDG {sdgBadge.sdgNumber}
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                                        {sdgBadge.sdgName}
                                      </p>
                                      {currentTier ? (
                                        <Badge className={`text-xs px-2.5 py-1 font-semibold ${getTierBadgeColorClass(currentTier.tier)}`}>
                                          {currentTier.name}
                                        </Badge>
                                      ) : totalHours > 0 || totalActivities > 0 ? (
                                        <Badge className="text-xs px-2.5 py-1 font-semibold bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-900 dark:from-yellow-900/50 dark:to-orange-900/50 dark:text-yellow-200 border-0">
                                          In Progress
                                        </Badge>
                                      ) : (
                                        <Badge className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-0">
                                          Not Started
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Progress Section */}
                                  {nextTier ? (
                                    <div className="space-y-3 mb-4">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">Next: {nextTier.name}</span>
                                        <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                          {Math.round(nextTier.progress.percentage)}%
                                        </span>
                                      </div>
                                      <Progress value={nextTier.progress.percentage} className="h-2.5" />
                                    </div>
                                  ) : earnedTiers.length > 0 && (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 mb-4 border border-green-200 dark:border-green-800">
                                      <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-semibold">All Tiers Completed!</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Stats Row */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                                          <Clock className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Hours</span>
                                      </div>
                                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {nextTier ? `${totalHours}/${nextTier.requirements.minHours}` : totalHours}
                                      </p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
                                          <Trophy className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Events</span>
                                      </div>
                                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {nextTier ? `${totalActivities}/${nextTier.requirements.minActivities}` : earnedTiers.length > 0 ? '✓' : totalActivities}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                ) : profile.sdgBreakdown && profile.sdgBreakdown.length > 0 && (
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
                                  <Link href={`/profile/${rec.authorId || '#'}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
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
                                  &quot;{rec.text}&quot;
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
                            💡 <strong>For Individuals:</strong> Recommend organizations you&apos;ve worked with and had great experiences
                          </p>
                        </div>
                      </div>
                )}
              </CardContent>
            </Card>
              </div>
            )}

            {activeTab === 'certificates' && (
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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
                            <div className="space-y-4">
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
                                        <Image 
                                          src={certificate.event.organization.logo} 
                                          alt={certificate.event.organization.name}
                                          width={16}
                                          height={16}
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
                              
                              <div className="flex justify-between items-center">
                                <Badge className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 w-fit">
                                  Verified ✓
                                </Badge>
                                {certificate.certificateUrl && (
                                  <Button
                                    className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-3 py-1"
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
                  {connectionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner text="Loading connections..." size="sm" />
                    </div>
                  ) : !session?.user?.id ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sign in to view connections
                      </p>
                    </div>
                  ) : session.user.id !== userId ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Connections are only visible to the profile owner
                      </p>
                    </div>
                  ) : connections.length > 0 ? (
                    <div className="space-y-4">
                      {/* Filter tabs */}
                      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          All ({connections.length})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          Individuals ({connections.filter(c => c.user.userType === 'INDIVIDUAL' || !c.user.userType).length})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          Organizations ({connections.filter(c => c.user.userType && c.user.userType !== 'INDIVIDUAL').length})
                        </Button>
                      </div>

                      {/* Connections List */}
                      <div className="space-y-3">
                        {connections.map((connection) => {
                          const isOrganization = connection.user.userType && connection.user.userType !== 'INDIVIDUAL';
                          const displayName = connection.user.name || 'Unknown User';
                          const location = [connection.user.city, connection.user.country].filter(Boolean).join(', ') || 'Location not set';
                          
                          return (
                            <Link 
                              key={connection.id} 
                              href={`/profile/${connection.user.id}`}
                              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={connection.user.image || ''} alt={displayName} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                  {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {displayName}
                                  </h4>
                                  {isOrganization ? (
                                    <Badge className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                      Organization
                                    </Badge>
                                  ) : connection.user.tier ? (
                                    <Badge className={`px-2 py-0.5 text-xs ${getTierColor(connection.user.tier)}`}>
                                      {formatTierName(connection.user.tier)}
                                    </Badge>
                                  ) : null}
                                </div>
                                {connection.user.occupation && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {connection.user.occupation}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {location}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        No Connections Yet
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Start connecting with others in the impact community
                      </p>
                      <Button
                        onClick={() => router.push('/dashboard')}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                      >
                        Find People to Connect
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Current Rank */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
              
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Current Rank
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                {/* Current Rank - Large Display */}
                <div className="text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {formatTierName(profile.tier)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Current Rank
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard Position */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg mb-4 text-center text-gray-900 dark:text-white">
                  Leaderboard Ranking
                </h3>
                
                {/* Rankings Side by Side */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Global Rank */}
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Global
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      #{profile.stats.rank || '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Global ranking
                    </p>
                  </div>
                  
                  {/* Local Rank */}
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Local {profile.country ? `(${profile.country})` : ''}
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {profile.stats.localRank ? `#${profile.stats.localRank}` : '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {profile.stats.localTotal ? `${profile.stats.localTotal.toLocaleString()} total` : '-'}
                    </p>
                  </div>
                </div>

                <Link href="/leaderboards">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                  >
                    View Leaderboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">Organizations</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile.organizationsWorkedWith?.length || 0}
                  </span>
        </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Skills Obtained</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile.autoTaggedSkills?.length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Languages & Skills */}
            {(profile.languages && profile.languages.length > 0) || (profile.autoTaggedSkills && profile.autoTaggedSkills.length > 0) ? (
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle>Languages & Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.languages && profile.languages.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Languages</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.languages.map((language) => (
                            <Badge key={language} variant="secondary" className={getLanguageBadgeClasses(language)}>
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.autoTaggedSkills && profile.autoTaggedSkills.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.autoTaggedSkills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className={getSkillBadgeClasses(skill.skill)}>
                              {skill.skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

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

