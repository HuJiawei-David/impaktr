// home/ubuntu/impaktrweb/src/components/dashboard/BadgeProgress.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, TrendingUp, Target, ChevronRight, Star, Trophy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getSDGColor, getSDGName } from '@/lib/utils';

interface BadgeProgressItem {
  id: string;
  sdgNumber: number;
  tier: string;
  name: string;
  description: string;
  progress: number;
  earned: boolean;
  earnedAt?: string;
  requirements: {
    minHours: number;
    minActivities: number;
    minQuality?: number;
  };
  userStats: {
    currentHours: number;
    currentActivities: number;
    avgQuality: number;
  };
  nextTier?: {
    name: string;
    requirements: {
      minHours: number;
      minActivities: number;
      minQuality?: number;
    };
  };
}

interface BadgeProgressData {
  recentlyEarned: BadgeProgressItem[];
  inProgress: BadgeProgressItem[];
  available: BadgeProgressItem[];
  totalBadges: number;
  earnedBadges: number;
}

export function BadgeProgress() {
  const [badgeData, setBadgeData] = useState<BadgeProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');

  useEffect(() => {
    fetchBadgeProgress();
  }, []);

  const fetchBadgeProgress = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await fetch('/api/users/badges/progress');
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockData: BadgeProgressData = {
        totalBadges: 68, // 17 SDGs x 4 tiers
        earnedBadges: 12,
        recentlyEarned: [
          {
            id: '1',
            sdgNumber: 13,
            tier: 'SUPPORTER',
            name: 'Climate Action Supporter',
            description: 'Starting your journey in Climate Action',
            progress: 100,
            earned: true,
            earnedAt: '2024-01-15T10:30:00Z',
            requirements: { minHours: 5, minActivities: 1 },
            userStats: { currentHours: 8, currentActivities: 2, avgQuality: 0.9 },
            nextTier: {
              name: 'Climate Action Builder',
              requirements: { minHours: 25, minActivities: 3, minQuality: 0.7 }
            }
          },
          {
            id: '2',
            sdgNumber: 4,
            tier: 'BUILDER',
            name: 'Quality Education Builder',
            description: 'Building impact in Quality Education',
            progress: 100,
            earned: true,
            earnedAt: '2024-01-10T14:20:00Z',
            requirements: { minHours: 25, minActivities: 3, minQuality: 0.7 },
            userStats: { currentHours: 32, currentActivities: 4, avgQuality: 0.85 }
          }
        ],
        inProgress: [
          {
            id: '3',
            sdgNumber: 1,
            tier: 'SUPPORTER',
            name: 'No Poverty Supporter',
            description: 'Starting your journey in fighting poverty',
            progress: 75,
            earned: false,
            requirements: { minHours: 5, minActivities: 1 },
            userStats: { currentHours: 3.5, currentActivities: 1, avgQuality: 0.8 },
            nextTier: {
              name: 'No Poverty Builder',
              requirements: { minHours: 25, minActivities: 3, minQuality: 0.7 }
            }
          },
          {
            id: '4',
            sdgNumber: 13,
            tier: 'BUILDER',
            name: 'Climate Action Builder',
            description: 'Building significant impact in Climate Action',
            progress: 45,
            earned: false,
            requirements: { minHours: 25, minActivities: 3, minQuality: 0.7 },
            userStats: { currentHours: 12, currentActivities: 2, avgQuality: 0.9 }
          },
          {
            id: '5',
            sdgNumber: 3,
            tier: 'SUPPORTER',
            name: 'Good Health Supporter',
            description: 'Starting your journey in health and well-being',
            progress: 30,
            earned: false,
            requirements: { minHours: 5, minActivities: 1 },
            userStats: { currentHours: 1.5, currentActivities: 1, avgQuality: 0.7 }
          }
        ],
        available: [
          {
            id: '6',
            sdgNumber: 2,
            tier: 'SUPPORTER',
            name: 'Zero Hunger Supporter',
            description: 'Start fighting hunger in your community',
            progress: 0,
            earned: false,
            requirements: { minHours: 5, minActivities: 1 },
            userStats: { currentHours: 0, currentActivities: 0, avgQuality: 0 }
          },
          {
            id: '7',
            sdgNumber: 5,
            tier: 'SUPPORTER',
            name: 'Gender Equality Supporter',
            description: 'Begin promoting gender equality',
            progress: 0,
            earned: false,
            requirements: { minHours: 5, minActivities: 1 },
            userStats: { currentHours: 0, currentActivities: 0, avgQuality: 0 }
          }
        ]
      };
      
      setBadgeData(mockData);
    } catch (error) {
      console.error('Error fetching badge progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeIcon = (tier: string) => {
    switch (tier) {
      case 'SUPPORTER': return '🌱';
      case 'BUILDER': return '🔨';
      case 'CHAMPION': return '🏆';
      case 'GUARDIAN': return '🛡️';
      default: return '⭐';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const renderBadgeCard = (badge: BadgeProgressItem, showProgress = true) => {
    const hoursNeeded = badge.requirements.minHours - badge.userStats.currentHours;
    const activitiesNeeded = badge.requirements.minActivities - badge.userStats.currentActivities;
    
    return (
      <Card key={badge.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* SDG Badge and Name - Top */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: getSDGColor(badge.sdgNumber) }}
              >
                <div className="text-xs font-bold">SDG</div>
                <div className="text-sm font-bold leading-none">{badge.sdgNumber}</div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm flex items-center">
                  {badge.name}
                  {badge.earned && <Star className="w-3 h-3 ml-1 text-yellow-500 fill-current" />}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {badge.tier}
                </p>
              </div>
            </div>

            {/* Earned Badge */}
            {badge.earned && (
              <Badge variant="success" className="text-xs px-2 py-1 w-fit flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Earned
              </Badge>
            )}

            {/* Progress - Full Width Below */}
            {showProgress && !badge.earned && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className={`font-medium ${getProgressColor(badge.progress)}`}>
                    {badge.progress}%
                  </span>
                </div>
                <Progress value={badge.progress} className="h-2" />
                
                {/* Requirements - Only show what's still needed */}
                <div className="text-xs text-muted-foreground">
                  {hoursNeeded > 0 && activitiesNeeded > 0 && (
                    <span>Need {hoursNeeded.toFixed(1)} more hours and {activitiesNeeded} more {activitiesNeeded === 1 ? 'activity' : 'activities'}</span>
                  )}
                  {hoursNeeded > 0 && activitiesNeeded <= 0 && (
                    <span>Need {hoursNeeded.toFixed(1)} more hours</span>
                  )}
                  {hoursNeeded <= 0 && activitiesNeeded > 0 && (
                    <span>Need {activitiesNeeded} more {activitiesNeeded === 1 ? 'activity' : 'activities'}</span>
                  )}
                </div>
              </div>
            )}

            {/* Next Tier */}
            {badge.earned && badge.nextTier && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                  Next: {badge.nextTier.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Need {badge.nextTier.requirements.minHours} hours and {badge.nextTier.requirements.minActivities} {badge.nextTier.requirements.minActivities === 1 ? 'activity' : 'activities'}
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
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white text-center">{badgeData.earnedBadges}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">Earned</div>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-transparent">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white text-center">{badgeData.inProgress.length}</div>
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

        {/* Badge Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveTab('earned')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'earned'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Recently Earned
          </button>
        </div>

        {/* Badge Content */}
        <div className="space-y-3">
          {activeTab === 'progress' && (
            <>
            {badgeData.inProgress.length > 0 ? (
              <>
                {badgeData.inProgress.slice(0, 3).map((badge) => renderBadgeCard(badge, true))}
                {badgeData.inProgress.length > 3 && (
                  <div className="text-center">
                    <Link href="/profile?tab=badges">
                      <Button variant="outline" size="sm">
                        View {badgeData.inProgress.length - 3} More
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No badges in progress</p>
                <p className="text-xs">Join events to start earning badges</p>
              </div>
            )}
            </>
          )}

          {activeTab === 'earned' && (
            <>
            {badgeData.recentlyEarned.length > 0 ? (
              <>
                {badgeData.recentlyEarned.map((badge) => renderBadgeCard(badge, false))}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No badges earned yet</p>
                <p className="text-xs">Complete verified activities to earn your first badge</p>
              </div>
            )}
            </>
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