'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sdgs } from '@/constants/sdgs';

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
}

interface LeaderboardData {
  users: UserRanking[];
  currentUser?: UserRanking;
  totalUsers: number;
}

export default function LeaderboardsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [sdgFilter, setSdgFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState('monthly');
  
  const fetchLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: periodFilter,
      });
      if (sdgFilter !== 'all') params.set('sdg', sdgFilter);

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
  }, [periodFilter, sdgFilter, router]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchLeaderboardData();
    }
  }, [isLoading, user, router, periodFilter, sdgFilter, fetchLeaderboardData]);

  // Derived helpers for SDG category mapping and leaderboard summaries
  const sdgToCategory = useCallback((sdgId: number): 'ENV' | 'SOC' | 'GOV' => {
    if ([6,7,12,13,14,15].includes(sdgId)) return 'ENV';
    if ([1,2,3,4,5,10,11].includes(sdgId)) return 'SOC';
    return 'GOV';
  }, []);

  const sortedBySdg = useMemo(() => {
    if (!leaderboardData) return [] as UserRanking[];
    if (sdgFilter === 'all') return leaderboardData.users;
    const sdgId = Number(sdgFilter);
    const category = sdgToCategory(sdgId);
    const arr = [...leaderboardData.users];
    if (category === 'ENV') {
      return arr.sort((a, b) => b.volunteerHours - a.volunteerHours);
    }
    if (category === 'SOC') {
      return arr.sort((a, b) => b.eventsJoined - a.eventsJoined);
    }
    return arr.sort((a, b) => b.badgesEarned - a.badgesEarned);
  }, [leaderboardData, sdgFilter, sdgToCategory]);

  const topEnv = useMemo(() => {
    if (!leaderboardData) return [] as UserRanking[];
    return [...leaderboardData.users].sort((a,b) => b.volunteerHours - a.volunteerHours).slice(0,3);
  }, [leaderboardData]);

  const topSoc = useMemo(() => {
    if (!leaderboardData) return [] as UserRanking[];
    return [...leaderboardData.users].sort((a,b) => b.eventsJoined - a.eventsJoined).slice(0,3);
  }, [leaderboardData]);

  const topGov = useMemo(() => {
    if (!leaderboardData) return [] as UserRanking[];
    return [...leaderboardData.users].sort((a,b) => b.badgesEarned - a.badgesEarned).slice(0,3);
  }, [leaderboardData]);

  const mostHours = useMemo(() => {
    if (!leaderboardData) return null as UserRanking | null;
    return [...leaderboardData.users].sort((a,b) => b.volunteerHours - a.volunteerHours)[0] || null;
  }, [leaderboardData]);
  const mostEvents = useMemo(() => {
    if (!leaderboardData) return null as UserRanking | null;
    return [...leaderboardData.users].sort((a,b) => b.eventsJoined - a.eventsJoined)[0] || null;
  }, [leaderboardData]);
  const mostBadges = useMemo(() => {
    if (!leaderboardData) return null as UserRanking | null;
    return [...leaderboardData.users].sort((a,b) => b.badgesEarned - a.badgesEarned)[0] || null;
  }, [leaderboardData]);
  const biggestClimber = useMemo(() => {
    if (!leaderboardData) return null as UserRanking | null;
    return [...leaderboardData.users]
      .filter(u => typeof u.trend === 'number')
      .sort((a,b) => (b.trend || 0) - (a.trend || 0))[0] || null;
  }, [leaderboardData]);

  const progressInfo = useMemo(() => {
    const current = leaderboardData?.currentUser;
    if (!current) return null as null | {
      currentRank: number;
      impactScore: number;
      nextRank?: number;
      nextScore?: number;
      progressPct?: number;
      delta?: number;
    };
    const sortedByScore = [...(leaderboardData?.users || [])].sort((a,b) => (b.impactScore || 0) - (a.impactScore || 0));
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
      case 'PLATINUM': return 'bg-purple-100 text-purple-800';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      case 'SILVER': return 'bg-gray-100 text-gray-800';
      case 'BRONZE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
                    Individual Leaderboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    See how you rank against other volunteers
                  </p>
                </div>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leaderboardData.totalUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Volunteers</div>
            </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current User Card */}
        {leaderboardData.currentUser && (
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
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getTierColor(leaderboardData.currentUser.tier)}>
                        {leaderboardData.currentUser.tier}
                      </Badge>
                      {leaderboardData.currentUser.specialty && (
                        <Badge variant="outline">
                          {leaderboardData.currentUser.specialty}
                        </Badge>
                      )}
          </div>
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
                  <SelectContent>
                    <SelectItem value="all">All SDGs</SelectItem>
                    {sdgs.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.id}. {s.shortTitle}
                      </SelectItem>
                    ))}
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
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Podium */}
        {leaderboardData.users.length >= 3 && (
          <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardContent className="p-8">
              <div className="flex items-end justify-center space-x-8">
                {/* Second Place */}
                {leaderboardData.users[1] && (
                  <div className="flex flex-col items-center space-y-3" style={{ paddingBottom: '40px' }}>
                    <Avatar className="h-20 w-20 border-4 border-gray-400">
                      {leaderboardData.users[1].image && (
                        <AvatarImage src={leaderboardData.users[1].image} alt={leaderboardData.users[1].name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-600 text-white font-bold text-2xl">
                        {leaderboardData.users[1].name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-32 h-32 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex flex-col items-center justify-center shadow-lg">
                      <Medal className="h-12 w-12 text-white mb-2" />
                      <span className="text-white font-bold text-2xl">2nd</span>
              </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white">{leaderboardData.users[1].name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{(leaderboardData.users[1].impactScore || 0).toLocaleString()} pts</p>
                </div>
              </div>
                )}

                {/* First Place */}
                {leaderboardData.users[0] && (
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-24 w-24 border-4 border-yellow-400">
                      {leaderboardData.users[0].image && (
                        <AvatarImage src={leaderboardData.users[0].image} alt={leaderboardData.users[0].name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold text-3xl">
                        {leaderboardData.users[0].name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-32 h-40 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-lg flex flex-col items-center justify-center shadow-xl">
                      <Crown className="h-16 w-16 text-white mb-2" />
                      <span className="text-white font-bold text-3xl">1st</span>
            </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white">{leaderboardData.users[0].name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{(leaderboardData.users[0].impactScore || 0).toLocaleString()} pts</p>
          </div>
        </div>
                )}

                {/* Third Place */}
                {leaderboardData.users[2] && (
                  <div className="flex flex-col items-center space-y-3" style={{ paddingBottom: '80px' }}>
                    <Avatar className="h-20 w-20 border-4 border-orange-400">
                      {leaderboardData.users[2].image && (
                        <AvatarImage src={leaderboardData.users[2].image} alt={leaderboardData.users[2].name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold text-2xl">
                        {leaderboardData.users[2].name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="w-32 h-24 bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-lg flex flex-col items-center justify-center shadow-lg">
                      <Award className="h-10 w-10 text-white mb-2" />
                      <span className="text-white font-bold text-2xl">3rd</span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white">{leaderboardData.users[2].name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{(leaderboardData.users[2].impactScore || 0).toLocaleString()} pts</p>
                    </div>
            </div>
                )}
          </div>
            </CardContent>
          </Card>
        )}

        {/* Full Rankings */}
        <Card>
          <CardHeader>
            <CardTitle>Full Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedBySdg.map((user) => {
                const isCurrentUser = leaderboardData.currentUser?.id === user.id;
                
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      isCurrentUser
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-2 border-blue-600 dark:border-blue-400'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
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
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getTierColor(user.tier)} variant="outline">
                            {user.tier}
                          </Badge>
                          {user.specialty && (
                            <Badge variant="outline">
                              {user.specialty}
                            </Badge>
                          )}
                        </div>
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
              })}
              
              {leaderboardData.users.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No users found</h3>
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

        {/* Special Achievements */}
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

        {/* Your Progress */}
        {progressInfo && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
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
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{(progressInfo.impactScore || 0).toLocaleString()}</div>
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">{(progressInfo.impactScore || 0).toLocaleString()} / {(progressInfo.nextScore || 0).toLocaleString()} pts</span>
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