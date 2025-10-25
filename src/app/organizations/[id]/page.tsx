'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
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
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UnifiedFeed } from '@/components/dashboard/UnifiedFeed';
import { EventCard } from '@/components/events/EventCard';

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

// Event interface for organization events
interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string | object;
  maxParticipants?: number;
  currentParticipants?: number;
  interestedCount?: number;
  status: string;
  imageUrl?: string;
  sdg: string | number | number[];
  participantCount?: number;
  organization?: {
    id: string;
    name: string;
    logo?: string;
  };
}

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
    'REGISTERED': 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
    'PARTICIPANT': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    'COMMUNITY_ALLY': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    'CONTRIBUTOR': 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    'CSR_PRACTITIONER': 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30',
    'CSR_LEADER': 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30',
    'ESG_CHAMPION': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    'TRUSTED_PARTNER': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
    'INDUSTRY_BENCHMARK': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    'GLOBAL_IMPACT_LEADER': 'text-purple-600 bg-gradient-to-r from-purple-100 to-pink-100 dark:text-purple-300 dark:from-purple-900/30 dark:to-pink-900/30',
  };
  return tierMap[tier] || tierMap['REGISTERED'];
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

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'about' | 'events' | 'impact'>('feed');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/profile?id=${orgId}`);
      
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
      const response = await fetch(`/api/organizations/${orgId}/follow`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to follow organization');
      }

      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (err) {
      console.error('Error following organization:', err);
    } finally {
      setFollowLoading(false);
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
                          <span className="font-semibold">{organization.memberCount}</span>
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
                          className={`flex-1 sm:flex-none ${
                        isFollowing
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                    {organization.totalHours.toLocaleString()}
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
                    {organization.eventCount}
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
                Events
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
                    {/* Mission & Vision */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Our Mission & Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mission</h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {organization.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Vision</h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    To create a sustainable future where environmental conservation and community development go hand in hand, 
                    empowering individuals and organizations to make meaningful impact through collaborative action and innovative solutions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Core Values</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Environmental Stewardship</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Community Empowerment</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Transparency & Accountability</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Innovation & Impact</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact Metrics Dashboard */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Impact Metrics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {organization.totalHours.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Hours Donated</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {organization.memberCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Volunteers</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {organization.eventCount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Events Completed</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {organization.impactScore.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Lives Impacted</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Environmental Impact</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Community Engagement</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Volunteer Satisfaction</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">96%</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SDG Focus Areas */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  SDG Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {organization.sdgs && organization.sdgs.length > 0 ? (
                    organization.sdgs.map((sdg) => (
                      <Badge 
                        key={sdg}
                        variant="outline" 
                        className="px-3 py-1.5 text-sm border-blue-200 dark:border-blue-800"
                      >
                        <Leaf className="w-3 h-3 mr-1" />
                        SDG {sdg}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No SDG focus areas specified
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Recent Events
                  </CardTitle>
                  <Link href={`/events?org=${orgId}`}>
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {organization.recentEvents && organization.recentEvents.length > 0 ? (
                  <div className="space-y-3">
                    {organization.recentEvents.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`}>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(event.startDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {typeof event.location === 'string' ? event.location : 'Location TBD'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                    No recent events
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Team & Leadership */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Team & Leadership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">John Doe</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Executive Director</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">15 years experience in environmental conservation</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face" />
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Sarah Miller</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Program Manager</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Expert in community engagement and volunteer coordination</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transparency & Accountability */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Transparency & Accountability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">95%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Program Spending</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">5%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Administrative</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">A+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Accountability Rating</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900 dark:text-white">Certifications & Awards</h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ISO 14001 Certified
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Charity Navigator 4-Star
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        UN Global Compact
                      </Badge>
                    </div>
                  </div>
                </div>
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
                      {organization.recentEvents && organization.recentEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {organization.recentEvents
                            .filter(event => new Date(event.startDate) > new Date())
                            .slice(0, 6)
                            .map((event) => (
                              <EventCard 
                                key={event.id} 
                                event={{
                                  ...event,
                                  isBookmarked: bookmarks.has(event.id),
                                  currentParticipants: event.participantCount || event.currentParticipants || 0
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
                      {organization.recentEvents && organization.recentEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {organization.recentEvents
                            .filter(event => new Date(event.startDate) <= new Date())
                            .slice(0, 6)
                            .map((event) => (
                              <EventCard 
                                key={event.id} 
                                event={{
                                  ...event,
                                  isBookmarked: bookmarks.has(event.id),
                                  currentParticipants: event.participantCount || event.currentParticipants || 0
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
                            {organization.eventCount}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {organization.recentEvents?.filter(e => new Date(e.startDate) > new Date()).length || 0}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {organization.recentEvents?.filter(e => new Date(e.startDate) <= new Date()).length || 0}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {organization.totalHours.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                            {organization.impactScore.toLocaleString()}
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
                            {organization.totalHours.toLocaleString()}
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
                            {organization.memberCount.toLocaleString()}
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

                  {/* Impact Metrics Dashboard */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Impact Metrics Dashboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Progress Bars */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Environmental Impact</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">85%</span>
                            </div>
                            <Progress value={85} className="h-3" />
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Carbon footprint reduction and environmental conservation efforts
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Community Engagement</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">92%</span>
                            </div>
                            <Progress value={92} className="h-3" />
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Local community involvement and social impact
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Volunteer Satisfaction</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">96%</span>
                            </div>
                            <Progress value={96} className="h-3" />
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Volunteer experience and retention rates
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Program Effectiveness</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">88%</span>
                            </div>
                            <Progress value={88} className="h-3" />
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Measurable outcomes and goal achievement
                            </p>
                          </div>
                        </div>

                        {/* Key Performance Indicators */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {Math.floor(organization.impactScore / 100)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Lives Impacted</div>
                          </div>
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {organization.eventCount}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Events Completed</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {Math.floor(organization.totalHours / 10)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Communities Served</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {Math.floor(organization.impactScore / 50)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Projects Completed</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Impact Stories */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-600" />
                        Impact Stories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Leaf className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Environmental Conservation Success
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Through our beach cleanup initiatives, we&apos;ve successfully removed over 2 tons of plastic waste from local coastlines, 
                                protecting marine life and improving water quality for future generations.
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  150+ volunteers
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  600+ hours
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  SDG 14, 6
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Community Education Impact
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Our digital literacy workshops have empowered 500+ community members with essential technology skills, 
                                opening new opportunities for employment and personal growth.
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  500+ participants
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  1,200+ hours
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  SDG 4, 8
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Heart className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Health & Wellness Initiative
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Our mental health awareness programs have reached over 1,000 individuals, providing crucial support and resources 
                                to improve community wellbeing and reduce stigma around mental health.
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  1,000+ reached
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  800+ hours
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  SDG 3, 10
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SDG Impact Alignment */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        SDG Impact Alignment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {organization.sdgs && organization.sdgs.length > 0 ? (
                          organization.sdgs.map((sdg) => (
                            <div key={sdg} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                  <Target className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    SDG {sdg}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {getSDGDescription(sdg)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-8">
                            <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              No SDG focus areas specified
                            </p>
                          </div>
                        )}
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
                {organization.recentEvents && organization.recentEvents.length > 0 ? (
                  organization.recentEvents
                    .filter(event => new Date(event.startDate) > new Date())
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
                
                {organization.recentEvents && organization.recentEvents.filter(event => new Date(event.startDate) > new Date()).length > 3 && (
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
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-3 py-1.5">
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

