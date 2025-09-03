// home/ubuntu/impaktrweb/src/components/dashboard/ImpaktrScore.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Info, Award, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatScore } from '@/lib/utils';

interface ScoreBreakdown {
  hoursComponent: number;
  intensityComponent: number;
  skillComponent: number;
  qualityComponent: number;
  verificationComponent: number;
  locationComponent: number;
}

interface ImpaktrScoreData {
  currentScore: number;
  previousScore: number;
  breakdown: ScoreBreakdown;
  rank: string;
  nextRank: string;
  progressToNextRank: number;
  recentChanges: Array<{
    date: string;
    change: number;
    reason: string;
  }>;
}

export function ImpaktrScore() {
  const [scoreData, setScoreData] = useState<ImpaktrScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    fetchScoreData();
  }, []);

  const fetchScoreData = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await fetch('/api/users/score');
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockData: ImpaktrScoreData = {
        currentScore: 234.7,
        previousScore: 189.3,
        breakdown: {
          hoursComponent: 85.2,
          intensityComponent: 23.1,
          skillComponent: 31.4,
          qualityComponent: 42.8,
          verificationComponent: 28.7,
          locationComponent: 23.5,
        },
        rank: 'Contributor',
        nextRank: 'Builder',
        progressToNextRank: 67,
        recentChanges: [
          { date: '2024-01-15', change: 12.4, reason: 'Environmental cleanup verified' },
          { date: '2024-01-12', change: 8.7, reason: 'Education tutoring completed' },
          { date: '2024-01-10', change: 15.2, reason: 'Community garden project' },
        ]
      };
      
      setScoreData(mockData);
    } catch (error) {
      console.error('Error fetching score data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scoreData) {
    return null;
  }

  const scoreChange = scoreData.currentScore - scoreData.previousScore;
  const scoreChangePercentage = ((scoreChange / scoreData.previousScore) * 100).toFixed(1);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Your Impaktr Score™
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            <Info className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {/* Main Score Display */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="text-5xl font-bold brand-gradient-text mb-2">
              {formatScore(scoreData.currentScore)}
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm">
            <TrendingUp className={`w-4 h-4 ${scoreChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              {scoreChange >= 0 ? '+' : ''}{scoreChange.toFixed(1)} ({scoreChangePercentage}%)
            </span>
            <span className="text-muted-foreground">this month</span>
          </div>
        </div>

        {/* Current Rank & Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="mb-1">
                Current Rank
              </Badge>
              <h3 className="font-semibold text-lg">{scoreData.rank}</h3>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Next: {scoreData.nextRank}</div>
              <div className="text-sm font-medium">{scoreData.progressToNextRank}% complete</div>
            </div>
          </div>
          
          <Progress value={scoreData.progressToNextRank} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Keep participating in verified activities to reach {scoreData.nextRank}
          </p>
        </div>

        {/* Score Breakdown */}
        {showBreakdown && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <h4 className="font-medium text-sm flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Score Breakdown
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hours Impact:</span>
                <span className="font-medium">{scoreData.breakdown.hoursComponent.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intensity:</span>
                <span className="font-medium">{scoreData.breakdown.intensityComponent.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skills Applied:</span>
                <span className="font-medium">{scoreData.breakdown.skillComponent.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality Rating:</span>
                <span className="font-medium">{scoreData.breakdown.qualityComponent.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verification:</span>
                <span className="font-medium">{scoreData.breakdown.verificationComponent.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location Factor:</span>
                <span className="font-medium">{scoreData.breakdown.locationComponent.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Changes */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Recent Score Changes
          </h4>
          
          <div className="space-y-2">
            {scoreData.recentChanges.slice(0, 3).map((change, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/20">
                <div className="flex-1">
                  <div className="text-sm font-medium">{change.reason}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(change.date).toLocaleDateString()}
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  change.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change.change >= 0 ? '+' : ''}{change.change.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}