// home/ubuntu/impaktrweb/src/components/organization/ESGDashboard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Leaf, Users as UsersIcon, Scale, Plus, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ESGMetric {
  id: string;
  category: string;
  metricName: string;
  value: number;
  unit: string;
  period: string;
  reportedAt: string;
}

interface ESGScores {
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}

interface ESGDashboardProps {
  organizationId: string;
  currentScore: number;
}

export default function ESGDashboard({ organizationId, currentScore }: ESGDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-Q4');
  const [metrics, setMetrics] = useState<ESGMetric[]>([]);
  const [scores, setScores] = useState<ESGScores>({
    environmental: 0,
    social: 0,
    governance: 0,
    overall: currentScore,
  });
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Generate period options
  const periods = [];
  const currentYear = 2024;
  const currentQuarter = 4;
  for (let year = currentYear; year >= currentYear - 2; year--) {
    for (let q = 4; q >= 1; q--) {
      if (year === currentYear && q > currentQuarter) continue;
      periods.push(`${year}-Q${q}`);
    }
  }

  const loadMockData = useCallback(() => {
    // Mock ESG data for demonstration
    setScores({
      environmental: 78,
      social: 82,
      governance: 75,
      overall: 78.3,
    });

    setMetrics([
      {
        id: '1',
        category: 'environmental',
        metricName: 'Carbon Emissions',
        value: 1250,
        unit: 'tons CO₂',
        period: selectedPeriod,
        reportedAt: new Date().toISOString(),
      },
      {
        id: '2',
        category: 'environmental',
        metricName: 'Renewable Energy Usage',
        value: 65,
        unit: '%',
        period: selectedPeriod,
        reportedAt: new Date().toISOString(),
      },
      {
        id: '3',
        category: 'social',
        metricName: 'Employee Satisfaction',
        value: 4.2,
        unit: '/5',
        period: selectedPeriod,
        reportedAt: new Date().toISOString(),
      },
      {
        id: '4',
        category: 'social',
        metricName: 'Community Investment',
        value: 125000,
        unit: 'USD',
        period: selectedPeriod,
        reportedAt: new Date().toISOString(),
      },
      {
        id: '5',
        category: 'governance',
        metricName: 'Board Independence',
        value: 70,
        unit: '%',
        period: selectedPeriod,
        reportedAt: new Date().toISOString(),
      },
      {
        id: '6',
        category: 'governance',
        metricName: 'Ethics Training Completion',
        value: 94,
        unit: '%',
        period: selectedPeriod,
        reportedAt: new Date().toISOString(),
      },
    ]);
  }, [selectedPeriod]);

  const fetchESGMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/esg?period=${selectedPeriod}`);
      
      if (!response.ok) {
        // Use mock data if API not ready
        loadMockData();
        return;
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setScores({
        ...data.scores,
        overall: data.scores?.overall ?? currentScore
      });
    } catch (error) {
      console.error('Failed to fetch ESG metrics:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, loadMockData, currentScore]);

  useEffect(() => {
    fetchESGMetrics();
  }, [fetchESGMetrics]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const categoryMetrics = (category: string) => 
    metrics?.filter(m => m.category === category) || [];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ESG Performance</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your Environmental, Social, and Governance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map(period => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowSubmitForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Metrics
          </Button>
        </div>
      </div>

      {/* ESG Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall ESG Score</p>
            <p className={`text-4xl font-bold ${getScoreColor(scores.overall || 0)}`}>
              {(scores.overall || 0).toFixed(1)}
            </p>
            <Progress value={scores.overall || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Leaf className="h-8 w-8 mx-auto mb-3 text-green-600 dark:text-green-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Environmental</p>
            <p className={`text-4xl font-bold ${getScoreColor(scores.environmental)}`}>
              {scores.environmental}
            </p>
            <Progress 
              value={scores.environmental} 
              className={`mt-3 h-2 ${getProgressColor(scores.environmental)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <UsersIcon className="h-8 w-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Social</p>
            <p className={`text-4xl font-bold ${getScoreColor(scores.social)}`}>
              {scores.social}
            </p>
            <Progress 
              value={scores.social} 
              className={`mt-3 h-2 ${getProgressColor(scores.social)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Scale className="h-8 w-8 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Governance</p>
            <p className={`text-4xl font-bold ${getScoreColor(scores.governance)}`}>
              {scores.governance}
            </p>
            <Progress 
              value={scores.governance} 
              className={`mt-3 h-2 ${getProgressColor(scores.governance)}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environmental Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <span>Environmental</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryMetrics('environmental').map(metric => (
              <div key={metric.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.metricName}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {metric.value.toLocaleString()} {metric.unit}
                  </span>
                </div>
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600"
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Social Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UsersIcon className="h-5 w-5 text-blue-600" />
              <span>Social</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryMetrics('social').map(metric => (
              <div key={metric.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.metricName}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {metric.value.toLocaleString()} {metric.unit}
                  </span>
                </div>
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600"
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Governance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scale className="h-5 w-5 text-purple-600" />
              <span>Governance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryMetrics('governance').map(metric => (
              <div key={metric.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.metricName}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {metric.value.toLocaleString()} {metric.unit}
                  </span>
                </div>
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600"
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  />
                  </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
{/* Trend Chart */}
<Card>
    <CardHeader>
      <CardTitle>ESG Score Trends</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64 flex items-end justify-between space-x-2">
        {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, idx) => {
          const height = 50 + (idx * 10);
          return (
            <div key={quarter} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center space-y-1">
                <div 
                  className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}px` }}
                />
                <div 
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height + 5}px` }}
                />
                <div 
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height - 5}px` }}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                2024-{quarter}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-600 rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Environmental</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Social</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-600 rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Governance</span>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
);
}