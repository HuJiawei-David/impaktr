'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, 
  Medal, 
  Award,
  Crown, 
  Star,
  TrendingUp, 
  TrendingDown,
  Minus,
  Users, 
  Calendar,
  Target,
  Zap,
  Globe,
  Heart,
  Building2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Filter,
  Clock,
  BarChart3,
  Leaf,
  MapPin,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSDGById } from '@/constants/sdgs';
import { countries } from '@/constants/countries';

interface UserRanking {
  id: string;
  name: string;
  image?: string;
  impactScore: number;
  volunteerHours: number;
  eventsJoined: number;
  badgesEarned: number;
  rank: number;
  tier: string;
  trend?: number; // Rank change
  specialty?: string;
  location?: {
    city?: string;
    country?: string;
  };
}

interface OrganizationRanking {
  id: string;
  name: string;
  logo?: string;
  type?: string;
  impactScore: number;
  esgScore?: number;
  rank: number;
  tier?: string;
  location?: {
    city?: string;
    country?: string;
  };
  stats?: {
    members?: number;
    events?: number;
  };
}

interface LeaderboardData {
  users: UserRanking[];
  organizations?: OrganizationRanking[];
  rankings?: OrganizationRanking[];
  currentUser?: UserRanking;
  totalUsers: number;
  type?: string;
}

function LeaderboardsPageContent() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get initial type from URL params
  const initialType = searchParams.get('type') === 'organizations' ? 'organizations' : 'individuals';
  
  // Filters
  const [leaderboardType, setLeaderboardType] = useState<'individuals' | 'organizations'>(initialType);
  const [sdgFilter, setSdgFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState('monthly');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  
  const fetchLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: leaderboardType,
        period: periodFilter,
      });
      if (sdgFilter !== 'all') params.set('sdg', sdgFilter);
      if (countryFilter !== 'all') params.set('country', countryFilter);

      const response = await fetch(`/api/leaderboards?${params}`);
      
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
  }, [leaderboardType, periodFilter, sdgFilter, countryFilter, router]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchLeaderboardData();
    }
  }, [isLoading, user, router, leaderboardType, periodFilter, sdgFilter, countryFilter, fetchLeaderboardData]);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCountryDropdown && !target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountryDropdown]);

  // Derived helpers for SDG category mapping and leaderboard summaries
  const sdgToCategory = useCallback((sdgId: number): 'ENV' | 'SOC' | 'GOV' => {
    if ([6,7,12,13,14,15].includes(sdgId)) return 'ENV';
    if ([1,2,3,4,5,10,11].includes(sdgId)) return 'SOC';
    return 'GOV';
  }, []);

  const sortedBySdg = useMemo(() => {
    if (!leaderboardData) return [];
    
    if (leaderboardType === 'individuals') {
      let filtered = [...(leaderboardData.users || [])] as UserRanking[];
      
      // Apply search filter
      if (searchQuery.trim()) {
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply SDG filter and sorting
      if (sdgFilter !== 'all') {
        const sdgId = Number(sdgFilter);
        const category = sdgToCategory(sdgId);
        if (category === 'ENV') {
          return filtered.sort((a, b) => (b.volunteerHours || 0) - (a.volunteerHours || 0));
        }
        if (category === 'SOC') {
          return filtered.sort((a, b) => (b.eventsJoined || 0) - (a.eventsJoined || 0));
        }
        return filtered.sort((a, b) => (b.badgesEarned || 0) - (a.badgesEarned || 0));
      }
      
      return filtered;
    } else {
      // Organizations
      let filtered = [...(leaderboardData.rankings || [])] as OrganizationRanking[];
      
      // Apply search filter
      if (searchQuery.trim()) {
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return filtered;
    }
  }, [leaderboardData, leaderboardType, sdgFilter, sdgToCategory, searchQuery]);

  const topEnv = useMemo(() => {
    if (!leaderboardData || !leaderboardData.users) return [] as UserRanking[];
    return [...leaderboardData.users].sort((a,b) => b.volunteerHours - a.volunteerHours).slice(0,3);
  }, [leaderboardData]);

  const topSoc = useMemo(() => {
    if (!leaderboardData || !leaderboardData.users) return [] as UserRanking[];
    return [...leaderboardData.users].sort((a,b) => b.eventsJoined - a.eventsJoined).slice(0,3);
  }, [leaderboardData]);

  const topGov = useMemo(() => {
    if (!leaderboardData || !leaderboardData.users) return [] as UserRanking[];
    return [...leaderboardData.users].sort((a,b) => b.badgesEarned - a.badgesEarned).slice(0,3);
  }, [leaderboardData]);

  const mostHours = useMemo(() => {
    if (!leaderboardData || !leaderboardData.users) return null as UserRanking | null;
    return [...leaderboardData.users].sort((a,b) => b.volunteerHours - a.volunteerHours)[0] || null;
  }, [leaderboardData]);
  const mostEvents = useMemo(() => {
    if (!leaderboardData || !leaderboardData.users) return null as UserRanking | null;
    return [...leaderboardData.users].sort((a,b) => b.eventsJoined - a.eventsJoined)[0] || null;
  }, [leaderboardData]);
  const mostBadges = useMemo(() => {
    if (!leaderboardData || !leaderboardData.users) return null as UserRanking | null;
    return [...leaderboardData.users].sort((a,b) => b.badgesEarned - a.badgesEarned)[0] || null;
  }, [leaderboardData]);
  const biggestClimber = useMemo(() => {
    if (!leaderboardData || !leaderboardData.users) return null as UserRanking | null;
    return [...leaderboardData.users]
      .filter(u => typeof u.trend === 'number')
      .sort((a,b) => (b.trend || 0) - (a.trend || 0))[0] || null;
  }, [leaderboardData]);

  const progressInfo = useMemo(() => {
    const current = leaderboardData?.currentUser;
    if (!current || !leaderboardData?.users) return null as null | {
      currentRank: number;
      impactScore: number;
      nextRank?: number;
      nextScore?: number;
      progressPct?: number;
      delta?: number;
    };
    const sortedByScore = [...(leaderboardData.users || [])].sort((a,b) => (b.impactScore || 0) - (a.impactScore || 0));
    const idx = sortedByScore.findIndex(u => u.id === current.id);
    const target = idx > 0 ? sortedByScore[idx-1] : undefined;
    const delta = target ? Math.max(0, (target.impactScore || 0) - (current.impactScore || 0)) : 0;
    const progressPct = target ? Math.min(100, ((current.impactScore || 0) / Math.max(1, (target.impactScore || 0))) * 100) : 100;
    return { currentRank: current.rank, impactScore: current.impactScore || 0, nextRank: target?.rank, nextScore: target?.impactScore || 0, progressPct, delta };
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
      case 'GLOBAL_CITIZEN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'AMBASSADOR': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'LEADER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MENTOR': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
      case 'CHANGEMAKER': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
      case 'ADVOCATE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'BUILDER': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CONTRIBUTOR': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'SUPPORTER': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
      case 'HELPER': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[22px] pb-8">

        {/* Leaderboard Type Tabs */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setLeaderboardType('individuals')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              leaderboardType === 'individuals'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Individual Leaderboard
          </button>
          <button
            onClick={() => setLeaderboardType('organizations')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              leaderboardType === 'organizations'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Organization Leaderboard
          </button>
        </div>

        {/* Compact Professional Header */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left: Page Info */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                    {leaderboardType === 'individuals' ? (
                      <Trophy className="h-8 w-8 text-white" />
                    ) : (
                      <Building2 className="h-8 w-8 text-white" />
                    )}
                  </div>
                </div>
            <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leaderboardType === 'individuals' ? 'Individual Leaderboard' : 'Organization Leaderboard'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {leaderboardType === 'individuals' 
                      ? 'See how you rank against other volunteers'
                      : 'Compare organizations by their social impact'
                    }
                  </p>
                </div>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leaderboardData.totalUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {leaderboardType === 'individuals' ? 'Volunteers' : 'Organizations'}
                  </div>
            </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current User Card - Only for individuals */}
        {leaderboardType === 'individuals' && leaderboardData.currentUser && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    {leaderboardData.currentUser.image && (
                      <AvatarImage
                        src={leaderboardData.currentUser.image}
                        alt={leaderboardData.currentUser.name}
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-2xl">
                      {leaderboardData.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{leaderboardData.currentUser.name}</h2>
                    {leaderboardData.currentUser.location && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {leaderboardData.currentUser.location.city && `${leaderboardData.currentUser.location.city}, `}
                        {leaderboardData.currentUser.location.country}
                      </div>
                    )}
                    {(leaderboardData.currentUser.tier || leaderboardData.currentUser.specialty) && (
                      <div className="flex items-center space-x-2 mt-1">
                        {leaderboardData.currentUser.tier && (
                          <Badge className={getTierColor(leaderboardData.currentUser.tier)}>
                            {leaderboardData.currentUser.tier}
                          </Badge>
                        )}
                        {leaderboardData.currentUser.specialty && (
                          <Badge variant="outline">
                            {leaderboardData.currentUser.specialty}
                          </Badge>
                        )}
                      </div>
                    )}
        </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end mb-2">
                    {getRankBadge(leaderboardData.currentUser.rank)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Rank</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {(leaderboardData.currentUser.impactScore || 0).toLocaleString()} pts
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
              <div className="md:w-64">
                <Select value={sdgFilter} onValueChange={setSdgFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="SDG" />
                  </SelectTrigger>
                  <SelectContent 
                    className="max-h-80 overflow-y-auto" 
                    position="popper" 
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    avoidCollisions={false}
                  >
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
              <div className="md:w-48">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">This Month</SelectItem>
                    <SelectItem value="yearly">This Year</SelectItem>
                    <SelectItem value="all_time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-64 country-dropdown-container relative">
                <Button
                  variant="outline"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="h-10 w-full justify-between"
                >
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    {countryFilter === 'all' ? 'All Countries' : 
                      countries.find(c => c.name === countryFilter)?.name || 'All Countries'
                    }
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                </Button>
                
                {showCountryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={countrySearchQuery}
                          onChange={(e) => setCountrySearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    
                    {/* Country List */}
                    <div className="overflow-y-auto max-h-60">
                      <button
                        onClick={() => {
                          setCountryFilter('all');
                          setShowCountryDropdown(false);
                          setCountrySearchQuery('');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                      >
                        <span className="mr-2">🌍</span>
                        All Countries
                      </button>
                      {countries
                        .filter(country => 
                          country.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
                        )
                        .map(country => (
                          <button
                            key={country.code}
                            onClick={() => {
                              setCountryFilter(country.name);
                              setShowCountryDropdown(false);
                              setCountrySearchQuery('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                          >
                            <span className="mr-2">{country.flag}</span>
                            {country.name}
                          </button>
                        ))}
                      {countries.filter(country => 
                        country.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
                      ).length === 0 && countrySearchQuery && (
                        <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                          No countries found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Full Rankings */}
        <Card>
          <CardHeader>
            <CardTitle>Full Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboardType === 'individuals' ? 
                // Individual Rankings
                (sortedBySdg as UserRanking[]).map((user) => {
                const isCurrentUser = leaderboardData.currentUser?.id === user.id;
                
                // Get rank-specific styling
                const getRankStyling = () => {
                  if (isCurrentUser) {
                    return 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-2 border-blue-600 dark:border-blue-400 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800 dark:hover:to-purple-800';
                  }
                  if (user.rank === 1) {
                    return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-400 dark:border-yellow-600 hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-900/30 dark:hover:to-yellow-800/30';
                  }
                  if (user.rank === 2) {
                    return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-2 border-gray-400 dark:border-gray-600 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800/70 dark:hover:to-gray-700/70';
                  }
                  if (user.rank === 3) {
                    return 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-400 dark:border-orange-600 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30';
                  }
                  return 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700';
                };
                
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${getRankStyling()}`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {getRankBadge(user.rank)}
                      <Avatar className="h-12 w-12">
                        {user.image && (
                          <AvatarImage src={user.image} alt={user.name} />
                        )}
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className={`font-bold ${isCurrentUser ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                            {user.name}
                          </p>
                          {isCurrentUser && (
                            <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">You</Badge>
                          )}
                        </div>
                        {user.location && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <MapPin className="w-3 h-3 mr-1" />
                            {user.location.city && `${user.location.city}, `}
                            {user.location.country}
                          </div>
                        )}
                        {(user.tier || user.specialty) && (
                          <div className="flex items-center space-x-2 mt-1">
                            {user.tier && (
                              <Badge className={getTierColor(user.tier)} variant="outline">
                                {user.tier}
                              </Badge>
                            )}
                            {user.specialty && (
                              <Badge variant="outline">
                                {user.specialty}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
            
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{user.volunteerHours.toLocaleString()}</p>
                          <p className="text-muted-foreground text-xs">Hours</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{user.eventsJoined}</p>
                          <p className="text-muted-foreground text-xs">Events</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{user.badgesEarned}</p>
                          <p className="text-muted-foreground text-xs">Badges</p>
                        </div>
                      </div>
                      
                      <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {(user.impactScore || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Impact Score</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(user.trend)}
                          {user.trend !== undefined && user.trend !== 0 && (
                            <span className={`text-sm font-medium ${
                              user.trend && user.trend > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Math.abs(user.trend || 0)}
                            </span>
                          )}
                      </div>
                      </div>
                    </div>
                  </div>
                );
              }) : 
                // Organization Rankings
                (sortedBySdg as OrganizationRanking[]).map((org) => {
                  // Get rank-specific styling for organizations
                  const getRankStyling = () => {
                    if (org.rank === 1) {
                      return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-400 dark:border-yellow-600 hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-900/30 dark:hover:to-yellow-800/30';
                    }
                    if (org.rank === 2) {
                      return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-2 border-gray-400 dark:border-gray-600 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800/70 dark:hover:to-gray-700/70';
                    }
                    if (org.rank === 3) {
                      return 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-400 dark:border-orange-600 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30';
                    }
                    return 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700';
                  };
                  
                  return (
                  <div
                    key={org.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${getRankStyling()}`}
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
                          <p className="font-bold text-gray-900 dark:text-white">{org.name}</p>
                        </div>
                        {org.type && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {org.type}
                          </div>
                        )}
                        {org.tier && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {org.tier}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
            
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-4 text-sm">
                        {org.stats?.members !== undefined && (
                          <div className="text-center">
                            <p className="font-semibold">{org.stats.members.toLocaleString()}</p>
                            <p className="text-muted-foreground text-xs">Members</p>
                          </div>
                        )}
                        {org.stats?.events !== undefined && (
                          <div className="text-center">
                            <p className="font-semibold">{org.stats.events}</p>
                            <p className="text-muted-foreground text-xs">Events</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(org.esgScore || org.impactScore || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ESG Score</p>
                      </div>
                    </div>
                  </div>
                  );
                })
              }
              
              {((leaderboardType === 'individuals' && (!leaderboardData.users || leaderboardData.users.length === 0)) || 
                (leaderboardType === 'organizations' && (!leaderboardData.rankings || leaderboardData.rankings.length === 0))) && (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {leaderboardType === 'individuals' ? 'No users found' : 'No organizations found'}
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              )}
                      </div>
                    </CardContent>
                  </Card>

        {/* Category Leaders by SDG (Proxy categories) - Only for individuals */}
        {leaderboardType === 'individuals' && (
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
                {topEnv.map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                      <div className="text-sm w-4 text-gray-500 dark:text-gray-400 font-semibold">{i+1}</div>
                      <Avatar className="h-8 w-8">
                        {u.image && <AvatarImage src={u.image} alt={u.name} />}
                        <AvatarFallback className="text-xs">{u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{u.volunteerHours.toLocaleString()} hrs</div>
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
                {topSoc.map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm w-4 text-gray-500 dark:text-gray-400 font-semibold">{i+1}</div>
                          <Avatar className="h-8 w-8">
                        {u.image && <AvatarImage src={u.image} alt={u.name} />}
                        <AvatarFallback className="text-xs">{u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</AvatarFallback>
                            </Avatar>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{u.eventsJoined} events</div>
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
                  <span>Achievement Leaders</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topGov.map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm w-4 text-gray-500 dark:text-gray-400 font-semibold">{i+1}</div>
                      <Avatar className="h-8 w-8">
                        {u.image && <AvatarImage src={u.image} alt={u.name} />}
                        <AvatarFallback className="text-xs">{u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</span>
                        </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{u.badgesEarned} badges</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                            </div>
                          </div>
        )}

        {/* Special Achievements - Only for individuals */}
        {leaderboardType === 'individuals' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Special Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-sm transition">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                            </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Most Events Joined</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{mostEvents ? mostEvents.name : '—'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{mostEvents ? `${mostEvents.eventsJoined} events` : ''}</div>
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
                  <Award className="w-6 h-6 text-white" />
                          </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Most Badges Earned</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{mostBadges ? mostBadges.name : '—'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{mostBadges ? `${mostBadges.badgesEarned} badges` : ''}</div>
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
        )}

        {/* Your Progress - Only for individuals */}
        {leaderboardType === 'individuals' && leaderboardData.currentUser && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span>Your Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rankings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-0">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      #{leaderboardData.currentUser.rank}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Global Rank</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      out of {leaderboardData.totalUsers.toLocaleString()} volunteers
                    </div>
                  </CardContent>
                </Card>

                {leaderboardData.currentUser.location?.country && (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-0">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        #{leaderboardData.currentUser.rank}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {leaderboardData.currentUser.location.country} Rank
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        in your country
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-0">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center mx-auto mb-3">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {(leaderboardData.currentUser.impactScore || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Impact Score</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      total points earned
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress to Next Rank */}
              {progressInfo && progressInfo.nextScore !== undefined && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-6 border border-blue-100 dark:border-blue-900">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Next Rank: #{progressInfo.nextRank}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Keep going to climb higher!</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {progressInfo.delta?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">points to go</div>
                    </div>
                  </div>
                  <Progress value={progressInfo.progressPct || 0} className="h-3" />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                    <span>{(progressInfo.impactScore || 0).toLocaleString()} pts</span>
                    <span>{(progressInfo.nextScore || 0).toLocaleString()} pts</span>
                  </div>
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
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">Join more events, volunteer more hours, and earn badges to boost your impact score.</p>
              <Link href="/events">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Find Events to Join
                </Button>
              </Link>
            </CardContent>
          </Card>
            </div>
      </div>
    </div>
  );
}

export default function LeaderboardsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeaderboardsPageContent />
    </Suspense>
  );
}