'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Award, 
  Trophy, 
  TrendingUp,
  Clock,
  CheckCircle,
  Target,
  BookOpen,
  Star,
  Zap,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface BadgeData {
  currentRank: {
    rank: string;
    name: string;
    icon: string;
  };
  nextRank: {
    rank: string;
    name: string;
    requirements: {
      minScore: number;
      minHours: number;
      minBadges: number;
    };
    progress: {
      score: number;
      hours: number;
      badges: number;
    };
  } | null;
  currentProgress: {
    score: number;
    hours: number;
    badges: number;
  };
  allRanks: Array<{
    rank: string;
    name: string;
    description: string;
    icon: string;
    minScore: number;
    minHours: number;
    minBadges: number;
    color: string;
    earned: boolean;
    current: boolean;
  }>;
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
  stats: {
    recentlyEarned: Array<{
      name: string;
      earnedAt: Date;
      icon: string;
    }>;
    closeToEarning: Array<{
      sdgNumber: number;
      sdgName: string;
      tierName: string;
      progress: number;
    }>;
  };
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'SUPPORTER': return '🌱';
    case 'BUILDER': return '🔨';
    case 'CHAMPION': return '🏆';
    case 'GUARDIAN': return '🛡️';
    default: return '⭐';
  }
};

export default function ProfileBadgesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'earned' | 'in-progress'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && session?.user?.id) {
      fetchBadgeData();
    }
  }, [status, session, router]);

  const fetchBadgeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/badges?type=individual&userId=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch badge data');
      }

      const data = await response.json();
      setBadgeData(data);
    } catch (err) {
      console.error('Error fetching badges:', err);
      setError('Failed to load badge data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !badgeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-red-500">{error || 'Failed to load badges'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter SDG badges based on selection
  const filteredSDGBadges = badgeData.sdgBadges.map(sdg => ({
    ...sdg,
    tiers: sdg.tiers.filter(tier => {
      if (selectedFilter === 'earned') return tier.earned;
      if (selectedFilter === 'in-progress') return !tier.earned && tier.progress.percentage > 0;
      return true;
    })
  })).filter(sdg => sdg.tiers.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-10 h-10" />
                <h1 className="text-4xl md:text-5xl font-bold">My Badges</h1>
              </div>
              <p className="text-xl text-blue-100">
                Track your progress and celebrate your impact achievements
              </p>
            </div>
            <Link href="/methodology">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">How It Works</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Current Rank Card */}
        <Card className="mb-8 overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-12 w-12" />
                </div>
                <div>
                  <div className="text-sm opacity-90 mb-1">Current Rank</div>
                  <h2 className="text-4xl font-bold mb-3">{badgeData.currentRank.name}</h2>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                      <Target className="h-4 w-4" />
                      <span className="font-semibold">{badgeData.currentProgress.score}</span> points
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">{badgeData.currentProgress.hours}</span> hours
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                      <Award className="h-4 w-4" />
                      <span className="font-semibold">{badgeData.currentProgress.badges}</span> badges
                    </div>
                  </div>
                </div>
              </div>
              {badgeData.nextRank && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-90 mb-1">Next Rank</div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    {badgeData.nextRank.name}
                  </div>
                </div>
              )}
            </div>

            {badgeData.nextRank && (
              <div className="mt-8 grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Impact Score</span>
                    <span className="font-semibold">{badgeData.currentProgress.score} / {badgeData.nextRank.requirements.minScore}</span>
                  </div>
                  <Progress value={badgeData.nextRank.progress.score} className="h-2 bg-white/20" />
                  <div className="text-xs mt-2 opacity-90">{Math.round(badgeData.nextRank.progress.score)}% complete</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Volunteer Hours</span>
                    <span className="font-semibold">{badgeData.currentProgress.hours} / {badgeData.nextRank.requirements.minHours}</span>
                  </div>
                  <Progress value={badgeData.nextRank.progress.hours} className="h-2 bg-white/20" />
                  <div className="text-xs mt-2 opacity-90">{Math.round(badgeData.nextRank.progress.hours)}% complete</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>SDG Badges</span>
                    <span className="font-semibold">{badgeData.currentProgress.badges} / {badgeData.nextRank.requirements.minBadges}</span>
                  </div>
                  <Progress value={badgeData.nextRank.progress.badges} className="h-2 bg-white/20" />
                  <div className="text-xs mt-2 opacity-90">{Math.round(badgeData.nextRank.progress.badges)}% complete</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Recently Earned */}
          <Card className="border-l-4 border-green-500 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recently Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badgeData.stats.recentlyEarned.length > 0 ? (
                <div className="space-y-3">
                  {badgeData.stats.recentlyEarned.map((badge, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{badge.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <Zap className="w-5 h-5 text-green-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No badges earned yet</p>
                  <p className="text-sm mt-1">Start your impact journey!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Close to Earning */}
          <Card className="border-l-4 border-blue-500 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Close to Earning
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badgeData.stats.closeToEarning.length > 0 ? (
                <div className="space-y-3">
                  {badgeData.stats.closeToEarning.map((badge, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold">{badge.tierName}</div>
                          <div className="text-xs text-muted-foreground">SDG {badge.sdgNumber}: {badge.sdgName}</div>
                        </div>
                        <Badge className="bg-blue-600 text-white">{Math.round(badge.progress)}%</Badge>
                      </div>
                      <Progress value={badge.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No badges in progress</p>
                  <p className="text-sm mt-1">Join events to start earning!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Journey Progress */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-purple-600" />
              Your Impact Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
              {badgeData.allRanks.map((rank) => (
                <div 
                  key={rank.rank}
                  className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    rank.current 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 shadow-lg' 
                      : rank.earned
                      ? 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-800 opacity-50 bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  {rank.current && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-2 py-0.5">
                        Current
                      </Badge>
                    </div>
                  )}
                  <div 
                    className={`w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      rank.earned 
                        ? `bg-gradient-to-r ${rank.color}` 
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    {rank.earned ? (
                      <Trophy className="h-7 w-7 text-white" />
                    ) : (
                      <Award className="h-7 w-7 text-gray-500" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-semibold ${rank.earned ? '' : 'text-gray-500'}`}>
                      {rank.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {rank.minScore}+
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedFilter === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            }`}
          >
            All Badges
          </button>
          <button
            onClick={() => setSelectedFilter('earned')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedFilter === 'earned'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Earned
          </button>
          <button
            onClick={() => setSelectedFilter('in-progress')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedFilter === 'in-progress'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            }`}
          >
            In Progress
          </button>
        </div>

        {/* SDG Badges */}
        <div className="space-y-6">
          {filteredSDGBadges.map((sdg) => {
            // Map SDG colors to solid backgrounds
            const solidColorMap: Record<string, string> = {
              'from-red-600 to-red-700': 'bg-red-600',
              'from-yellow-600 to-yellow-700': 'bg-yellow-600',
              'from-green-600 to-green-700': 'bg-green-600',
              'from-red-700 to-red-800': 'bg-red-700',
              'from-orange-600 to-orange-700': 'bg-orange-600',
              'from-blue-600 to-blue-700': 'bg-blue-600',
              'from-yellow-500 to-yellow-600': 'bg-yellow-500',
              'from-red-800 to-red-900': 'bg-red-800',
              'from-orange-700 to-orange-800': 'bg-orange-700',
              'from-pink-600 to-pink-700': 'bg-pink-600',
              'from-yellow-700 to-yellow-800': 'bg-yellow-700',
              'from-yellow-600 to-amber-700': 'bg-amber-600',
              'from-green-700 to-green-800': 'bg-green-700',
              'from-blue-700 to-blue-800': 'bg-blue-700',
              'from-indigo-700 to-indigo-800': 'bg-indigo-700',
              'from-blue-800 to-blue-900': 'bg-blue-800',
            };
            const solidBg = solidColorMap[sdg.color] || 'bg-blue-600';
            
            return (
              <Card key={sdg.sdgNumber} className="shadow-lg overflow-hidden">
                <div className={`p-6 ${solidBg}`}>
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="text-xs font-bold">SDG</div>
                        <div className="text-xl font-bold">{sdg.sdgNumber}</div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold drop-shadow-sm">{sdg.sdgName}</h3>
                        <div className="text-sm mt-1">
                          {sdg.tiers.filter(t => t.earned).length} / {sdg.tiers.length} badges earned
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <div className="text-2xl font-bold">
                        {sdg.tiers.reduce((sum, t) => sum + t.progress.hours, 0)}
                      </div>
                      <div className="text-xs">total hours</div>
                    </div>
                  </div>
                </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sdg.tiers.map((tier) => (
                    <Card 
                      key={tier.tier}
                      className={`overflow-hidden transition-all hover:scale-105 ${
                        tier.earned 
                          ? 'border-2 border-green-500 shadow-lg' 
                          : 'border-2 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className={`p-4 ${tier.earned ? `bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30` : 'bg-white dark:bg-gray-800'}`}>
                        <div className="flex justify-center mb-3">
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${
                            tier.earned 
                              ? `bg-gradient-to-r ${sdg.color}` 
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {tier.earned ? (
                              <div className="text-white">
                                {getTierIcon(tier.tier)}
                              </div>
                            ) : (
                              <span className="opacity-50">{getTierIcon(tier.tier)}</span>
                            )}
                          </div>
                        </div>
                        
                        <h4 className="text-center font-bold text-lg mb-1">
                          {tier.name}
                        </h4>
                        <div className="text-center text-xs text-muted-foreground mb-3">
                          {tier.tier}
                        </div>

                        {tier.earned ? (
                          <div className="text-center">
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Earned
                            </Badge>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Hours:</span>
                                <span className="font-semibold">
                                  {tier.progress.hours} / {tier.requirements.minHours}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Activities:</span>
                                <span className="font-semibold">
                                  {tier.progress.activities} / {tier.requirements.minActivities}
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                                <span>Progress</span>
                                <span className="font-semibold">{Math.round(tier.progress.percentage)}%</span>
                              </div>
                              <Progress value={tier.progress.percentage} className="h-2" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {filteredSDGBadges.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No badges found</h3>
              <p className="text-muted-foreground">
                {selectedFilter === 'earned' && 'You haven\'t earned any badges yet. Keep volunteering!'}
                {selectedFilter === 'in-progress' && 'No badges in progress. Join events to start earning badges!'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* CTA Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">Find Opportunities</h3>
              </div>
              <p className="text-blue-100 mb-6">
                Discover volunteer opportunities that match your interests and help you earn badges across all 17 SDGs. 
                Make meaningful impact while building your badge collection!
              </p>
              <Link href="/opportunities">
                <button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
                  <span>Browse Opportunities</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white border-0 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">Join Events</h3>
              </div>
              <p className="text-purple-100 mb-6">
                Participate in upcoming volunteering events and verified activities. 
                Each completed event brings you closer to unlocking new badges and advancing your rank!
              </p>
              <Link href="/events">
                <button className="bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
                  <span>Explore Events</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-l-4 border-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                  Showcase Your Impact
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Your badges demonstrate your commitment to specific UN Sustainable Development Goals and can be shared on your profile, 
                  LinkedIn, or included in resumes. Organizations value volunteers with proven, verified impact across multiple SDG areas.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/profile">
                    <button className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                      View Public Profile
                    </button>
                  </Link>
                  <Link href="/methodology">
                    <button className="text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors">
                      Learn How Badges Work
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
