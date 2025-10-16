// home/ubuntu/impaktrweb/src/components/dashboard/BadgeProgress.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, TrendingUp, Target, ChevronRight, Star, Trophy } from 'lucide-react';
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

  const renderBadgeCard = (badge: BadgeProgressItem, showProgress = true) => (
    <Card key={badge.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* SDG Badge */}
          <div
            className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: getSDGColor(badge.sdgNumber) }}
          >
            <div className="text-xs font-bold">SDG</div>
            <div className="text-sm font-bold leading-none">{badge.sdgNumber}</div>
          </div>

          {/* Badge Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-sm leading-tight flex items-center">
                  {getBadgeIcon(badge.tier)} {badge.name}
                  {badge.earned && <Star className="w-3 h-3 ml-1 text-yellow-500 fill-current" />}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {badge.description}
                </p>
              </div>
              
              {badge.earned && (
                <Badge variant="success" className="text-xs px-2 py-1">
                  Earned
                </Badge>
              )}
            </div>

            {/* Progress */}
            {showProgress && !badge.earned && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className={`font-medium ${getProgressColor(badge.progress)}`}>
                    {badge.progress}%
                  </span>
                </div>
                <Progress value={badge.progress} className="h-2" />
                
                {/* Requirements */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Hours: </span>
                    <span className="font-medium">
                      {badge.userStats.currentHours}/{badge.requirements.minHours}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Activities: </span>
                    <span className="font-medium">
                      {badge.userStats.currentActivities}/{badge.requirements.minActivities}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Next Tier */}
            {badge.earned && badge.nextTier && (
              <div className="mt-2 p-2 bg-primary/10 rounded border border-primary/20">
                <div className="text-xs text-primary font-medium">
                  Next: {badge.nextTier.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  Need {badge.nextTier.requirements.minHours} hours, {badge.nextTier.requirements.minActivities} activities
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Badge Progress
          </span>
          <Link href="/profile?tab=badges">
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{badgeData.earnedBadges}</div>
            <div className="text-xs text-muted-foreground">Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{badgeData.inProgress.length}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{badgeData.available.length}</div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
        </div>

        {/* Badge Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveTab('earned')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'earned'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Recently Earned
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'available'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Available
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

          {activeTab === 'available' && (
            <>
            {badgeData.available.length > 0 ? (
              <>
                {badgeData.available.slice(0, 3).map((badge) => renderBadgeCard(badge, false))}
                {badgeData.available.length > 3 && (
                  <div className="text-center">
                    <Link href="/profile?tab=badges">
                      <Button variant="outline" size="sm">
                        View All Available Badges
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">All badges unlocked!</p>
                <p className="text-xs">You've made progress on all available badges</p>
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