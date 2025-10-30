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
import { getSDGById } from '@/constants/sdgs';

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

const getTierColor = (tier: string) => {
  const tierMap: Record<string, string> = {
    'IMPACT_STARTER': 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
    'COMMUNITY_BUILDER': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    'IMPACT_DRIVER': 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    'COMMUNITY_ALLY': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    'CSR_PRACTITIONER': 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30',
    'CSR_LEADER': 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30',
    'ESG_CHAMPION': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    'TRUSTED_PARTNER': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
    'INDUSTRY_BENCHMARK': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    'GLOBAL_IMPACT_LEADER': 'text-purple-600 bg-gradient-to-r from-purple-100 to-pink-100 dark:text-purple-300 dark:from-purple-900/30 dark:to-pink-900/30',
  };
  return tierMap[tier] || tierMap['IMPACT_STARTER'];
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
  const [activeTab, setActiveTab] = useState<'feed' | 'about' | 'events' | 'opportunities' | 'impact' | 'followers'>('feed');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [bookmarkedOpportunities, setBookmarkedOpportunities] = useState<string[]>([]);
  const [appliedOpportunities, setAppliedOpportunities] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${orgId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }
      
      const data = await response.json();
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
      setError('Failed to load organization');
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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }
    fetchOrganization();
    loadBookmarks();
  }, [session, status, orgId, fetchOrganization, router, loadBookmarks]);

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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Organization Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This organization doesn&apos;t exist or you don&apos;t have access to view it.
            </p>
            <Button onClick={() => router.push('/leaderboards?type=organizations')}>
              Browse Organizations
            </Button>
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
            <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl">
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
                        <Badge className="bg-blue-500 text-white text-sm px-2 py-1">
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
                            {organization.city && organization.country 
                              ? `${organization.city}, ${organization.country}`
                              : 'Global'
                            }
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
          <Card className="border-0 shadow-sm">
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

          <Card className="border-0 shadow-sm">
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

          <Card className="border-0 shadow-sm">
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

          <Card className="border-0 shadow-sm">
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
                variant={activeTab === 'feed' ? 'default' : 'outline'}
                onClick={() => setActiveTab('feed')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'feed' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Feed
              </Button>
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
                  <Card className="border-0 shadow-sm">
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
                            {organization.industry || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Company Size</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {organization.companySize || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Location</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {organization.city && organization.country 
                              ? `${organization.city}, ${organization.country}`
                              : organization.country || 'Not specified'
                            }
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
                    <Card className="border-0 shadow-sm">
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

            {/* Team & Leadership */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Team & Leadership
                </CardTitle>
              </CardHeader>
              <CardContent>
                {organization.members && organization.members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {organization.members.slice(0, 6).map((member) => (
                      <div key={member.userId} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Avatar className="w-12 h-12">
                          {member.user?.image ? (
                            <AvatarImage src={member.user.image} alt={member.user.name || member.user.email} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                              {member.user?.name ? member.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {member.user?.name || member.user?.email || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {member.role}
                          </p>
                          {member.user?.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {member.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {organization.members.length > 6 && (
                      <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          +{organization.members.length - 6} more team members
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                    No team members found
                  </p>
                )}
              </CardContent>
            </Card>
                </>
              )}
              
              {activeTab === 'events' && (
                <div className="space-y-6">
                  {/* Upcoming Events */}
                  <Card className="border-0 shadow-sm">
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
                  <Card className="border-0 shadow-sm">
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
                  <Card className="border-0 shadow-sm">
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
                      <Card className="border-0 shadow-sm">
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
                  <Card className="border-0 shadow-sm">
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
                  <Card className="border-0 shadow-sm">
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
            
            {/* Badges */}
            <Card className="border-0 shadow-sm">
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
            <Card className="border-0 shadow-sm">
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
            <Card className="border-0 shadow-sm">
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
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  Leaderboard Ranking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Global Rank */}
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Global Rank</p>
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-3 py-1">
                      {organization.tier.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                    </Badge>
          </div>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    #12
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    out of 1,247 organizations
                  </p>
        </div>

                {/* Local Rank */}
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Local Rank ({organization.country || 'Malaysia'})
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    #3
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    out of 89 organizations
                  </p>
                </div>

                {/* View Full Leaderboard Button */}
                <div className="pt-4">
                  <Link href="/leaderboards?type=organizations">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                      View Full Leaderboard
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}

