// home/ubuntu/impaktrweb/src/components/profile/BadgeCollection.tsx

'use client';

import React, { useState } from 'react';
import { Award, Lock, Star, Calendar, TrendingUp, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSDGName, getSDGColor, formatDate } from '@/lib/utils';

interface UserBadge {
  id: string;
  sdgNumber: number;
  tier: 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN';
  name: string;
  earnedAt?: string;
  progress: number;
  requirements: {
    minHours: number;
    minActivities: number;
    minQuality?: number;
  };
  currentStats: {
    hours: number;
    activities: number;
    avgQuality: number;
  };
}

interface BadgeCollectionProps {
  badges: UserBadge[];
}

const tierInfo = {
  SUPPORTER: { 
    name: 'Supporter', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🌱',
    description: 'Starting your impact journey'
  },
  BUILDER: { 
    name: 'Builder', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🏗️',
    description: 'Building meaningful impact'
  },
  CHAMPION: { 
    name: 'Champion', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '🏆',
    description: 'Leading change in the community'
  },
  GUARDIAN: { 
    name: 'Guardian', 
    color: 'bg-gold-100 text-gold-800 border-gold-200',
    icon: '🛡️',
    description: 'Protecting and advancing the cause'
  }
};

export function BadgeCollection({ badges }: BadgeCollectionProps) {
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('sdg');
  const [viewMode, setViewMode] = useState<'grid' | 'sdg'>('grid');

  // Group badges by SDG
  const badgesBySDG = badges.reduce((acc, badge) => {
    if (!acc[badge.sdgNumber]) {
      acc[badge.sdgNumber] = [];
    }
    acc[badge.sdgNumber].push(badge);
    return acc;
  }, {} as Record<number, UserBadge[]>);

  // Get earned and in-progress badges
  const earnedBadges = badges.filter(badge => badge.earnedAt);
  const inProgressBadges = badges.filter(badge => !badge.earnedAt && badge.progress > 0);
  const availableBadges = badges.filter(badge => badge.progress === 0);

  // Filter and sort badges
  const getFilteredBadges = () => {
    let filtered = badges;

    if (filterTier !== 'all') {
      filtered = filtered.filter(badge => badge.tier === filterTier);
    }

    if (filterStatus === 'earned') {
      filtered = filtered.filter(badge => badge.earnedAt);
    } else if (filterStatus === 'progress') {
      filtered = filtered.filter(badge => !badge.earnedAt && badge.progress > 0);
    } else if (filterStatus === 'available') {
      filtered = filtered.filter(badge => badge.progress === 0);
    }

    // Sort badges
    switch (sortBy) {
      case 'progress':
        return filtered.sort((a, b) => b.progress - a.progress);
      case 'earned':
        return filtered.sort((a, b) => {
          if (a.earnedAt && b.earnedAt) {
            return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
          }
          return a.earnedAt ? -1 : 1;
        });
      case 'tier':
        const tierOrder = { SUPPORTER: 1, BUILDER: 2, CHAMPION: 3, GUARDIAN: 4 };
        return filtered.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
      default: // sdg
        return filtered.sort((a, b) => a.sdgNumber - b.sdgNumber);
    }
  };

  const filteredBadges = getFilteredBadges();

  const BadgeCard = ({ badge }: { badge: UserBadge }) => {
    const tier = tierInfo[badge.tier];
    const isEarned = !!badge.earnedAt;
    const isInProgress = badge.progress > 0 && !isEarned;

    return (
      <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
        isEarned ? 'ring-2 ring-primary/20 bg-primary/5' : 
        isInProgress ? 'ring-1 ring-yellow-200 bg-yellow-50/50' : 
        'opacity-75 hover:opacity-100'
      }`}>
        {/* Badge Status Indicator */}
        <div className="absolute top-2 right-2">
          {isEarned && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
          {!isEarned && badge.progress === 0 && (
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-gray-600" />
            </div>
          )}
        </div>

        <CardContent className="p-6">
          {/* SDG Icon and Number */}
          <div className="flex items-start space-x-4 mb-4">
            <div
              className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg"
              style={{ backgroundColor: getSDGColor(badge.sdgNumber) }}
            >
              <div className="text-xs">SDG</div>
              <div className="text-xl leading-none">{badge.sdgNumber}</div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-lg mb-1 ${!isEarned ? 'text-muted-foreground' : ''}`}>
                {badge.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {getSDGName(badge.sdgNumber)}
              </p>
              <Badge className={`text-xs ${tier.color}`}>
                {tier.icon} {tier.name}
              </Badge>
            </div>
          </div>

          {/* Progress Section */}
          {!isEarned && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(badge.progress)}%</span>
              </div>
              <Progress value={badge.progress} className="h-2" />
              
              {/* Requirements */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hours:</span>
                    <span className={badge.currentStats.hours >= badge.requirements.minHours ? 'text-green-600 font-medium' : ''}>
                      {badge.currentStats.hours}/{badge.requirements.minHours}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Activities:</span>
                    <span className={badge.currentStats.activities >= badge.requirements.minActivities ? 'text-green-600 font-medium' : ''}>
                      {badge.currentStats.activities}/{badge.requirements.minActivities}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  {badge.requirements.minQuality && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Quality:</span>
                      <span className={badge.currentStats.avgQuality >= badge.requirements.minQuality ? 'text-green-600 font-medium' : ''}>
                        {badge.currentStats.avgQuality.toFixed(1)}/{badge.requirements.minQuality}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Earned Badge Info */}
          {isEarned && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Earned {badge.earnedAt ? formatDate(badge.earnedAt) : 'Unknown'}
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                {tier.description}
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4">
            {isEarned ? (
              <Button variant="outline" size="sm" className="w-full">
                <Award className="w-4 h-4 mr-2" />
                View Certificate
              </Button>
            ) : isInProgress ? (
              <Button variant="default" size="sm" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Continue Progress
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Start Journey
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{earnedBadges.length}</div>
            <div className="text-sm text-muted-foreground">Badges Earned</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressBadges.length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(earnedBadges.map(b => b.sdgNumber)).size}
            </div>
            <div className="text-sm text-muted-foreground">SDGs Covered</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((earnedBadges.length / badges.length) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Collection</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Badges</SelectItem>
              <SelectItem value="earned">Earned</SelectItem>
              <SelectItem value="progress">In Progress</SelectItem>
              <SelectItem value="available">Available</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTier} onValueChange={setFilterTier}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="SUPPORTER">Supporter</SelectItem>
              <SelectItem value="BUILDER">Builder</SelectItem>
              <SelectItem value="CHAMPION">Champion</SelectItem>
              <SelectItem value="GUARDIAN">Guardian</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sdg">By SDG</SelectItem>
              <SelectItem value="progress">By Progress</SelectItem>
              <SelectItem value="earned">Recently Earned</SelectItem>
              <SelectItem value="tier">By Tier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Mode Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          onClick={() => setViewMode('grid')}
          className={`rounded-full px-6 py-2 ${
            viewMode === 'grid' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Grid View
        </Button>
        <Button
          variant={viewMode === 'sdg' ? 'default' : 'outline'}
          onClick={() => setViewMode('sdg')}
          className={`rounded-full px-6 py-2 ${
            viewMode === 'sdg' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          By SDG
        </Button>
      </div>

      {/* Badge Collection Content */}
      <div className="space-y-4">
        {viewMode === 'grid' ? (
          <>
            {filteredBadges.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No badges found</h3>
                  <p className="text-muted-foreground">
                    No badges match your current filters. Try adjusting your selection.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {Object.entries(badgesBySDG)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([sdgNumber, sdgBadges]) => (
                <Card key={sdgNumber}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: getSDGColor(parseInt(sdgNumber)) }}
                      >
                        <div className="text-xs">SDG</div>
                        <div>{sdgNumber}</div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{getSDGName(parseInt(sdgNumber))}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sdgBadges.filter(b => b.earnedAt).length} of {sdgBadges.length} badges earned
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {sdgBadges
                        .sort((a, b) => {
                          const tierOrder = { SUPPORTER: 1, BUILDER: 2, CHAMPION: 3, GUARDIAN: 4 };
                          return tierOrder[a.tier] - tierOrder[b.tier];
                        })
                        .map((badge) => (
                          <BadgeCard key={badge.id} badge={badge} />
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}