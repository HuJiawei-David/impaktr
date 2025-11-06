'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Users,
  Building2
} from 'lucide-react';

interface OrganizationBadgeData {
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
  allTiers: Array<{
    tier: string;
    name: string;
    description: string;
    icon: string;
    minEmployeeParticipation: number;
    minAverageScore: number;
    minEvents: number;
    minSDGDiversity: number;
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
      type: string;
    }>;
    closeToEarning: Array<{
      sdgNumber: number;
      sdgName: string;
      tierName: string;
      progress: number;
    }>;
  };
}

export default function OrganizationAchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [badgeData, setBadgeData] = useState<OrganizationBadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchOrganizationId = async () => {
    try {
      const response = await fetch('/api/organizations/dashboard');
      if (response.ok) {
        const data = await response.json();
        setOrganizationId(data.organization.id);
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
    }
  };

  const fetchBadgeData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/badges?type=organization&organizationId=${organizationId}`);
      
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
  }, [organizationId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated') {
      fetchOrganizationId();
    }
  }, [status, router]);

  useEffect(() => {
    if (organizationId) {
      fetchBadgeData();
    }
  }, [organizationId, fetchBadgeData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !badgeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-red-500">{error || 'Failed to load badges'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Organization Achievements</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your organization&apos;s progress and earn badges as you make impact
          </p>
        </div>

        {/* Current Tier Card */}
        <Card className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mr-6">
                  <Building2 className="h-12 w-12" />
                </div>
                <div>
                  <div className="text-sm opacity-90 mb-1">Current Tier</div>
                  <h2 className="text-3xl font-bold mb-2">{badgeData.currentTier.name}</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {badgeData.currentProgress.participationRate.toFixed(1)}% participation
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      {badgeData.currentProgress.averageScore.toFixed(0)} avg score
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-1" />
                      {badgeData.currentProgress.totalEvents} events
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      {badgeData.currentProgress.sdgDiversity} SDGs
                    </div>
                  </div>
                </div>
              </div>
              {badgeData.nextTier && (
                <div className="text-right">
                  <div className="text-sm opacity-90 mb-1">Next Tier</div>
                  <div className="text-xl font-bold">{badgeData.nextTier.name}</div>
                </div>
              )}
            </div>

            {badgeData.nextTier && (
              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Employee Participation</span>
                    <span>{badgeData.currentProgress.participationRate.toFixed(1)}% / {badgeData.nextTier.requirements.minEmployeeParticipation}%</span>
                  </div>
                  <Progress value={badgeData.nextTier.progress.participation} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Impact Score</span>
                    <span>{badgeData.currentProgress.averageScore.toFixed(0)} / {badgeData.nextTier.requirements.minAverageScore}</span>
                  </div>
                  <Progress value={badgeData.nextTier.progress.averageScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Events Organized</span>
                    <span>{badgeData.currentProgress.totalEvents} / {badgeData.nextTier.requirements.minEvents}</span>
                  </div>
                  <Progress value={badgeData.nextTier.progress.events} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>SDG Diversity</span>
                    <span>{badgeData.currentProgress.sdgDiversity} / {badgeData.nextTier.requirements.minSDGDiversity}</span>
                  </div>
                  <Progress value={badgeData.nextTier.progress.sdgDiversity} className="h-2" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Recently Earned */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Recently Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badgeData.stats.recentlyEarned.length > 0 ? (
                <div className="space-y-3">
                  {badgeData.stats.recentlyEarned.map((badge, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center mr-3">
                          <Trophy className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{badge.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(badge.earnedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No badges earned yet. Start your impact journey!</p>
              )}
            </CardContent>
          </Card>

          {/* Close to Earning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Close to Earning
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badgeData.stats.closeToEarning.length > 0 ? (
                <div className="space-y-3">
                  {badgeData.stats.closeToEarning.map((badge, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">{badge.tierName}</div>
                          <div className="text-xs text-gray-500">SDG {badge.sdgNumber}: {badge.sdgName}</div>
                        </div>
                        <Badge variant="secondary">{Math.round(badge.progress)}%</Badge>
                      </div>
                      <Progress value={badge.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Keep making impact to unlock more badges!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Journey Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-6 w-6 mr-2" />
              Your Organization&apos;s Impact Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
              {badgeData.allTiers.map((tier, index) => (
                <div 
                  key={tier.tier}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    tier.current 
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                      : tier.earned
                      ? 'border-gray-300 dark:border-gray-700'
                      : 'border-gray-200 dark:border-gray-800 opacity-50'
                  }`}
                >
                  {tier.current && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-purple-600 text-white">Current</Badge>
                    </div>
                  )}
                  <div 
                    className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      tier.earned 
                        ? `bg-gradient-to-r ${tier.color}` 
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <Trophy className={`h-8 w-8 ${tier.earned ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${tier.earned ? '' : 'text-gray-500'}`}>
                      {tier.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tier.minEvents} events
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SDG Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-6 w-6 mr-2" />
              SDG-Specific Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {badgeData.sdgBadges.map((sdg) => (
                <div key={sdg.sdgNumber} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${sdg.color} flex items-center justify-center mr-3 text-white font-bold`}>
                        {sdg.sdgNumber}
                      </div>
                      <div>
                        <div className="font-bold">SDG {sdg.sdgNumber}: {sdg.sdgName}</div>
                        <div className="text-sm text-gray-500">
                          {sdg.tiers.filter(t => t.earned).length} / {sdg.tiers.length} badges earned
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white">
                      {sdg.tiers.reduce((sum, t) => sum + t.progress.hours, 0)} hrs
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sdg.tiers.map((tier) => (
                      <div 
                        key={tier.tier}
                        className={`border-2 rounded-lg p-4 ${
                          tier.earned 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                          tier.earned 
                            ? `bg-gradient-to-r ${sdg.color}` 
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}>
                          {tier.earned ? (
                            <CheckCircle className="h-8 w-8 text-white" />
                          ) : (
                            <Trophy className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                        <h4 className="text-center font-bold mb-2">
                          {tier.name}
                        </h4>
                        {tier.earned ? (
                          <div className="text-center">
                            <Badge className="bg-green-600 text-white">Earned</Badge>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2 text-xs mb-3">
                              <div className="flex justify-between">
                                <span>Hours:</span>
                                <span className="font-semibold">
                                  {tier.progress.hours} / {tier.requirements.minHours}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Activities:</span>
                                <span className="font-semibold">
                                  {tier.progress.activities} / {tier.requirements.minActivities}
                                </span>
                              </div>
                            </div>
                            <Progress value={tier.progress.percentage} className="h-2" />
                            <div className="text-center text-xs text-gray-500 mt-1">
                              {Math.round(tier.progress.percentage)}% complete
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
