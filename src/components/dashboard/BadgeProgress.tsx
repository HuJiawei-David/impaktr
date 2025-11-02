// home/ubuntu/impaktrweb/src/components/dashboard/BadgeProgress.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Award, TrendingUp, Target, ChevronRight, Star, Trophy, CheckCircle, Clock, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getSDGColor, getSDGName } from '@/lib/utils';
import { getSDGById } from '@/constants/sdgs';
import { 
  INDIVIDUAL_RANK_BADGES, 
  SDG_BADGE_CONFIGS,
  getIndividualSDGBadgeName,
  getSDGBadgeRequirements,
  getSDGBadgeImage,
  getRankBadgeImage
} from '@/lib/badge-config';
// BadgeTier type from badge-config
type BadgeTier = 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN';
type IndividualRank = 'HELPER' | 'SUPPORTER' | 'CONTRIBUTOR' | 'BUILDER' | 'ADVOCATE' | 'CHANGEMAKER' | 'MENTOR' | 'LEADER' | 'AMBASSADOR' | 'GLOBAL_CITIZEN';

// Real badge system interfaces matching the API
interface RankProgress {
  currentRank: {
    rank: IndividualRank;
    name: string;
    icon: string;
  };
  nextRank: {
    rank: IndividualRank;
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
}

interface SDGBadgeProgress {
  sdgNumber: number;
  sdgName: string;
  icon: string;
  color: string;
  tiers: Array<{
    tier: BadgeTier;
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
}

interface BadgeProgressData {
  rankProgress: RankProgress;
  sdgBadges: SDGBadgeProgress[];
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

export function BadgeProgress() {
  const { data: session } = useSession();
  const [badgeData, setBadgeData] = useState<BadgeProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchBadgeProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchBadgeProgress = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/badges?type=individual&userId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch badge progress');
      }
      
      const data = await response.json();
      
      // Transform API response to match BadgeProgressData structure
      const badgeProgressData: BadgeProgressData = {
        rankProgress: {
          currentRank: {
            rank: data.currentRank.rank,
            name: data.currentRank.name,
            icon: data.currentRank.icon
          },
          nextRank: data.nextRank ? {
            rank: data.nextRank.rank,
            name: data.nextRank.name,
            requirements: data.nextRank.requirements,
            progress: data.nextRank.progress
          } : null,
          currentProgress: data.currentProgress
        },
        sdgBadges: data.sdgBadges.map((sdg: {
          sdgNumber: number;
          sdgName: string;
          icon: string;
          color: string;
          tiers: Array<{
            tier: BadgeTier;
            name: string;
            description: string;
            requirements: { minHours: number; minActivities: number };
            progress: { hours: number; activities: number; percentage: number };
            earned: boolean;
          }>;
        }) => ({
          sdgNumber: sdg.sdgNumber,
          sdgName: sdg.sdgName,
          icon: sdg.icon,
          color: sdg.color,
          tiers: sdg.tiers.map((tier) => ({
            tier: tier.tier,
            name: tier.name,
            description: tier.description,
            requirements: tier.requirements,
            progress: tier.progress,
            earned: tier.earned
          }))
        })),
        stats: data.stats
      };
      
      setBadgeData(badgeProgressData);
    } catch (error) {
      console.error('Error fetching badge progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierBadgeColor = (tier: BadgeTier) => {
    switch (tier) {
      case 'SUPPORTER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'BUILDER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CHAMPION':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'GUARDIAN':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTierIcon = (tier: BadgeTier) => {
    switch (tier) {
      case 'SUPPORTER': return '🌱';
      case 'BUILDER': return '🔨';
      case 'CHAMPION': return '🏆';
      case 'GUARDIAN': return '🛡️';
      default: return '⭐';
    }
  };

  const getRankIcon = (rank: IndividualRank) => {
    switch (rank) {
      case 'HELPER': return 'hand-helping';
      case 'SUPPORTER': return 'heart';
      case 'CONTRIBUTOR': return 'users';
      case 'BUILDER': return 'hammer';
      case 'ADVOCATE': return 'megaphone';
      case 'CHANGEMAKER': return 'sparkles';
      case 'MENTOR': return 'user-graduate';
      case 'LEADER': return 'crown';
      case 'AMBASSADOR': return 'globe';
      case 'GLOBAL_CITIZEN': return 'earth';
      default: return 'award';
    }
  };

  const tierInfo = {
    SUPPORTER: { 
      name: 'Supporter', 
      color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200',
      icon: '🌱'
    },
    BUILDER: { 
      name: 'Builder', 
      color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200',
      icon: '🏗️'
    },
    CHAMPION: { 
      name: 'Champion', 
      color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200',
      icon: '🏆'
    },
    GUARDIAN: { 
      name: 'Guardian', 
      color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200',
      icon: '🛡️'
    }
  };
  
  const getTierInfo = (tier: string) => {
    return tierInfo[tier as keyof typeof tierInfo] || tierInfo.SUPPORTER;
  };

  const renderSDGBadgeCard = (sdgBadge: SDGBadgeProgress) => {
    const sdgInfo = getSDGById(sdgBadge.sdgNumber);
    const earnedTiers = sdgBadge.tiers.filter(tier => tier.earned);
    const currentTier = earnedTiers.length > 0 ? earnedTiers[earnedTiers.length - 1] : null;
    const nextTier = sdgBadge.tiers.find(tier => !tier.earned);
    const totalHours = sdgBadge.tiers.length > 0 ? sdgBadge.tiers[0].progress.hours : 0;
    const totalActivities = sdgBadge.tiers.length > 0 ? sdgBadge.tiers[0].progress.activities : 0;
    
    return (
      <Card key={sdgBadge.sdgNumber} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
        currentTier ? 'ring-2 ring-primary/20 bg-primary/5' : 
        (totalHours > 0 || totalActivities > 0) ? 'ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800' : 
        'opacity-75 hover:opacity-100'
      }`}>
        {/* Status Indicator */}
        <div className="absolute top-2 right-2">
          {earnedTiers.length > 0 && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
          {!currentTier && totalHours === 0 && totalActivities === 0 && (
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-gray-600" />
            </div>
          )}
        </div>

        <CardContent className="p-6">
          {/* Header: SDG Badge Centered */}
          <div className="text-center mb-4">
            <div className="flex flex-col justify-center items-center gap-2 mb-4">
              <Badge 
                variant="outline" 
                className="px-3 py-1 text-sm inline-flex items-center gap-1.5 whitespace-nowrap"
                style={{ borderColor: sdgInfo?.color || '#000' }}
              >
                {sdgInfo && (
                  <Image 
                    src={sdgInfo.image || ''} 
                    alt={`SDG ${sdgBadge.sdgNumber}`}
                    width={16}
                    height={16}
                    className="w-4 h-4 flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <span className="font-semibold">SDG {sdgBadge.sdgNumber}</span>
              </Badge>
              <Badge 
                variant="outline" 
                className="px-3 py-1 text-sm"
                style={{ 
                  borderColor: sdgInfo?.color || '#000',
                  backgroundColor: sdgInfo?.color ? `${sdgInfo.color}20` : 'transparent'
                }}
              >
                <span className="text-gray-600 dark:text-gray-400">{sdgBadge.sdgName}</span>
              </Badge>
            </div>
            <div className="flex justify-center my-4">
              <div className="relative w-20 h-20">
                {currentTier ? (
                  <Image
                    src={getSDGBadgeImage(sdgBadge.sdgNumber, currentTier.tier as 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN')}
                    alt={`${currentTier.name} - SDG ${sdgBadge.sdgNumber}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-contain"
                  />
                ) : nextTier ? (
                  <Image 
                    src={getSDGBadgeImage(sdgBadge.sdgNumber, nextTier.tier as 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN')}
                    alt={`${nextTier.name} - SDG ${sdgBadge.sdgNumber}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-contain opacity-50"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                    <Award className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Badge Name and Tier */}
            <div className="mb-4 space-y-2">
              {(currentTier || nextTier) && (() => {
                const tier = (currentTier || nextTier)!;
                const tierData = getTierInfo(tier.tier);
                return (
                  <>
                    <div className="font-bold text-xl text-gray-900 dark:text-white">
                      {tier.name}
                    </div>
                    <div>
                      <Badge className={`text-xs ${tierData.color}`}>
                        {tier.tier}
                      </Badge>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Progress Section */}
          {!currentTier && nextTier && (
            <div className="space-y-3 mb-4">
              {/* Overall Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                  <span className="font-medium">{Math.round(nextTier.progress.percentage)}%</span>
                </div>
                <Progress value={nextTier.progress.percentage} className="h-2" />
              </div>
              
              {/* Hours Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Hours</span>
                  <span className={totalHours >= nextTier.requirements.minHours ? 'text-green-600 dark:text-green-400 font-medium' : 'font-medium'}>
                    {totalHours}/{nextTier.requirements.minHours}
                  </span>
                </div>
                <Progress 
                  value={(totalHours / nextTier.requirements.minHours) * 100} 
                  className="h-2" 
                />
              </div>

              {/* Activities Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Activities</span>
                  <span className={totalActivities >= nextTier.requirements.minActivities ? 'text-green-600 dark:text-green-400 font-medium' : 'font-medium'}>
                    {totalActivities}/{nextTier.requirements.minActivities}
                  </span>
                </div>
                <Progress 
                  value={(totalActivities / nextTier.requirements.minActivities) * 100} 
                  className="h-2" 
                />
              </div>
            </div>
          )}

          {/* Earned Badge Info */}
          {earnedTiers.length > 0 && !nextTier && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">All Tiers Completed!</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Badge Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-12 h-12 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-2 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!badgeData) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-2">
            <Award className="w-4 h-4 text-white" />
          </div>
          Badge Progress
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Rank Progress */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          {/* Current Rank */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center shadow-md">
              <Image
                src={getRankBadgeImage(badgeData.rankProgress.currentRank.rank)}
                alt={badgeData.rankProgress.currentRank.name}
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Current Rank</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {badgeData.rankProgress.currentRank.name}
              </div>
            </div>
          </div>
          
          {/* Rank Progress Bars */}
          {badgeData.rankProgress.nextRank && (
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Impact Score</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {badgeData.rankProgress.currentProgress.score} / {badgeData.rankProgress.nextRank.requirements.minScore}
                </span>
              </div>
              <Progress value={badgeData.rankProgress.nextRank.progress.score} className="h-2 mb-3" />
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Volunteer Hours</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {badgeData.rankProgress.currentProgress.hours} / {badgeData.rankProgress.nextRank.requirements.minHours}
                </span>
              </div>
              <Progress value={badgeData.rankProgress.nextRank.progress.hours} className="h-2 mb-3" />
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">SDG Badges</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {badgeData.rankProgress.currentProgress.badges} / {badgeData.rankProgress.nextRank.requirements.minBadges}
                </span>
              </div>
              <Progress value={badgeData.rankProgress.nextRank.progress.badges} className="h-2" />

              {/* Next Rank - Below Progress Bars */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-purple-200 dark:border-purple-800">
                <span className="text-xs text-gray-600 dark:text-gray-400">Next Rank</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {badgeData.rankProgress.nextRank.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View All Link */}
        <div className="mb-3">
          <Link href="/profile/badges">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
            >
              <Award className="w-4 h-4 mr-2" />
              View All Badges
            </Button>
          </Link>
        </div>

        {/* Call to Action */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm">Keep Building Impact!</h4>
              <p className="text-xs text-muted-foreground">
                Join more events to unlock new badges and progress your existing ones
              </p>
            </div>
            <Link href="/events" className="block">
              <Button size="sm" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3">
                Find Events
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}