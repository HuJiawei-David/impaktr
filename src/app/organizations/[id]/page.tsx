'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
  Building,
  MapPin, 
  Users, 
  Calendar,
  Award,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  UserPlus,
  UserCheck,
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  Leaf,
  Heart,
  Share2,
  ChevronRight,
  Star,
  Trophy,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UnifiedFeed } from '@/components/dashboard/UnifiedFeed';
import { EventCard } from '@/components/events/EventCard';
import { FollowersList } from '@/components/organization/FollowersList';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { getSDGById, getSDGColor } from '@/constants/sdgs';
import { industries, companySizes } from '@/constants/industries';
import { getTierBadgeColor } from '@/lib/utils';
import { 
  getSDGBadgeImage,
  getRankBadgeImage
} from '@/lib/badge-config';
import { CheckCircle } from 'lucide-react';

// Type definitions
interface Opportunity {
  id: string;
  title: string;
  description: string;
  location?: string;
  spots: number;
  spotsFilled: number;
  deadline?: string;
  status: string;
  sdg?: string;
  skills: string[];
  requirements: string[];
  isRemote: boolean;
  createdAt: string;
  stats?: {
    totalApplications: number;
    spotsRemaining: number;
  };
}

interface Member {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location: string | object;
  status: string;
  imageUrl?: string;
  sdg?: string | number | number[];
  maxParticipants?: number;
  currentParticipants?: number;
  interestedCount?: number;
  participantCount?: number;
  organization?: {
    id: string;
    name: string;
    logo?: string | null;
  };
  _count?: {
    participations: number;
  };
}

interface Volunteer {
  id: string;
  name: string;
  image?: string;
  avatar?: string;
  impactScore: number;
  totalHours: number;
  hours: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

interface OrganizationWithOpportunities {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  companySize?: string;
  tier: string;
  isFollowing?: boolean;
  members?: Member[];
  events?: Event[];
  opportunities?: Opportunity[];
  recentEvents?: Event[];
  upcomingEvents?: Event[];
  pastEvents?: Event[];
  topVolunteers?: Volunteer[];
  badges?: Badge[];
  sdgs?: number[];
  sdgParticipations?: Array<{
    sdgNumber: number;
    eventCount: number;
  }>;
  memberCount?: number;
  followerCount?: number;
  eventCount?: number;
  totalHours?: number;
  impactScore?: number;
  esgData?: {
    environmental: { total: number };
    social: { total: number };
    governance: { total: number };
    overall: number;
  };
  _count?: {
    members: number;
    events: number;
    opportunities: number;
  };
}

// Utility functions for event formatting
const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const formatEventTimeRange = (startDate: string, endDate?: string) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  const startTime = start.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (end && end.getTime() !== start.getTime()) {
    const endTime = end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${startTime} - ${endTime}`;
  }
  
  return startTime;
};

// SDG Definitions
const SDG_DEFINITIONS = {
  1: { name: 'No Poverty', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  2: { name: 'Zero Hunger', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  3: { name: 'Good Health and Well-being', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  4: { name: 'Quality Education', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  5: { name: 'Gender Equality', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  6: { name: 'Clean Water and Sanitation', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  7: { name: 'Affordable and Clean Energy', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  8: { name: 'Decent Work and Economic Growth', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' },
  9: { name: 'Industry, Innovation and Infrastructure', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  10: { name: 'Reduced Inequalities', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  11: { name: 'Sustainable Cities and Communities', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  12: { name: 'Responsible Consumption and Production', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200' },
  13: { name: 'Climate Action', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  14: { name: 'Life Below Water', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' },
  15: { name: 'Life on Land', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  16: { name: 'Peace, Justice and Strong Institutions', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200' },
  17: { name: 'Partnerships for the Goals', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' }
};

interface Organization {
  id: string;
  name: string;
  logo?: string;
  description: string;
  type: string;
  city?: string;
  country?: string;
  website?: string;
  email?: string;
  phone?: string;
  tier: string;
  impactScore: number;
  esgScore?: number;
  memberCount: number;
  eventCount: number;
  totalHours: number;
  isFollowing: boolean;
  sdgs: number[];
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
  recentEvents: Array<{
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: string | object;
    status: string;
    imageUrl?: string;
    sdg: string | number | number[];
    participantCount?: number;
    currentParticipants?: number;
  }>;
  topVolunteers: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    hours: number;
    impactScore: number;
  }>;
  members?: Array<{
    id: string;
    userId?: string;
    email?: string;
    role: string;
    name: string;
  }>;
}

// Use centralized tier badge color function from utils
const getTierColor = (tier: string) => {
  return getTierBadgeColor(tier);
};

const formatTierName = (tier: string) => {
  return tier.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

const getSDGDescription = (sdg: number) => {
  const descriptions: Record<number, string> = {
    1: 'No Poverty',
    2: 'Zero Hunger',
    3: 'Good Health & Well-being',
    4: 'Quality Education',
    5: 'Gender Equality',
    6: 'Clean Water & Sanitation',
    7: 'Affordable & Clean Energy',
    8: 'Decent Work & Economic Growth',
    9: 'Industry, Innovation & Infrastructure',
    10: 'Reduced Inequalities',
    11: 'Sustainable Cities & Communities',
    12: 'Responsible Consumption & Production',
    13: 'Climate Action',
    14: 'Life Below Water',
    15: 'Life on Land',
    16: 'Peace, Justice & Strong Institutions',
    17: 'Partnerships for the Goals'
  };
  return descriptions[sdg] || 'Unknown SDG';
};

// EventCard component is now imported from @/components/events/EventCard

export default function OrganizationProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;

  const [organization, setOrganization] = useState<OrganizationWithOpportunities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'about' | 'events' | 'opportunities' | 'impact' | 'followers'>('about');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [bookmarkedOpportunities, setBookmarkedOpportunities] = useState<string[]>([]);
  const [appliedOpportunities, setAppliedOpportunities] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [badgeProgressData, setBadgeProgressData] = useState<{
    currentTier: {
      tier: string;
      name: string;
      icon: string;
    };
    nextTier: {
      tier: string;
      name: string;
      requirements: {
        minEmployeeParticipation: number;
        minAverageScore: number;
        minEvents: number;
        minSDGDiversity: number;
      };
      progress: {
        participation: number;
        averageScore: number;
        events: number;
        sdgDiversity: number;
      };
    } | null;
    currentProgress: {
      participationRate: number;
      averageScore: number;
      totalEvents: number;
      sdgDiversity: number;
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
        requirements: {
          minHours: number;
          minActivities: number;
        };
        progress: {
          hours: number;
          activities: number;
          percentage: number;
        };
        earned: boolean;
      }>;
    }>;
  } | null>(null);
  const [badgeProgressLoading, setBadgeProgressLoading] = useState(false);

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[Organization Page] Fetching organization with ID:', orgId);
      const response = await fetch(`/api/organizations/${orgId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`[Organization Page] Failed to fetch organization with ID "${orgId}":`, response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch organization: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[Organization Page] Successfully fetched organization:', data.organization?.name);
      
      if (!data.organization) {
        throw new Error('Organization data not found in response');
      }
      
      setOrganization(data.organization);
      setIsFollowing(data.organization.isFollowing);
      
      // Check if current user is admin or owner of this organization
      if (session?.user?.id && data.organization.members) {
        const currentUserMembership = data.organization.members.find(
          (m: { userId?: string; email?: string; role: string }) => m.userId === session.user.id || m.email === session.user.email
        );
        setIsAdmin(currentUserMembership?.role === 'admin' || currentUserMembership?.role === 'owner');
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, [orgId, session]);

  const loadBookmarks = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/events/bookmarks');
      if (response.ok) {
        const data = await response.json();
        setBookmarks(new Set(data.bookmarks.map((b: { eventId: string }) => b.eventId)));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  }, [session?.user?.id]);

  const toggleFavorite = (eventId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(eventId)) {
        newFavorites.delete(eventId);
      } else {
        newFavorites.add(eventId);
      }
      return newFavorites;
    });
  };

  const toggleBookmark = async (eventId: string) => {
    try {
      const isBookmarked = bookmarks.has(eventId);
      const response = await fetch(`/api/events/${eventId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setBookmarks(prev => {
          const newBookmarks = new Set(prev);
          if (isBookmarked) {
            newBookmarks.delete(eventId);
          } else {
            newBookmarks.add(eventId);
          }
          return newBookmarks;
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const fetchBadgeProgress = useCallback(async () => {
    if (!orgId) return;
    setBadgeProgressLoading(true);
    try {
      const response = await fetch(`/api/badges?type=organization&organizationId=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Badge progress data received:', data);
        console.log('SDG badges count:', data.sdgBadges?.length || 0);
        if (data.sdgBadges && data.sdgBadges.length > 0) {
          // Log first few badges to see their structure
          type BadgeTier = {
            tier: string;
            progress: {
              hours: number;
              activities: number;
              percentage: number;
            };
            earned: boolean;
          };
          type SDGBadge = {
            sdgNumber: number;
            sdgName: string;
            tiers: BadgeTier[];
          };
          console.log('First 3 SDG badges:', data.sdgBadges.slice(0, 3).map((b: SDGBadge) => ({
            sdgNumber: b.sdgNumber,
            sdgName: b.sdgName,
            tiers: b.tiers.map((t: BadgeTier) => ({
              tier: t.tier,
              hours: t.progress.hours,
              activities: t.progress.activities,
              earned: t.earned,
              percentage: t.progress.percentage
            }))
          })));
        }
        setBadgeProgressData({
          currentTier: data.currentTier,
          nextTier: data.nextTier,
          currentProgress: data.currentProgress,
          sdgBadges: data.sdgBadges || []
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch badge progress:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching badge progress:', error);
    } finally {
      setBadgeProgressLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }
    fetchOrganization();
    loadBookmarks();
  }, [session, status, orgId, fetchOrganization, router, loadBookmarks]);

  useEffect(() => {
    if (organization && activeTab === 'about') {
      fetchBadgeProgress();
    }
  }, [organization, activeTab, fetchBadgeProgress]);

  const handleFollow = async () => {
    if (!session?.user?.id) return;
    
    setFollowLoading(true);
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const response = await fetch(`/api/organizations/${orgId}/${endpoint}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} organization`);
      }

      const data = await response.json();
      setIsFollowing(data.isFollowing);
      
      // Refresh organization data to update stats
      await fetchOrganization();
    } catch (err) {
      console.error(`Error ${isFollowing ? 'unfollowing' : 'following'} organization:`, err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBookmark = async (opportunityId: string) => {
    if (!session?.user?.id) return;
    
    try {
      const isBookmarked = bookmarkedOpportunities.includes(opportunityId);
      const response = await fetch(`/api/opportunities/${opportunityId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setBookmarkedOpportunities(prev => 
          isBookmarked 
            ? prev.filter(id => id !== opportunityId)
            : [...prev, opportunityId]
        );
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  const handleApply = async (opportunityId: string) => {
    if (!session?.user?.id) return;
    
    setIsApplying(opportunityId);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setAppliedOpportunities(prev => [...prev, opportunityId]);
      }
    } catch (error) {
      console.error('Error applying:', error);
    } finally {
      setIsApplying(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              Organization Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              The organization you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            {error && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                ID: {orgId}
              </p>
            )}
            <div className="flex gap-3 justify-center mt-6">
              <Button 
                variant="outline"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
              <Button 
                onClick={() => router.push('/leaderboards?type=organizations')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                Browse Organizations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Organization Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-64 md:h-80 relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-7xl md:text-9xl font-bold opacity-20">
                {organization.name.charAt(0)}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        </div>

        {/* Organization Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-48 pb-6">
            <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                {/* Tier Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  <Badge className={`px-3 py-1 text-sm font-medium ${getTierColor(organization.tier)}`}>
                    {formatTierName(organization.tier)}
                  </Badge>
          </div>

                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Logo */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-75"></div>
                    <Avatar className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-gray-900 shadow-lg rounded-2xl">
                  <AvatarImage src={organization.logo} alt={organization.name} />
                      <AvatarFallback className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl">
                    {organization.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </AvatarFallback>
              </Avatar>
                  </div>

                  {/* Organization Details */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="flex items-start gap-3 flex-wrap">
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                      {organization.name}
                    </h1>
                        <Badge className="px-3 py-1 bg-blue-500 text-white text-sm">
                          ✓ Verified
                      </Badge>
                </div>

                {/* Description */}
                      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
                  {organization.description}
                </p>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-6 text-base">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                            <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            {(() => {
                              const parts = [];
                              if (organization.city) parts.push(organization.city);
                              if (organization.state) parts.push(organization.state);
                              if (organization.country) parts.push(organization.country);
                              return parts.length > 0 ? parts.join(', ') : 'Global';
                            })()}
                      </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                          <span className="font-semibold">{organization.followerCount || 0}</span>
                          <span className="text-gray-500 dark:text-gray-400">followers</span>
                        </div>
                      </div>

                {/* Contact Info */}
                      <div className="flex flex-wrap items-center gap-4">
                  {organization.website && (
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  </div>

                  {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full">
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? "outline" : "default"}
                          className={`flex-1 sm:flex-none ${
                        isFollowing
                          ? '!border-blue-500 !text-blue-600 dark:!text-blue-400 !bg-transparent hover:!bg-transparent hover:!text-blue-600 dark:hover:!text-blue-400 hover:!border-blue-500 hover:!opacity-100 !shadow-none hover:!shadow-none'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                        <Button variant="outline" className="flex-1 sm:flex-none text-sm px-4 py-2">
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
                    {organization.impactScore}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {organization.memberCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {organization.totalHours?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
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
                    {organization.eventCount || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                variant={activeTab === 'feed' ? 'default' : 'outline'}
                onClick={() => setActiveTab('feed')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'feed' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Latest Posts
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
                Events ({organization.eventCount || 0})
              </Button>
              <Button
                variant={activeTab === 'opportunities' ? 'default' : 'outline'}
                onClick={() => setActiveTab('opportunities')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'opportunities' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Opportunities ({organization?.opportunities?.length || 0})
              </Button>
              <Button
                variant={activeTab === 'impact' ? 'default' : 'outline'}
                onClick={() => setActiveTab('impact')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'impact' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Impact
              </Button>
              <Button
                variant={activeTab === 'followers' ? 'default' : 'outline'}
                onClick={() => setActiveTab('followers')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'followers' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Followers ({organization.followerCount || 0})
              </Button>
            </div>
            
            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'feed' && (
                <UnifiedFeed 
                  type="organizations" 
                  limit={10} 
                  showCreatePost={isAdmin}
                  organizationId={orgId}
                  isOrganizationAdmin={isAdmin}
                />
              )}
              
              {activeTab === 'about' && (
                <>
                  {/* Organization Information */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        Organization Information
                </CardTitle>
              </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">About Us</h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {organization.description || 'No description available.'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Industry</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {organization.industry 
                              ? industries.find(ind => ind.value === organization.industry)?.label || organization.industry
                              : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Company Size</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {organization.companySize 
                              ? companySizes.find(size => size.value === organization.companySize)?.label || organization.companySize
                              : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Location</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {(() => {
                              const parts = [];
                              if (organization.city) parts.push(organization.city);
                              if (organization.state) parts.push(organization.state);
                              if (organization.country) parts.push(organization.country);
                              return parts.length > 0 ? parts.join(', ') : 'Not specified';
                            })()}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Website</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {organization.website ? (
                              <a 
                                href={organization.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {organization.website}
                              </a>
                            ) : 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SDG Focus Areas */}
                  {organization.sdgs && organization.sdgs.length > 0 && (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-green-600" />
                          Our SDG Focus Areas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {organization.sdgs.map((sdgId) => {
                            const sdg = getSDGById(sdgId);
                            return sdg ? (
                              <div key={sdgId} className="flex items-center space-x-3 p-3 border rounded-lg bg-white dark:bg-gray-800">
                                <Image 
                                  src={sdg.image} 
                                  alt={`SDG ${sdgId}`} 
                                  width={32} 
                                  height={32} 
                                  className="w-8 h-8"
                                />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    SDG {sdgId}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {sdg.title}
                                  </p>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Overall Rank Progress */}
                  {badgeProgressData && (
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
                        {/* Line 1: Current Rank and Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Current Rank Card */}
                          <div className="text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
                              <Award className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                              {badgeProgressData.currentTier.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              Current Rank
                            </p>
                          </div>

                          {/* Stats Cards Stacked */}
                          <div className="space-y-3">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Impact Score</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                  {organization.impactScore?.toLocaleString() || 0}
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Hours</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                  {organization.totalHours?.toLocaleString() || 0}
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Events</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                  {organization.eventCount || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Line 2: Next Rank on Left, Circular Progress and Stats on Right */}
                        {badgeProgressData.nextTier ? (
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-8">
                              {/* Left: Next Rank */}
                              <div className="flex items-center justify-center">
                                <div className="text-center">
                                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 mb-4 shadow-lg">
                                    <TrendingUp className="w-10 h-10 text-white" />
                                  </div>
                                  <h4 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                    {badgeProgressData.nextTier.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Next Rank
                                  </p>
                                </div>
                              </div>

                              {/* Right: Circular Progress and Stats */}
                              <div className="flex flex-col items-center space-y-6">
                                {/* Circular Progress */}
                                <div className="relative w-40 h-40">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                      cx="80"
                                      cy="80"
                                      r="70"
                                      stroke="currentColor"
                                      strokeWidth="10"
                                      fill="none"
                                      className="text-gray-200 dark:text-gray-700"
                                    />
                                    <circle
                                      cx="80"
                                      cy="80"
                                      r="70"
                                      stroke="url(#gradient)"
                                      strokeWidth="10"
                                      fill="none"
                                      strokeDasharray={`${2 * Math.PI * 70}`}
                                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - ((badgeProgressData.nextTier.progress.participation + badgeProgressData.nextTier.progress.averageScore + badgeProgressData.nextTier.progress.events + badgeProgressData.nextTier.progress.sdgDiversity) / 400))}`}
                                      strokeLinecap="round"
                                      className="transition-all duration-500"
                                    />
                                    <defs>
                                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#3B82F6" />
                                      </linearGradient>
                                    </defs>
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                        {Math.round(
                                          ((badgeProgressData.nextTier.progress.participation +
                                            badgeProgressData.nextTier.progress.averageScore +
                                            badgeProgressData.nextTier.progress.events +
                                            badgeProgressData.nextTier.progress.sdgDiversity) / 4)
                                        )}%
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Stats Grid - 2x2 */}
                                <div className="grid grid-cols-2 gap-3 w-full">
                                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Participation</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                      {Math.round(badgeProgressData.currentProgress.participationRate)}%/{badgeProgressData.nextTier.requirements.minEmployeeParticipation}%
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Score</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                      {Math.round(badgeProgressData.currentProgress.averageScore)}/{badgeProgressData.nextTier.requirements.minAverageScore}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Events</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                      {badgeProgressData.currentProgress.totalEvents}/{badgeProgressData.nextTier.requirements.minEvents}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">SDGs</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                      {badgeProgressData.currentProgress.sdgDiversity}/{badgeProgressData.nextTier.requirements.minSDGDiversity}
                                    </p>
                                  </div>
                                </div>
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
                  )}

                  {/* SDG Badge Progress */}
                  {badgeProgressLoading ? (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          SDG Badge Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (() => {
                    // Filter badges with progress
                    const badgesWithProgress = badgeProgressData?.sdgBadges?.filter(sdg => {
                      return sdg.tiers.some(t => 
                        t.progress.hours > 0 || 
                        t.earned || 
                        t.progress.activities > 0 || 
                        t.progress.percentage > 0
                      );
                    }) || [];
                    
                    return badgesWithProgress.length > 0 ? (
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
                          Track progress across UN Sustainable Development Goals
                        </p>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {badgesWithProgress.map((sdgBadge) => {
                              const sdgInfo = getSDGById(sdgBadge.sdgNumber);
                              const earnedTiers = sdgBadge.tiers.filter(tier => tier.earned);
                              const currentTier = earnedTiers.length > 0 ? earnedTiers[earnedTiers.length - 1] : null;
                              const nextTier = sdgBadge.tiers.find(tier => !tier.earned);
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
                                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 rounded-2xl transition-all duration-300" />
                                  
                                  <div className="relative">
                                    {/* Line 1: Left - Rank badge, Right - SDG number and name */}
                                    <div className="flex items-center gap-4 mb-4">
                                      {/* Left: SDG rank badge */}
                                      <div className="relative w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden shadow-lg ring-2 ring-white dark:ring-gray-800 group-hover:ring-purple-200 dark:group-hover:ring-purple-800 transition-all">
                                        {currentTier ? (
                                          <Image
                                            src={getSDGBadgeImage(sdgBadge.sdgNumber, currentTier.tier as 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN')}
                                            alt={`${currentTier.name} - SDG ${sdgBadge.sdgNumber}`}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : nextTier ? (
                                          <Image
                                            src={getSDGBadgeImage(sdgBadge.sdgNumber, nextTier.tier as 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN')}
                                            alt={`${nextTier.name} - SDG ${sdgBadge.sdgNumber}`}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover opacity-50"
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
                                      
                                      {/* Right: SDG number (smaller) with colored badge + SDG name (bigger, bold, colored) */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge 
                                            className="text-xs px-2 py-0.5 font-medium"
                                            style={{ 
                                              backgroundColor: sdgInfo?.color || '#666',
                                              color: 'white',
                                              border: 'none'
                                            }}
                                          >
                                            SDG {sdgBadge.sdgNumber}
                                          </Badge>
                                        </div>
                                        <h4 
                                          className="font-bold text-lg text-gray-900 dark:text-white"
                                          style={{ color: sdgInfo?.color || undefined }}
                                        >
                                          {sdgBadge.sdgName}
                                        </h4>
                                      </div>
                                    </div>

                                    {/* Line 2: Divider */}
                                    <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>

                                    {/* Line 3: In Progress badge (centered) */}
                                    {totalHours > 0 || totalActivities > 0 ? (
                                      <div className="flex justify-center mb-4">
                                        <Badge className="text-xs px-3 py-1 font-semibold bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-900 dark:from-yellow-900/50 dark:to-orange-900/50 dark:text-yellow-200 border-0">
                                          In Progress
                                        </Badge>
                                      </div>
                                    ) : currentTier ? (
                                      <div className="flex justify-center mb-4">
                                        <Badge className={`text-xs px-3 py-1 font-semibold ${getTierBadgeColorClass(currentTier.tier)}`}>
                                          {currentTier.name}
                                        </Badge>
                </div>
                ) : (
                                      <div className="flex justify-center mb-4">
                                        <Badge className="text-xs px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-0">
                                          Not Started
                                        </Badge>
                                      </div>
                                    )}

                                    {/* Line 4: Rank name in bigger and bold black font */}
                                    {nextTier && (
                                      <div className="mb-2">
                                        <h5 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                                          {nextTier.name}
                                        </h5>
                                      </div>
                                    )}
                                    {currentTier && !nextTier && (
                                      <div className="mb-2">
                                        <h5 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                                          {currentTier.name}
                                        </h5>
                                      </div>
                                    )}

                                    {nextTier ? (
                                      <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-end text-sm">
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
                    ) : (
                      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-600" />
                            SDG Badge Progress
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-16">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 via-blue-100 to-green-100 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-green-900/30 flex items-center justify-center shadow-lg">
                              <Target className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                              No SDG Badges Yet
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                              This organization hasn&apos;t started earning SDG badges. Badges are earned by hosting events aligned with UN Sustainable Development Goals.
                            </p>
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span>Host Events</span>
                              </div>
                              <div className="text-gray-300 dark:text-gray-600">→</div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span>Earn Badges</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                </>
              )}

              {activeTab === 'events' && (
                <div className="space-y-6">
                  {/* Upcoming Events */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          Upcoming Events
                  </CardTitle>
                  <Link href={`/events?org=${orgId}`}>
                          <Button variant="ghost" size="sm" className="hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                      {organization.upcomingEvents && organization.upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {organization.upcomingEvents
                            .slice(0, 6)
                            .map((event) => (
                              <EventCard 
                                key={event.id} 
                                event={{
                                  ...event,
                                  isBookmarked: bookmarks.has(event.id),
                                  isFavorite: favorites.has(event.id),
                                  currentParticipants: event._count?.participations || 0
                                }} 
                                onToggleFavorite={toggleFavorite}
                                onToggleBookmark={toggleBookmark}
                                showOrganization={false} 
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No Upcoming Events
                            </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            This organization doesn&apos;t have any upcoming events scheduled.
                          </p>
                          {isAdmin && (
                            <Link href="/events/create">
                              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                                <Calendar className="w-4 h-4 mr-2" />
                                Create Event
                              </Button>
                      </Link>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Past Events */}
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        Recent Past Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {organization.pastEvents && organization.pastEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {organization.pastEvents
                            .slice(0, 6)
                            .map((event) => (
                              <EventCard 
                                key={event.id} 
                                event={{
                                  ...event,
                                  isBookmarked: bookmarks.has(event.id),
                                  isFavorite: favorites.has(event.id),
                                  currentParticipants: event._count?.participations || 0
                                }} 
                                onToggleFavorite={toggleFavorite}
                                onToggleBookmark={toggleBookmark}
                                showOrganization={false} 
                              />
                    ))}
                  </div>
                ) : (
                          <div className="text-center py-6">
                            <Clock className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              No past events to display
                            </p>
                          </div>
                )}
              </CardContent>
            </Card>

                  {/* Event Statistics */}
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Event Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {organization.eventCount || '0'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {organization.upcomingEvents?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {organization.pastEvents?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {organization.totalHours?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'opportunities' && (
                <div className="space-y-6">
                  {/* Opportunities Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Opportunities
                    </h2>
                    <Link href={`/opportunities?org=${orgId}`}>
                      <Button variant="outline" size="sm">
                        View All
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  {/* Opportunities List */}
                  <div className="grid gap-4">
                    {organization?.opportunities && organization.opportunities.length > 0 ? (
                      organization.opportunities.map((opportunity) => (
                        <OpportunityCard
                          key={opportunity.id}
                          opportunity={{
                            ...opportunity,
                            organization: { name: organization.name },
                            stats: {
                              totalApplications: opportunity.stats?.totalApplications || 0,
                              spotsRemaining: opportunity.stats?.spotsRemaining || (opportunity.spots - opportunity.spotsFilled)
                            }
                          }}
                          isBookmarked={bookmarkedOpportunities.includes(opportunity.id)}
                          isApplied={appliedOpportunities.includes(opportunity.id)}
                          isApplying={isApplying === opportunity.id}
                          onBookmark={handleBookmark}
                          onApply={handleApply}
                        />
                      ))
                    ) : (
                      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                        <CardContent className="p-12 text-center">
                          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                            No opportunities yet
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            This organization hasn&apos;t posted any opportunities yet.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'followers' && (
                <FollowersList organizationId={orgId} />
              )}
              
              {activeTab === 'impact' && (
                <div className="space-y-6">
                  {/* Impact Overview */}
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Impact Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                            {organization.impactScore?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                            Total Impact Score
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Lives positively impacted
                          </div>
                        </div>
                        
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {organization.totalHours?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Volunteer Hours
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Hours of service contributed
                          </div>
                        </div>
                        
                        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            {organization.memberCount?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                            Active Members
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            Committed volunteers
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ESG Impact Dashboard */}
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        ESG Impact Dashboard
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Environmental, Social, and Governance metrics based on actual organization activities
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* ESG Progress Bars */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Environmental Impact</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {organization.esgData?.environmental?.total?.toFixed(1) || '0'}%
                              </span>
                            </div>
                            <Progress 
                              value={organization.esgData?.environmental?.total || 0} 
                              className="h-3" 
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Based on SDG 6, 7, 11, 12, 13, 14, 15 activities and environmental initiatives
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Social Impact</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {organization.esgData?.social?.total?.toFixed(1) || '0'}%
                              </span>
                            </div>
                            <Progress 
                              value={organization.esgData?.social?.total || 0} 
                              className="h-3" 
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Based on SDG 1, 2, 3, 4, 5, 8, 10 activities and community engagement
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Governance Impact</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {organization.esgData?.governance?.total?.toFixed(1) || '0'}%
                              </span>
                            </div>
                            <Progress 
                              value={organization.esgData?.governance?.total || 0} 
                              className="h-3" 
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Based on SDG 16, 17 activities and organizational transparency
                            </p>
                          </div>
                        </div>

                        {/* Overall ESG Score */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                              {organization.esgData?.overall?.toFixed(1) || '0'}
                            </div>
                            <div className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-1">
                              Overall ESG Score
                            </div>
                            <div className="text-sm text-purple-600 dark:text-purple-400">
                              Calculated from Environmental (40%), Social (35%), and Governance (25%) metrics
                            </div>
                          </div>
                        </div>

                        {/* Real Performance Indicators */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {organization.totalHours?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Volunteer Hours</div>
                          </div>
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {organization.eventCount || '0'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Events Completed</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {organization.memberCount || '0'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Active Members</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {organization.followerCount || '0'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              )}
            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Current Rank */}
            {badgeProgressData && (
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
                  {/* Current Rank and Next Rank - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Current Rank Card */}
                    <div className="text-center py-4 px-3 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-3 shadow-lg">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        {badgeProgressData.currentTier.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        Current
                      </p>
                    </div>

                    {/* Next Rank Card */}
                    {badgeProgressData.nextTier ? (
                      <div className="text-center py-4 px-3 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 mb-3 shadow-lg">
                          <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                          {badgeProgressData.nextTier.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                          Next
                        </p>
                        <div className="space-y-1.5">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {Math.round(
                              ((badgeProgressData.nextTier.progress.participation +
                                badgeProgressData.nextTier.progress.averageScore +
                                badgeProgressData.nextTier.progress.events +
                                badgeProgressData.nextTier.progress.sdgDiversity) / 4)
                            )}%
                          </div>
                          <Progress 
                            value={
                              (badgeProgressData.nextTier.progress.participation +
                                badgeProgressData.nextTier.progress.averageScore +
                                badgeProgressData.nextTier.progress.events +
                                badgeProgressData.nextTier.progress.sdgDiversity) / 4
                            } 
                            className="h-1.5" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 px-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-3 shadow-lg">
                          <Star className="w-8 h-8 text-white fill-white" />
                        </div>
                        <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-200 mb-1">
                          Max
                        </h3>
                        <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                          Highest Rank
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SDG Participation */}
            {organization.sdgParticipations && organization.sdgParticipations.length > 0 && (
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
                    {organization.sdgParticipations.map((sdgData: { sdgNumber: number; eventCount: number }, index: number) => {
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
                              <p className="font-medium text-sm text-gray-900 dark:text-white">
                                SDG {sdgInfo.id}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {sdgInfo.title}
                              </p>
                            </div>
                          </div>
                          <Badge className="px-3 py-1 text-white text-xs whitespace-nowrap flex-shrink-0" style={{ backgroundColor: sdgInfo.color }}>
                            {sdgData.eventCount} {sdgData.eventCount === 1 ? 'event' : 'events'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Badges */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Badges Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                {organization.badges && organization.badges.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {organization.badges.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total badges earned
                    </p>
                    <Link href={`/organizations/${orgId}/certificates`}>
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        View All Badges
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                    No badges earned yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Top Volunteers */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Top Volunteers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {organization.topVolunteers && organization.topVolunteers.length > 0 ? (
                  <div className="space-y-3">
                    {organization.topVolunteers.map((volunteer, index) => (
                      <Link key={volunteer.id} href={`/profile/${volunteer.id}`}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                          <div className="text-sm font-bold text-gray-400 w-6">
                            #{index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            {volunteer.avatar ? (
                              <AvatarImage src={volunteer.avatar} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                                {volunteer.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {volunteer.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {volunteer.hours} hours
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                    No volunteers yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events Card */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2 pb-4 px-4">
                {organization.upcomingEvents && organization.upcomingEvents.length > 0 ? (
                  organization.upcomingEvents
                    .slice(0, 3)
                    .map((event) => (
                    <Link 
                      key={event.id} 
                      href={`/events/${event.id}`}
                      className="block group"
                    >
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        {/* Date and Time at the top */}
                        <div className="mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full">
                              <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                {formatEventDate(event.startDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-full">
                              <Clock className="w-3 h-3 text-green-600 dark:text-green-400" />
                              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                {formatEventTimeRange(event.startDate, event.endDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Thumbnail and Title on one line */}
                        <div className="flex gap-3 items-start mb-2">
                          {/* Event Thumbnail */}
                          <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600">
                            {event.imageUrl ? (
                              <Image 
                                src={event.imageUrl} 
                                alt={event.title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Event Title and Location */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {(() => {
                                  let locationData;
                                  if (typeof event.location === 'string') {
                                    try {
                                      locationData = JSON.parse(event.location);
                                    } catch (e) {
                                      locationData = {
                                        address: event.location,
                                        city: 'Unknown',
                                        country: 'Unknown',
                                        isVirtual: false
                                      };
                                    }
                                  } else {
                                    locationData = event.location;
                                  }
                                  return locationData.isVirtual ? 'Virtual Event' : `${locationData.city}, ${locationData.country}`;
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No upcoming events
                    </p>
                  </div>
                )}
                
                {organization.upcomingEvents && organization.upcomingEvents.length > 3 && (
                  <div className="pt-2">
                <Link href={`/events?org=${orgId}`}>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                        View All Events
                        <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard Ranking */}
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
                    #12
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      1,247 total
                  </p>
        </div>

                {/* Local Rank */}
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Local ({organization.country || 'Malaysia'})
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    #3
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      89 total
                  </p>
                  </div>
                </div>

                {/* View Full Leaderboard Button */}
                  <Link href="/leaderboards?type=organizations">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-2"
                  >
                    View Leaderboard
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}

