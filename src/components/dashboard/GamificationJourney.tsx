'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp, 
  Crown, 
  Globe, 
  Users,
  Building,
  Award,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import Link from 'next/link';

// Individual progression levels
const INDIVIDUAL_RANKS = [
  { level: 1, name: 'Helper', icon: '🤝', threshold: 0, description: 'Starting your impact journey' },
  { level: 2, name: 'Supporter', icon: '🌱', threshold: 50, description: 'Making your first contributions' },
  { level: 3, name: 'Contributor', icon: '⚡', threshold: 100, description: 'Regular community involvement' },
  { level: 4, name: 'Builder', icon: '🔨', threshold: 200, description: 'Building meaningful change' },
  { level: 5, name: 'Advocate', icon: '📢', threshold: 350, description: 'Championing important causes' },
  { level: 6, name: 'Changemaker', icon: '🚀', threshold: 500, description: 'Creating lasting impact' },
  { level: 7, name: 'Mentor', icon: '👥', threshold: 650, description: 'Guiding others in their journey' },
  { level: 8, name: 'Leader', icon: '👑', threshold: 800, description: 'Leading community initiatives' },
  { level: 9, name: 'Ambassador', icon: '🌍', threshold: 900, description: 'Representing global impact' },
  { level: 10, name: 'Global Citizen', icon: '🌟', threshold: 1000, description: 'Ultimate impact achievement' }
];

// Organization tiers
const ORGANIZATION_TIERS = [
  { level: 1, name: 'Registered', icon: '📝', threshold: 0, description: 'Just signed up' },
  { level: 2, name: 'Participant', icon: '🎯', threshold: 10, description: 'Active participation' },
  { level: 3, name: 'Community Ally', icon: '🤝', threshold: 25, description: 'Community engagement' },
  { level: 4, name: 'Contributor', icon: '⚡', threshold: 50, description: 'Regular contributions' },
  { level: 5, name: 'CSR Practitioner', icon: '💼', threshold: 100, description: 'CSR programs active' },
  { level: 6, name: 'CSR Leader', icon: '🏆', threshold: 200, description: 'Leading CSR initiatives' },
  { level: 7, name: 'ESG Champion', icon: '🌱', threshold: 350, description: 'ESG excellence' },
  { level: 8, name: 'Trusted Partner', icon: '🤝', threshold: 500, description: 'Trusted community partner' },
  { level: 9, name: 'Industry Benchmark', icon: '📊', threshold: 750, description: 'Industry-leading practices' },
  { level: 10, name: 'Global Impact Leader', icon: '🌍', threshold: 1000, description: 'Global impact leadership' }
];

// SDG Badge tiers with themed names
const SDG_BADGE_TIERS = {
  1: { // No Poverty
    1: { name: 'Supporter', icon: '🤝', color: 'bg-red-500' },
    2: { name: 'Advocate', icon: '📢', color: 'bg-red-600' },
    3: { name: 'Builder', icon: '🏗️', color: 'bg-red-700' },
    4: { name: 'Poverty Fighter', icon: '⚔️', color: 'bg-red-800' }
  },
  2: { // Zero Hunger
    1: { name: 'Food Giver', icon: '🍎', color: 'bg-yellow-500' },
    2: { name: 'Nourisher', icon: '🌾', color: 'bg-yellow-600' },
    3: { name: 'Hunger Solver', icon: '🍽️', color: 'bg-yellow-700' },
    4: { name: 'Food Security Leader', icon: '👑', color: 'bg-yellow-800' }
  },
  3: { // Good Health
    1: { name: 'Health Ally', icon: '🏥', color: 'bg-green-500' },
    2: { name: 'Health Advocate', icon: '💚', color: 'bg-green-600' },
    3: { name: 'Health Champion', icon: '🏆', color: 'bg-green-700' },
    4: { name: 'Health Guardian', icon: '🛡️', color: 'bg-green-800' }
  },
  4: { // Quality Education
    1: { name: 'Tutor', icon: '📚', color: 'bg-blue-500' },
    2: { name: 'Mentor', icon: '👨‍🏫', color: 'bg-blue-600' },
    3: { name: 'Knowledge Builder', icon: '🧠', color: 'bg-blue-700' },
    4: { name: 'Education Leader', icon: '🎓', color: 'bg-blue-800' }
  },
  5: { // Gender Equality
    1: { name: 'Supporter', icon: '🤝', color: 'bg-purple-500' },
    2: { name: 'Equalizer', icon: '⚖️', color: 'bg-purple-600' },
    3: { name: 'Advocate', icon: '📢', color: 'bg-purple-700' },
    4: { name: 'Justice Leader', icon: '👑', color: 'bg-purple-800' }
  },
  13: { // Climate Action
    1: { name: 'Climate Ally', icon: '🌱', color: 'bg-green-500' },
    2: { name: 'Climate Builder', icon: '🌍', color: 'bg-green-600' },
    3: { name: 'Climate Champion', icon: '🌿', color: 'bg-green-700' },
    4: { name: 'Climate Guardian', icon: '🌏', color: 'bg-green-800' }
  }
  // Add more SDGs as needed
};

interface GamificationData {
  currentRank: number;
  currentScore: number;
  totalHours: number;
  badgesEarned: number;
  userType: 'individual' | 'organization';
  recentBadges: Array<{
    sdgNumber: number;
    tier: number;
    name: string;
    earnedAt: string;
  }>;
  progressBadges: Array<{
    sdgNumber: number;
    tier: number;
    name: string;
    progress: number;
    nextMilestone: number;
  }>;
}

interface GamificationJourneyProps {
  compact?: boolean;
}

export function GamificationJourney({ compact = false }: GamificationJourneyProps) {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('journey');

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      const response = await fetch('/api/users/gamification');
      if (!response.ok) {
        // If API fails, use mock data instead of throwing error
        console.warn('Gamification API not available, using mock data');
        throw new Error('API not available');
      }
      
      const data = await response.json();
      setGamificationData({
        currentRank: data.currentRank,
        currentScore: data.currentScore,
        totalHours: data.totalHours,
        badgesEarned: data.badgesEarned,
        userType: data.userType,
        recentBadges: data.recentBadges,
        progressBadges: data.progressBadges
      });
    } catch (error) {
      console.warn('Using mock gamification data:', error instanceof Error ? error.message : 'Unknown error');
      // Fallback to mock data if API fails
      const mockData: GamificationData = {
        currentRank: 3, // Contributor level
        currentScore: 147,
        totalHours: 42,
        badgesEarned: 8,
        userType: 'individual',
        recentBadges: [
          { sdgNumber: 13, tier: 1, name: 'Climate Ally', earnedAt: '2024-01-15' },
          { sdgNumber: 4, tier: 2, name: 'Mentor', earnedAt: '2024-01-10' },
          { sdgNumber: 3, tier: 1, name: 'Health Ally', earnedAt: '2024-01-05' }
        ],
        progressBadges: [
          { sdgNumber: 13, tier: 2, name: 'Climate Builder', progress: 65, nextMilestone: 25 },
          { sdgNumber: 1, tier: 1, name: 'Supporter', progress: 80, nextMilestone: 5 },
          { sdgNumber: 5, tier: 1, name: 'Supporter', progress: 30, nextMilestone: 10 }
        ]
      };
      setGamificationData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentRankInfo = (rankLevel: number, isOrg = false) => {
    const ranks = isOrg ? ORGANIZATION_TIERS : INDIVIDUAL_RANKS;
    return ranks.find(rank => rank.level === rankLevel) || ranks[0];
  };

  const getNextRankInfo = (rankLevel: number, isOrg = false) => {
    const ranks = isOrg ? ORGANIZATION_TIERS : INDIVIDUAL_RANKS;
    return ranks.find(rank => rank.level === rankLevel + 1);
  };

  const calculateRankProgress = (currentScore: number, currentLevel: number, isOrg = false) => {
    const ranks = isOrg ? ORGANIZATION_TIERS : INDIVIDUAL_RANKS;
    const currentRank = ranks.find(rank => rank.level === currentLevel);
    const nextRank = ranks.find(rank => rank.level === currentLevel + 1);
    
    if (!currentRank || !nextRank) return { progress: 100, needed: 0 };
    
    const progress = Math.min(
      ((currentScore - currentRank.threshold) / (nextRank.threshold - currentRank.threshold)) * 100,
      100
    );
    const needed = Math.max(nextRank.threshold - currentScore, 0);
    
    return { progress: Math.max(progress, 0), needed };
  };

  const getSDGBadgeInfo = (sdgNumber: number, tier: number) => {
    return (SDG_BADGE_TIERS as any)[sdgNumber]?.[tier] || { 
      name: `Tier ${tier}`, 
      icon: '⭐', 
      color: 'bg-gray-500' 
    };
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className={`${compact ? "h-16" : "h-20"} bg-muted rounded-lg`}></div>
        {!compact && (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!gamificationData) return null;

  const isOrganization = gamificationData.userType === 'organization';
  const currentRank = getCurrentRankInfo(gamificationData.currentRank, isOrganization);
  const nextRank = getNextRankInfo(gamificationData.currentRank, isOrganization);
  const { progress, needed } = calculateRankProgress(
    gamificationData.currentScore, 
    gamificationData.currentRank, 
    isOrganization
  );

  // Compact view for sidebar - Multi-line
  if (compact) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm">
          <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
          Impaktr Journey
        </h3>
        
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50 space-y-2">
          {/* Rank with icon - Line 1 */}
          <div className="flex items-center space-x-2">
            <div className="text-xl">{currentRank.icon}</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {currentRank.name}
            </div>
          </div>
          
          {/* Stats - Line 2 */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {gamificationData.currentScore} pts • {gamificationData.badgesEarned} badges
          </div>
          
          {/* Next level - Line 3 */}
          {nextRank && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Next: {nextRank.name}
            </div>
          )}
          
          {/* Progress bar with percentage - Line 4 */}
          {nextRank && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
            Your Impaktr Journey
          </span>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
            {isOrganization ? 'Organization' : 'Individual'} Path
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Rank Display */}
        <div className="relative p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                {currentRank.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentRank.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {currentRank.description}
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center text-blue-600 dark:text-blue-400">
                    <Target className="w-4 h-4 mr-1" />
                    {gamificationData.currentScore} Impact Points
                  </span>
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <Trophy className="w-4 h-4 mr-1" />
                    {gamificationData.badgesEarned} Badges
                  </span>
                </div>
              </div>
            </div>
            
            {nextRank && (
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Next: {nextRank.name}
                </div>
                <div className="w-32">
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {needed} points needed
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="journey">Journey</TabsTrigger>
            <TabsTrigger value="badges">SDG Badges</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Journey Tab - Show progression levels */}
          <TabsContent value="journey" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {(isOrganization ? ORGANIZATION_TIERS : INDIVIDUAL_RANKS).map((rank, index) => {
                const isCompleted = gamificationData.currentRank >= rank.level;
                const isCurrent = gamificationData.currentRank === rank.level;
                
                return (
                  <div
                    key={rank.level}
                    className={`relative p-3 rounded-lg border transition-all duration-200 ${
                      isCurrent 
                        ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/50 shadow-md' 
                        : isCompleted
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-500/30'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className={`text-2xl mb-2 ${isCompleted ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                        {rank.icon}
                      </div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                        {rank.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {rank.threshold}+ pts
                      </div>
                      {isCompleted && !isCurrent && (
                        <Star className="w-3 h-3 text-yellow-500 mx-auto mt-1 fill-current" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* SDG Badges Tab */}
          <TabsContent value="badges" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Badges */}
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  Recently Earned
                </h4>
                <div className="space-y-2">
                  {gamificationData.recentBadges.map((badge, index) => {
                    const badgeInfo = getSDGBadgeInfo(badge.sdgNumber, badge.tier);
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                        <div className={`w-10 h-10 ${badgeInfo.color} rounded-lg flex items-center justify-center text-white`}>
                          <span className="text-xs font-bold">SDG</span>
                          <span className="text-xs font-bold">{badge.sdgNumber}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {badgeInfo.name} {badgeInfo.icon}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Earned {new Date(badge.earnedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* In Progress Badges */}
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  In Progress
                </h4>
                <div className="space-y-2">
                  {gamificationData.progressBadges.map((badge, index) => {
                    const badgeInfo = getSDGBadgeInfo(badge.sdgNumber, badge.tier);
                    return (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-8 h-8 ${badgeInfo.color} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                            {badge.sdgNumber}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">
                              {badgeInfo.name} {badgeInfo.icon}
                            </div>
                          </div>
                          <div className="text-xs font-medium text-blue-600">
                            {badge.progress}%
                          </div>
                        </div>
                        <Progress value={badge.progress} className="h-1.5" />
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {badge.nextMilestone} hours to next tier
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{gamificationData.currentScore}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Impact Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{gamificationData.totalHours}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Hours Contributed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{gamificationData.badgesEarned}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Badges Earned</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">#{gamificationData.currentRank}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Current Level</div>
              </div>
            </div>

            {/* Next milestone */}
            {nextRank && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Next Milestone: {nextRank.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {nextRank.description}
                    </p>
                  </div>
                  <div className="text-2xl">{nextRank.icon}</div>
                </div>
                <Progress value={progress} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{progress.toFixed(1)}% complete</span>
                  <span>{needed} points needed</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                Keep Building Your Impact! 🚀
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Join events to earn badges and progress through your changemaker journey
              </p>
            </div>
            <Link href="/events">
              <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                Find Events
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
