'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  badges: any[];
  recentEvents: any[];
  topVolunteers: any[];
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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }
    fetchOrganization();
  }, [session, status, orgId]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/profile?id=${orgId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }
      
      const data = await response.json();
      setOrganization(data.organization);
      setIsFollowing(data.organization.isFollowing);
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

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
              This organization doesn't exist or you don't have access to view it.
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header Banner */}
        <Card className="mb-6 overflow-hidden border-0 shadow-lg">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          <CardContent className="p-6 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Organization Logo */}
              <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-xl">
                {organization.logo ? (
                  <AvatarImage src={organization.logo} alt={organization.name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-3xl">
                    {organization.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Organization Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {organization.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={`${getTierColor(organization.tier)} border-0`}>
                        {formatTierName(organization.tier)}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {organization.type}
                      </span>
                      {organization.city && organization.country && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          {organization.city}, {organization.country}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`${
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
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-gray-700 dark:text-gray-300">
                  {organization.description}
                </p>

                {/* Contact Info */}
                <div className="mt-4 flex flex-wrap gap-4">
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
                  {organization.email && (
                    <a 
                      href={`mailto:${organization.email}`}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Mail className="w-4 h-4" />
                      {organization.email}
                    </a>
                  )}
                  {organization.phone && (
                    <a 
                      href={`tel:${organization.phone}`}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Phone className="w-4 h-4" />
                      {organization.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            
            {/* SDG Focus */}
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
                              {event.location}
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
                            {volunteer.image ? (
                              <AvatarImage src={volunteer.image} />
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

            {/* CTA Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardContent className="p-6 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                  Get Involved
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Join this organization's events and make an impact!
                </p>
                <Link href={`/events?org=${orgId}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    View Upcoming Events
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

