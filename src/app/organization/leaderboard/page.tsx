// home/ubuntu/impaktrweb/src/app/organization/leaderboard/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Medal, 
  TrendingUp,
  TrendingDown,
  Minus,
  Users, 
  Building2,
  Filter,
  Globe,
  MapPin,
  BarChart3,
  Award,
  Crown,
  Leaf,
  Target as TargetIcon,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { getSDGById } from '@/constants/sdgs';

interface OrganizationRanking {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  companySize: string;
  country: string;
  impactScore: number;
  participationRate: number;
  volunteerHours: number;
  eventCount: number;
  memberCount: number;
  rank: number;
  tier: string;
  trend?: number; // Rank change
}

interface LeaderboardData {
  organizations: OrganizationRanking[];
  currentOrganization?: OrganizationRanking;
  totalOrganizations: number;
}

export default function OrganizationLeaderboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('30d');
  const [sdgFilter, setSdgFilter] = useState<string>('all');

  const fetchLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        industry: industryFilter,
        size: sizeFilter,
        country: countryFilter,
        period: periodFilter,
      });
      if (sdgFilter !== 'all') params.set('sdg', sdgFilter);

      const response = await fetch(`/api/organizations/leaderboard?${params}`);
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const data = await response.json();
      setLeaderboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [industryFilter, sizeFilter, countryFilter, periodFilter, sdgFilter, router]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchLeaderboardData();
    }
  }, [isLoading, user, router, industryFilter, sizeFilter, countryFilter, periodFilter, fetchLeaderboardData]);

  // Derived helpers for SDG category mapping and leaderboard summaries
  const sdgToCategory = useCallback((sdgId: number): 'ENV' | 'SOC' | 'GOV' => {
    if ([6,7,12,13,14,15].includes(sdgId)) return 'ENV';
    if ([1,2,3,4,5,10,11].includes(sdgId)) return 'SOC';
    return 'GOV';
  }, []);

  const sortedBySdg = useMemo(() => {
    if (!leaderboardData) return [] as OrganizationRanking[];
    if (sdgFilter === 'all') return leaderboardData.organizations;
    const sdgId = Number(sdgFilter);
    const category = sdgToCategory(sdgId);
    const arr = [...leaderboardData.organizations];
    if (category === 'ENV') {
      return arr.sort((a, b) => b.volunteerHours - a.volunteerHours);
    }
    if (category === 'SOC') {
      return arr.sort((a, b) => b.participationRate - a.participationRate);
    }
    return arr.sort((a, b) => b.eventCount - a.eventCount);
  }, [leaderboardData, sdgFilter, sdgToCategory]);

  const topEnv = useMemo(() => {
    if (!leaderboardData) return [] as OrganizationRanking[];
    return [...leaderboardData.organizations].sort((a,b) => b.volunteerHours - a.volunteerHours).slice(0,3);
  }, [leaderboardData]);

  const topSoc = useMemo(() => {
    if (!leaderboardData) return [] as OrganizationRanking[];
    return [...leaderboardData.organizations].sort((a,b) => b.participationRate - a.participationRate).slice(0,3);
  }, [leaderboardData]);

  const topGov = useMemo(() => {
    if (!leaderboardData) return [] as OrganizationRanking[];
    return [...leaderboardData.organizations].sort((a,b) => b.eventCount - a.eventCount).slice(0,3);
  }, [leaderboardData]);

  const mostHours = useMemo(() => {
    if (!leaderboardData) return null as OrganizationRanking | null;
    return [...leaderboardData.organizations].sort((a,b) => b.volunteerHours - a.volunteerHours)[0] || null;
  }, [leaderboardData]);
  const mostEvents = useMemo(() => {
    if (!leaderboardData) return null as OrganizationRanking | null;
    return [...leaderboardData.organizations].sort((a,b) => b.eventCount - a.eventCount)[0] || null;
  }, [leaderboardData]);
  const bestParticipation = useMemo(() => {
    if (!leaderboardData) return null as OrganizationRanking | null;
    return [...leaderboardData.organizations].sort((a,b) => b.participationRate - a.participationRate)[0] || null;
  }, [leaderboardData]);
  const biggestClimber = useMemo(() => {
    if (!leaderboardData) return null as OrganizationRanking | null;
    return [...leaderboardData.organizations]
      .filter(o => typeof o.trend === 'number')
      .sort((a,b) => (b.trend || 0) - (a.trend || 0))[0] || null;
  }, [leaderboardData]);

  const progressInfo = useMemo(() => {
    const current = leaderboardData?.currentOrganization;
    if (!current) return null as null | {
      currentRank: number;
      impactScore: number;
      nextRank?: number;
      nextScore?: number;
      progressPct?: number;
      delta?: number;
    };
    const sortedByScore = [...(leaderboardData?.organizations || [])].sort((a,b) => b.impactScore - a.impactScore);
    const idx = sortedByScore.findIndex(o => o.id === current.id);
    const target = idx > 0 ? sortedByScore[idx-1] : undefined;
    const delta = target ? Math.max(0, target.impactScore - current.impactScore) : 0;
    const progressPct = target ? Math.min(100, (current.impactScore / Math.max(1, target.impactScore)) * 100) : 100;
    return { currentRank: current.rank, impactScore: current.impactScore, nextRank: target?.rank, nextScore: target?.impactScore, progressPct, delta };
  }, [leaderboardData]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold text-lg shadow-lg">
          <Crown className="h-6 w-6" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white font-bold text-lg shadow-lg">
          <Medal className="h-6 w-6" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-lg shadow-lg">
          <Award className="h-6 w-6" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-lg">
        #{rank}
      </div>
    );
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-800';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      case 'SILVER': return 'bg-gray-100 text-gray-800';
      case 'BRONZE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'SMALL': return 'Small (<50)';
      case 'MEDIUM': return 'Medium (50-500)';
      case 'LARGE': return 'Large (>500)';
      default: return size;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!leaderboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-muted-foreground mb-4">Unable to load leaderboard data.</p>
          <Button onClick={() => router.push('/organization/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // (moved derived helpers above early returns)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[22px] pb-8">

        {/* Compact Professional Header */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left: Page Info */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Organization Leaderboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    See how your organization ranks against others
                  </p>
                </div>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leaderboardData.totalOrganizations}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Organizations</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Organization Card */}
        {leaderboardData.currentOrganization && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    {leaderboardData.currentOrganization.logo && (
                      <AvatarImage
                        src={leaderboardData.currentOrganization.logo}
                        alt={leaderboardData.currentOrganization.name}
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-2xl">
                      {leaderboardData.currentOrganization.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{leaderboardData.currentOrganization.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getTierColor(leaderboardData.currentOrganization.tier)}>
                        {leaderboardData.currentOrganization.tier}
                      </Badge>
                      <Badge variant="outline">
                        {getSizeLabel(leaderboardData.currentOrganization.companySize)}
                      </Badge>
                      <Badge variant="outline">
                        {leaderboardData.currentOrganization.industry}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end mb-2">
                    {getRankBadge(leaderboardData.currentOrganization.rank)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Rank</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {leaderboardData.currentOrganization.impactScore.toLocaleString()} pts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-48">
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="TECH">Technology</SelectItem>
                    <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="NGO">NGO</SelectItem>
                    <SelectItem value="EDUCATION">Education</SelectItem>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="MANUFACTURING">Manufacturing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-48">
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Company Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="SMALL">Small (&lt;50)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (50-500)</SelectItem>
                    <SelectItem value="LARGE">Large (&gt;500)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-48">
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="Malaysia">Malaysia</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="Global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-48">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-64">
                <Select value={sdgFilter} onValueChange={setSdgFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="SDG" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All SDGs</SelectItem>
                    {Array.from({ length: 17 }, (_, i) => i + 1).map((sdgId) => {
                      const sdg = getSDGById(sdgId);
                      return sdg ? (
                        <SelectItem key={sdgId} value={String(sdgId)}>
                          {sdgId}. {sdg.title}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Podium */}
        {leaderboardData.organizations.length >= 3 && (
          <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardContent className="p-8">
              <div className="flex items-end justify-center space-x-8">
                {/* Second Place */}
                {leaderboardData.organizations[1] && (
                  <div className="flex flex-col items-center space-y-3" style={{ paddingBottom: '40px' }}>
                    <Avatar className="h-20 w-20 border-4 border-gray-400">
                      {leaderboardData.organizations[1].logo && (
                        <AvatarImage src={leaderboardData.organizations[1].logo} alt={leaderboardData.organizations[1].name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-600 text-white font-bold text-2xl">
                        {leaderboardData.organizations[1].name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-32 h-32 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex flex-col items-center justify-center shadow-lg">
                      <Medal className="h-12 w-12 text-white mb-2" />
                      <span className="text-white font-bold text-2xl">2nd</span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white">{leaderboardData.organizations[1].name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{leaderboardData.organizations[1].impactScore.toLocaleString()} pts</p>
                    </div>
                  </div>
                )}

                {/* First Place */}
                {leaderboardData.organizations[0] && (
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-24 w-24 border-4 border-yellow-400">
                      {leaderboardData.organizations[0].logo && (
                        <AvatarImage src={leaderboardData.organizations[0].logo} alt={leaderboardData.organizations[0].name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold text-3xl">
                        {leaderboardData.organizations[0].name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-32 h-40 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-lg flex flex-col items-center justify-center shadow-xl">
                      <Crown className="h-16 w-16 text-white mb-2" />
                      <span className="text-white font-bold text-3xl">1st</span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white">{leaderboardData.organizations[0].name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{leaderboardData.organizations[0].impactScore.toLocaleString()} pts</p>
                    </div>
                  </div>
                )}

                {/* Third Place */}
                {leaderboardData.organizations[2] && (
                  <div className="flex flex-col items-center space-y-3" style={{ paddingBottom: '80px' }}>
                    <Avatar className="h-20 w-20 border-4 border-orange-400">
                      {leaderboardData.organizations[2].logo && (
                        <AvatarImage src={leaderboardData.organizations[2].logo} alt={leaderboardData.organizations[2].name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold text-2xl">
                        {leaderboardData.organizations[2].name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-32 h-24 bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-lg flex flex-col items-center justify-center shadow-lg">
                      <Award className="h-10 w-10 text-white mb-2" />
                      <span className="text-white font-bold text-2xl">3rd</span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white">{leaderboardData.organizations[2].name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{leaderboardData.organizations[2].impactScore.toLocaleString()} pts</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Rankings (respects SDG filter ordering by proxy metric) */}
        <Card>
          <CardHeader>
            <CardTitle>Full Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedBySdg.map((org) => {
                const isCurrentOrg = leaderboardData.currentOrganization?.id === org.id;
                
                return (
                  <div
                    key={org.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      isCurrentOrg
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-2 border-blue-600 dark:border-blue-400'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {getRankBadge(org.rank)}
                      <Avatar className="h-12 w-12">
                        {org.logo && (
                          <AvatarImage src={org.logo} alt={org.name} />
                        )}
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg">
                          {org.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className={`font-bold ${isCurrentOrg ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                            {org.name}
                          </p>
                          {isCurrentOrg && (
                            <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getTierColor(org.tier)} variant="outline">
                            {org.tier}
                          </Badge>
                          <Badge variant="outline">
                            {org.industry}
                          </Badge>
                          <Badge variant="outline">
                            <MapPin className="w-3 h-3 mr-1" />
                            {org.country}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{org.participationRate.toFixed(1)}%</p>
                          <p className="text-muted-foreground text-xs">Participation</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{org.volunteerHours.toLocaleString()}</p>
                          <p className="text-muted-foreground text-xs">Hours</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{org.eventCount}</p>
                          <p className="text-muted-foreground text-xs">Events</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{org.memberCount}</p>
                          <p className="text-muted-foreground text-xs">Members</p>
                        </div>
                      </div>
                      
                      <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {org.impactScore.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Impact Score</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(org.trend)}
                          {org.trend !== undefined && org.trend !== 0 && (
                            <span className={`text-sm font-medium ${
                              org.trend && org.trend > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Math.abs(org.trend || 0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {leaderboardData.organizations.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No organizations found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Leaders by SDG (Proxy categories) */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Category Leaders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-sm transition">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <span>Environmental Champions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topEnv.map((o, i) => (
                  <div key={o.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm w-4 text-gray-500 dark:text-gray-400 font-semibold">{i+1}</div>
                      <Avatar className="h-8 w-8">
                        {o.logo && <AvatarImage src={o.logo} alt={o.name} />}
                        <AvatarFallback className="text-xs">{o.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{o.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{o.volunteerHours.toLocaleString()} hrs</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span>Social Leaders</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topSoc.map((o, i) => (
                  <div key={o.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm w-4 text-gray-500 dark:text-gray-400 font-semibold">{i+1}</div>
                      <Avatar className="h-8 w-8">
                        {o.logo && <AvatarImage src={o.logo} alt={o.name} />}
                        <AvatarFallback className="text-xs">{o.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{o.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{o.participationRate.toFixed(1)}%</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span>Governance Leaders</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topGov.map((o, i) => (
                  <div key={o.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm w-4 text-gray-500 dark:text-gray-400 font-semibold">{i+1}</div>
                      <Avatar className="h-8 w-8">
                        {o.logo && <AvatarImage src={o.logo} alt={o.name} />}
                        <AvatarFallback className="text-xs">{o.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{o.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{o.eventCount} events</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Special Achievements */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Special Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-sm transition">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Highest Participation Rate</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{bestParticipation ? bestParticipation.name : '—'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{bestParticipation ? `${bestParticipation.participationRate.toFixed(1)}%` : ''}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-sm transition">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Most Volunteer Hours</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{mostHours ? mostHours.name : '—'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{mostHours ? `${mostHours.volunteerHours.toLocaleString()} hrs` : ''}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-sm transition">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Most Events Hosted</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{mostEvents ? mostEvents.name : '—'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{mostEvents ? `${mostEvents.eventCount} events` : ''}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-sm transition">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Biggest Climber</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{biggestClimber ? biggestClimber.name : '—'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{biggestClimber && biggestClimber.trend ? `+${biggestClimber.trend}` : ''}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Your Progress */}
        {progressInfo && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TargetIcon className="w-5 h-5 text-purple-600" />
                <span>Your Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">#{progressInfo.currentRank}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{progressInfo.impactScore.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Impact Points</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{progressInfo.nextRank ? `#${progressInfo.nextRank}` : 'Top'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Next Target</div>
                </div>
              </div>
              {progressInfo.nextScore !== undefined && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Progress to next rank</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{progressInfo.impactScore.toLocaleString()} / {progressInfo.nextScore?.toLocaleString()} pts</span>
                  </div>
                  <Progress value={progressInfo.progressPct || 0} className="h-2" />
                  {typeof progressInfo.delta === 'number' && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{progressInfo.delta.toLocaleString()} points to go</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ready to climb CTA */}
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready to climb the leaderboard?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">Boost participation, host meaningful events, and motivate your team to move up the ranks.</p>
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Sparkles className="w-5 h-5 mr-2" />
                See tips to improve
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
