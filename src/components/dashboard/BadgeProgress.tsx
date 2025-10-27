// home/ubuntu/impaktrweb/src/components/dashboard/BadgeProgress.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Award, TrendingUp, Target, ChevronRight, Star, Trophy, CheckCircle } from 'lucide-react';
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
import { IndividualRank, BadgeTier } from '@prisma/client';

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
  const [badgeData, setBadgeData] = useState<BadgeProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBadgeProgress();
  }, []);

  const fetchBadgeProgress = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await fetch('/api/users/badges/progress');
      // const data = await response.json();
      
  // Mock data matching the real API structure
  const mockData: BadgeProgressData = {
    rankProgress: {
      currentRank: {
        rank: IndividualRank.SUPPORTER,
        name: 'Supporter',
        icon: 'heart'
      },
      nextRank: {
        rank: IndividualRank.CONTRIBUTOR,
        name: 'Contributor',
        requirements: {
          minScore: 100,
          minHours: 25,
          minBadges: 3
        },
        progress: {
          score: 75,
          hours: 80,
          badges: 67
        }
      },
      currentProgress: {
        score: 75,
        hours: 20,
        badges: 2
      }
    },
    sdgBadges: [
      {
        sdgNumber: 1,
        sdgName: 'No Poverty',
        icon: 'coins',
        color: 'from-red-600 to-red-700',
        tiers: [
          {
            tier: BadgeTier.SUPPORTER,
            name: 'Supporter',
            description: 'Supporting poverty alleviation efforts',
            requirements: { minHours: 10, minActivities: 2 },
            progress: { hours: 8, activities: 2, percentage: 100 },
            earned: true
          },
          {
            tier: BadgeTier.BUILDER,
            name: 'Advocate',
            description: 'Advocating for poverty elimination',
            requirements: { minHours: 50, minActivities: 8 },
            progress: { hours: 8, activities: 2, percentage: 16 },
            earned: false
          },
          {
            tier: BadgeTier.CHAMPION,
            name: 'Builder',
            description: 'Building sustainable poverty solutions',
            requirements: { minHours: 150, minActivities: 20 },
            progress: { hours: 8, activities: 2, percentage: 5 },
            earned: false
          },
          {
            tier: BadgeTier.GUARDIAN,
            name: 'Poverty Fighter',
            description: 'Fighting poverty with exceptional dedication',
            requirements: { minHours: 400, minActivities: 50 },
            progress: { hours: 8, activities: 2, percentage: 2 },
            earned: false
          }
        ]
      },
      {
        sdgNumber: 4,
        sdgName: 'Quality Education',
        icon: 'graduation-cap',
        color: 'from-red-700 to-red-800',
        tiers: [
          {
            tier: BadgeTier.SUPPORTER,
            name: 'Tutor',
            description: 'Tutoring and mentoring learners',
            requirements: { minHours: 10, minActivities: 2 },
            progress: { hours: 12, activities: 3, percentage: 100 },
            earned: true
          },
          {
            tier: BadgeTier.BUILDER,
            name: 'Mentor',
            description: 'Mentoring future leaders',
            requirements: { minHours: 50, minActivities: 8 },
            progress: { hours: 12, activities: 3, percentage: 24 },
            earned: false
          },
          {
            tier: BadgeTier.CHAMPION,
            name: 'Knowledge Builder',
            description: 'Building knowledge ecosystems',
            requirements: { minHours: 150, minActivities: 20 },
            progress: { hours: 12, activities: 3, percentage: 8 },
            earned: false
          },
          {
            tier: BadgeTier.GUARDIAN,
            name: 'Education Leader',
            description: 'Leading educational transformation',
            requirements: { minHours: 400, minActivities: 50 },
            progress: { hours: 12, activities: 3, percentage: 3 },
            earned: false
          }
        ]
      },
      {
        sdgNumber: 13,
        sdgName: 'Climate Action',
        icon: 'thermometer',
        color: 'from-green-700 to-green-800',
        tiers: [
          {
            tier: BadgeTier.SUPPORTER,
            name: 'Climate Ally',
            description: 'Supporting climate action',
            requirements: { minHours: 10, minActivities: 2 },
            progress: { hours: 5, activities: 1, percentage: 50 },
            earned: false
          },
          {
            tier: BadgeTier.BUILDER,
            name: 'Climate Builder',
            description: 'Building climate solutions',
            requirements: { minHours: 50, minActivities: 8 },
            progress: { hours: 5, activities: 1, percentage: 10 },
            earned: false
          },
          {
            tier: BadgeTier.CHAMPION,
            name: 'Climate Champion',
            description: 'Championing climate action',
            requirements: { minHours: 150, minActivities: 20 },
            progress: { hours: 5, activities: 1, percentage: 3 },
            earned: false
          },
          {
            tier: BadgeTier.GUARDIAN,
            name: 'Climate Guardian',
            description: 'Protecting our climate',
            requirements: { minHours: 400, minActivities: 50 },
            progress: { hours: 5, activities: 1, percentage: 1 },
            earned: false
          }
        ]
      }
    ],
    stats: {
      recentlyEarned: [
        {
          name: 'No Poverty Supporter',
          earnedAt: new Date('2024-01-15'),
          icon: 'coins'
        },
        {
          name: 'Quality Education Tutor',
          earnedAt: new Date('2024-01-10'),
          icon: 'graduation-cap'
        }
      ],
      closeToEarning: [
        {
          sdgNumber: 13,
          sdgName: 'Climate Action',
          tierName: 'Climate Ally',
          progress: 50
        }
      ]
    }
  };
      
      setBadgeData(mockData);
    } catch (error) {
      console.error('Error fetching badge progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierBadgeColor = (tier: BadgeTier) => {
    switch (tier) {
      case BadgeTier.SUPPORTER:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case BadgeTier.BUILDER:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case BadgeTier.CHAMPION:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case BadgeTier.GUARDIAN:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTierIcon = (tier: BadgeTier) => {
    switch (tier) {
      case BadgeTier.SUPPORTER: return '🌱';
      case BadgeTier.BUILDER: return '🔨';
      case BadgeTier.CHAMPION: return '🏆';
      case BadgeTier.GUARDIAN: return '🛡️';
      default: return '⭐';
    }
  };

  const getRankIcon = (rank: IndividualRank) => {
    switch (rank) {
      case IndividualRank.HELPER: return 'hand-helping';
      case IndividualRank.SUPPORTER: return 'heart';
      case IndividualRank.CONTRIBUTOR: return 'users';
      case IndividualRank.BUILDER: return 'hammer';
      case IndividualRank.ADVOCATE: return 'megaphone';
      case IndividualRank.CHANGEMAKER: return 'sparkles';
      case IndividualRank.MENTOR: return 'user-graduate';
      case IndividualRank.LEADER: return 'crown';
      case IndividualRank.AMBASSADOR: return 'globe';
      case IndividualRank.GLOBAL_CITIZEN: return 'earth';
      default: return 'award';
    }
  };

  const renderSDGBadgeCard = (sdgBadge: SDGBadgeProgress) => {
    const sdgInfo = getSDGById(sdgBadge.sdgNumber);
    const earnedTiers = sdgBadge.tiers.filter(tier => tier.earned);
    const currentTier = earnedTiers.length > 0 ? earnedTiers[earnedTiers.length - 1] : null;
    const nextTier = sdgBadge.tiers.find(tier => !tier.earned);
    
    return (
      <Card key={sdgBadge.sdgNumber} className="hover:shadow-md transition-shadow bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* SDG Badge Image and Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden">
                {currentTier ? (
                  <Image
                    src={getSDGBadgeImage(sdgBadge.sdgNumber, currentTier.tier)}
                    alt={`${currentTier.name} - SDG ${sdgBadge.sdgNumber}`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Badge</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm flex items-center">
                  SDG {sdgBadge.sdgNumber}: {sdgBadge.sdgName}
                  {earnedTiers.length > 0 && <Star className="w-3 h-3 ml-1 text-yellow-500 fill-current" />}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {currentTier ? (
                    <Badge className={`text-xs px-3 py-1 ${getTierBadgeColor(currentTier.tier)}`}>
                      {getTierIcon(currentTier.tier)} {currentTier.name}
                    </Badge>
                  ) : (
                    <Badge className="text-xs px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      No Badge Yet
                    </Badge>
                  )}
                  {earnedTiers.length > 0 && (
                    <Badge variant="success" className="text-xs px-2 py-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {earnedTiers.length} earned
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {sdgBadge.tiers.reduce((sum, tier) => sum + tier.progress.hours, 0)}h
                </div>
                <div className="text-gray-500 dark:text-gray-400">Total Hours</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {sdgBadge.tiers.reduce((sum, tier) => sum + tier.progress.activities, 0)}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Activities</div>
              </div>
            </div>

            {/* Progress towards next tier */}
            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Progress to {nextTier.name}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round(nextTier.progress.percentage)}%
                  </span>
                </div>
                <Progress value={nextTier.progress.percentage} className="h-2" />
                
                {/* Requirements */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Need {nextTier.requirements.minHours - nextTier.progress.hours} more hours and {nextTier.requirements.minActivities - nextTier.progress.activities} more activities
                </div>
              </div>
            )}

            {/* Earned tiers display */}
            {earnedTiers.length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-xs font-semibold text-green-800 dark:text-green-200 mb-2">
                  Earned Badges:
                </div>
                <div className="flex flex-wrap gap-1">
                  {earnedTiers.map((tier) => (
                    <Badge key={tier.tier} className={`text-xs px-2 py-1 ${getTierBadgeColor(tier.tier)}`}>
                      {getTierIcon(tier.tier)} {tier.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                <Image
                  src={getRankBadgeImage(badgeData.rankProgress.currentRank.rank)}
                  alt={badgeData.rankProgress.currentRank.name}
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Rank</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {badgeData.rankProgress.currentRank.name}
                </div>
              </div>
            </div>
            {badgeData.rankProgress.nextRank && (
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Next Rank</div>
                <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {badgeData.rankProgress.nextRank.name}
                </div>
              </div>
            )}
          </div>
          
          {/* Rank Progress Bars */}
          {badgeData.rankProgress.nextRank && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Impact Score</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {badgeData.rankProgress.currentProgress.score} / {badgeData.rankProgress.nextRank.requirements.minScore}
                </span>
              </div>
              <Progress value={badgeData.rankProgress.nextRank.progress.score} className="h-2" />
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Volunteer Hours</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {badgeData.rankProgress.currentProgress.hours} / {badgeData.rankProgress.nextRank.requirements.minHours}
                </span>
              </div>
              <Progress value={badgeData.rankProgress.nextRank.progress.hours} className="h-2" />
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">SDG Badges</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {badgeData.rankProgress.currentProgress.badges} / {badgeData.rankProgress.nextRank.requirements.minBadges}
                </span>
              </div>
              <Progress value={badgeData.rankProgress.nextRank.progress.badges} className="h-2" />
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              {badgeData.sdgBadges.reduce((total, badge) => total + badge.tiers.filter(tier => tier.earned).length, 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">SDG Badges Earned</div>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              {badgeData.sdgBadges.filter(badge => badge.tiers.some(tier => !tier.earned && tier.progress.percentage > 0)).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">In Progress</div>
          </div>
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


        {/* Badge Content */}
        <div className="space-y-3">
          {badgeData.sdgBadges.length > 0 ? (
            <>
              {badgeData.sdgBadges.slice(0, 3).map((sdgBadge) => renderSDGBadgeCard(sdgBadge))}
              {badgeData.sdgBadges.length > 3 && (
                <div className="text-center">
                  <Link href="/profile/badges">
                    <Button variant="outline" size="sm">
                      View {badgeData.sdgBadges.length - 3} More SDGs
                    </Button>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No SDG badges yet</p>
              <p className="text-xs">Join events to start earning SDG badges</p>
            </div>
          )}
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