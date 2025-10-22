'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Award, 
  Calendar, 
  Clock, 
  Target, 
  Share2, 
  Download, 
  ExternalLink,
  TrendingUp,
  CheckCircle,
  Star,
  Trophy,
  Zap
} from 'lucide-react';
import { getSDGById } from '@/constants/sdgs';

interface SDGCredential {
  sdgNumber: number;
  currentTier: number;
  totalHours: number;
  totalActivities: number;
  progress: number;
  earnedTiers: number[];
  lastEarned?: string;
  nextMilestone?: {
    hoursNeeded: number;
    activitiesNeeded: number;
    tierName: string;
  };
}

interface SDGCredentialCardProps {
  credential: SDGCredential;
  onShare?: (credential: SDGCredential) => void;
  onViewDetails?: (credential: SDGCredential) => void;
  compact?: boolean;
}

// SDG Badge tier definitions with themed names and colors
const SDG_TIER_INFO = {
  1: { name: 'Ally', icon: '🌱', color: '#22c55e', bgColor: '#dcfce7' },
  2: { name: 'Builder', icon: '🔨', color: '#3b82f6', bgColor: '#dbeafe' },
  3: { name: 'Champion', icon: '🏆', color: '#8b5cf6', bgColor: '#ede9fe' },
  4: { name: 'Guardian', icon: '🛡️', color: '#f59e0b', bgColor: '#fef3c7' }
};

const SDG_SPECIFIC_NAMES = {
  1: ['Supporter', 'Advocate', 'Builder', 'Poverty Fighter'],
  2: ['Food Giver', 'Nourisher', 'Hunger Solver', 'Food Security Leader'],
  3: ['Health Ally', 'Health Advocate', 'Health Champion', 'Health Guardian'],
  4: ['Tutor', 'Mentor', 'Knowledge Builder', 'Education Leader'],
  5: ['Supporter', 'Equalizer', 'Advocate', 'Justice Leader'],
  13: ['Climate Ally', 'Climate Builder', 'Climate Champion', 'Climate Guardian']
};

export function SDGCredentialCard({ credential, onShare, onViewDetails, compact = false }: SDGCredentialCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const sdg = getSDGById(credential.sdgNumber);
  
  if (!sdg) return null;

  const currentTierInfo = SDG_TIER_INFO[credential.currentTier as keyof typeof SDG_TIER_INFO] || SDG_TIER_INFO[1];
  const isEarned = credential.earnedTiers.includes(credential.currentTier);
  const specificNames = SDG_SPECIFIC_NAMES[credential.sdgNumber as keyof typeof SDG_SPECIFIC_NAMES];
  const badgeName = specificNames ? specificNames[credential.currentTier - 1] : `${sdg.title} ${currentTierInfo.name}`;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleShare = () => {
    if (onShare) {
      onShare(credential);
    }
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {/* SDG Icon */}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
              style={{ backgroundColor: sdg.color }}
            >
              SDG {sdg.id}
            </div>

            <div className="flex-1">
              {/* Badge Name */}
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {badgeName}
                </h4>
                {isEarned && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>

              {/* Progress or Achievement Date */}
              {isEarned ? (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Earned {formatDate(credential.lastEarned)}
                </div>
              ) : (
                <div className="space-y-1">
                  <Progress value={credential.progress} className="h-1.5" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {credential.progress}% complete
                  </div>
                </div>
              )}
            </div>

            {isEarned && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
              >
                <Share2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-300 border-2 ${
        isEarned 
          ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-950/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* SDG Badge */}
            <div
              className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg"
              style={{ backgroundColor: sdg.color }}
            >
              <div className="text-xs">SDG</div>
              <div className="text-xl leading-none">{sdg.id}</div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {badgeName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sdg.title}
              </p>
              
              {/* Tier Badge */}
              <div className="flex items-center space-x-2 mt-2">
                <Badge 
                  className="text-xs px-2 py-1 font-medium"
                  style={{ 
                    backgroundColor: currentTierInfo.bgColor,
                    color: currentTierInfo.color,
                    border: `1px solid ${currentTierInfo.color}20`
                  }}
                >
                  {currentTierInfo.icon} Tier {credential.currentTier}
                </Badge>
                {isEarned && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs px-2 py-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Earned
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {isEarned && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Certificate
                </Button>
              </>
            )}
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(credential)}
                className="text-gray-600 hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Achievement Details */}
        {isEarned ? (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800 dark:text-green-400">
                  Achievement Unlocked!
                </span>
              </div>
              {credential.lastEarned && (
                <div className="text-sm text-green-700 dark:text-green-300 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(credential.lastEarned)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-green-800 dark:text-green-300">
                  {credential.totalHours} hours contributed
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-green-800 dark:text-green-300">
                  {credential.totalActivities} activities completed
                </span>
              </div>
            </div>

            {/* Next Tier Preview */}
            {credential.currentTier < 4 && (
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="text-xs text-green-700 dark:text-green-300 mb-1">
                  Next Goal: {specificNames ? specificNames[credential.currentTier] : `${sdg.title} ${SDG_TIER_INFO[credential.currentTier + 1 as keyof typeof SDG_TIER_INFO]?.name}`}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Need {credential.nextMilestone?.hoursNeeded || 0} more hours, {credential.nextMilestone?.activitiesNeeded || 0} more activities
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Section */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800 dark:text-blue-400">
                    Progress to {badgeName}
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {credential.progress}%
                </span>
              </div>

              <Progress value={credential.progress} className="h-2 mb-3" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 dark:text-blue-300">
                    {credential.totalHours} / {credential.nextMilestone?.hoursNeeded || 5} hours
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 dark:text-blue-300">
                    {credential.totalActivities} / {credential.nextMilestone?.activitiesNeeded || 1} activities
                  </span>
                </div>
              </div>

              {credential.nextMilestone && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Keep going! You need {credential.nextMilestone.hoursNeeded - credential.totalHours} more hours to unlock this badge.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Earned Tiers History */}
        {credential.earnedTiers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Achievement History
            </div>
            <div className="flex space-x-2">
              {credential.earnedTiers.map((tier) => {
                const tierInfo = SDG_TIER_INFO[tier as keyof typeof SDG_TIER_INFO];
                return (
                  <div
                    key={tier}
                    className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs"
                  >
                    <span>{tierInfo?.icon}</span>
                    <span className="text-gray-700 dark:text-gray-300">Tier {tier}</span>
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}






