// home/ubuntu/impaktrweb/src/components/profile/ImpactStatistics.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Award, 
  Users, 
  Target,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Zap,
  Building2,
  GraduationCap,
  Crown,
  Medal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatHours, formatScore, getSDGName, getSDGColor } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, TooltipProps } from 'recharts';

interface ImpactStatisticsProps {
  userId: string;
}

// Custom Tooltip component with dark mode support
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        {label && (
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        )}
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold text-gray-900 dark:text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for SDG Distribution
const SDGDistributionTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as { sdgNumber: number; percentage: number };
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          SDG {data.sdgNumber}: <span style={{ color: payload[0].color }}>{data.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

interface StatisticsData {
  overview: {
    totalHours: number;
    verifiedHours: number;
    totalEvents: number;
    badgesEarned: number;
    impaktrScore: number;
    currentRank: string;
    rankProgress: number;
    joinedDate: string;
  };
  monthlyActivity: Array<{
    month: string;
    hours: number;
    events: number;
    score: number;
  }>;
  sdgDistribution: Array<{
    sdgNumber: number;
    hours: number;
    events: number;
    percentage: number;
  }>;
  organizationImpact: Array<{
    id: string;
    name: string;
    logo: string | null;
    hours: number;
    events: number;
    score: number;
    lastParticipated: string | null;
  }>;
  topEvents: Array<{
    id: string;
    title: string;
    hours: number;
    score: number;
    date: string | null;
    organization: { id: string; name: string; logo: string | null } | null;
    sdg: number | null;
  }>;
  scoreProgression: Array<{
    date: string;
    score: number;
    change: number;
    reason: string;
  }>;
  skillsImpact: Array<{
    skill: string;
    hours: number;
    multiplier: number;
    events: number;
  }>;
  achievements: Array<{
    id: string;
    type: string;
    name: string;
    earnedAt: string;
    points: number;
  }>;
  compareToAverage: {
    hoursVsAverage: number;
    scoreVsAverage: number;
    rankPercentile: number;
  };
  eventTypes?: Array<{
    type: string;
    count: number;
    hours: number;
  }>;
  topSkills?: Array<{
    skill: string;
    hours: number;
  }>;
  monthlyHours?: Array<{
    month: string;
    hours: number;
  }>;
}

export function ImpactStatistics({ userId }: ImpactStatisticsProps) {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [activeChart, setActiveChart] = useState('overview');

  const fetchStatistics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/statistics?range=${timeRange}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Statistics API error:', response.status, errorData);
        throw new Error(`Failed to fetch statistics: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      const data = await response.json();
      
      setData(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Fallback mock data if API fails
      const mockData: StatisticsData = {
        overview: {
          totalHours: 147.5,
          verifiedHours: 134.2,
          totalEvents: 23,
          badgesEarned: 12,
          impaktrScore: 234.7,
          currentRank: 'Contributor',
          rankProgress: 67,
          joinedDate: '2023-08-15'
        },
        monthlyActivity: [
          { month: 'Jan', hours: 8, events: 2, score: 45 },
          { month: 'Feb', hours: 12, events: 3, score: 67 },
          { month: 'Mar', hours: 15, events: 4, score: 89 },
          { month: 'Apr', hours: 18, events: 3, score: 102 },
          { month: 'May', hours: 22, events: 5, score: 134 },
          { month: 'Jun', hours: 25, events: 4, score: 156 },
          { month: 'Jul', hours: 19, events: 3, score: 178 },
          { month: 'Aug', hours: 16, events: 2, score: 198 },
          { month: 'Sep', hours: 24, events: 4, score: 220 },
          { month: 'Oct', hours: 28, events: 5, score: 245 },
          { month: 'Nov', hours: 20, events: 3, score: 268 },
          { month: 'Dec', hours: 18, events: 2, score: 285 }
        ],
        sdgDistribution: [
          { sdgNumber: 13, hours: 45.2, events: 8, percentage: 32 },
          { sdgNumber: 4, hours: 38.1, events: 6, percentage: 27 },
          { sdgNumber: 1, hours: 25.3, events: 4, percentage: 18 },
          { sdgNumber: 3, hours: 18.7, events: 3, percentage: 13 },
          { sdgNumber: 11, hours: 12.4, events: 2, percentage: 10 }
        ],
        organizationImpact: [],
        topEvents: [],
        scoreProgression: [],
        skillsImpact: [
          { skill: 'Teaching', hours: 42.5, multiplier: 1.3, events: 6 },
          { skill: 'Project Management', hours: 28.3, multiplier: 1.4, events: 4 },
          { skill: 'Public Speaking', hours: 18.7, multiplier: 1.2, events: 3 },
          { skill: 'Photography', hours: 15.2, multiplier: 1.1, events: 2 },
          { skill: 'Translation', hours: 12.8, multiplier: 1.3, events: 2 }
        ],
        achievements: [
          { id: '1', type: 'milestone', name: '100 Hours Milestone', earnedAt: '2024-01-15', points: 50 },
          { id: '2', type: 'badge', name: 'Climate Action Champion', earnedAt: '2024-01-10', points: 25 },
          { id: '3', type: 'rank', name: 'Promoted to Contributor', earnedAt: '2024-01-05', points: 100 },
          { id: '4', type: 'streak', name: '30-Day Activity Streak', earnedAt: '2023-12-28', points: 30 }
        ],
        compareToAverage: {
          hoursVsAverage: 145, // 145% of average
          scoreVsAverage: 132, // 132% of average
          rankPercentile: 78 // 78th percentile
        }
      };
      
      setData(mockData);
    } finally {
      setIsLoading(false);
    }
  }, [userId, timeRange]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Impact Analytics</h2>
          <p className="text-muted-foreground">
            Your detailed social impact analytics and insights
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Time Range Summary Cards - showing stats for the selected time period */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hours (Period)</p>
                <p className="text-2xl font-bold">{formatHours(data.overview.totalHours)}</p>
                <p className="text-xs text-muted-foreground mt-1">Verified: {formatHours(data.overview.verifiedHours)}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Events (Period)</p>
                <p className="text-2xl font-bold">{data.overview.totalEvents}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeRange === 'all' ? 'All time' : `Last ${timeRange.replace('months', ' months').replace('month', ' month')}`}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Badges (Period)</p>
                <p className="text-2xl font-bold">{data.overview.badgesEarned}</p>
                <p className="text-xs text-muted-foreground mt-1">Earned in period</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Rank</p>
                <p className="text-2xl font-bold">{data.overview.currentRank}</p>
                <p className="text-xs text-muted-foreground mt-1">{Math.round(data.overview.rankProgress)}% to next</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Pills Navigation */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeChart === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveChart('overview')}
          className={`rounded-full px-6 py-2 ${
            activeChart === 'overview' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Activity Trends
        </Button>
        <Button
          variant={activeChart === 'sdg' ? 'default' : 'outline'}
          onClick={() => setActiveChart('sdg')}
          className={`rounded-full px-6 py-2 ${
            activeChart === 'sdg' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          SDG Distribution
        </Button>
        <Button
          variant={activeChart === 'organizations' ? 'default' : 'outline'}
          onClick={() => setActiveChart('organizations')}
          className={`rounded-full px-6 py-2 ${
            activeChart === 'organizations' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Organizations
        </Button>
        <Button
          variant={activeChart === 'events' ? 'default' : 'outline'}
          onClick={() => setActiveChart('events')}
          className={`rounded-full px-6 py-2 ${
            activeChart === 'events' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Top Events
        </Button>
        <Button
          variant={activeChart === 'progression' ? 'default' : 'outline'}
          onClick={() => setActiveChart('progression')}
          className={`rounded-full px-6 py-2 ${
            activeChart === 'progression' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Score Progress
        </Button>
        <Button
          variant={activeChart === 'skills' ? 'default' : 'outline'}
          onClick={() => setActiveChart('skills')}
          className={`rounded-full px-6 py-2 ${
            activeChart === 'skills' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Skills Impact
        </Button>
      </div>

      {/* Chart Content */}
      <div className="space-y-4">
        {activeChart === 'overview' && (
          <>
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Monthly Activity Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        content={<CustomTooltip />}
                        formatter={(value, name) => [
                          name === 'hours' ? formatHours(value as number) : value,
                          name === 'hours' ? 'Hours' : name === 'events' ? 'Events' : 'Score'
                        ]}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="hours" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Line yAxisId="right" type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Hours Volunteered Over Time */}
            {data.monthlyHours && data.monthlyHours.length > 0 ? (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Hours Volunteered Over Time
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Your volunteering activity over time
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={data.monthlyHours}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        fill="url(#colorHours)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Hours Volunteered Over Time
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Your volunteering activity over time
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-600 dark:text-gray-400 opacity-50" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No hourly data available for the selected time period.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          </>
        )}

        {activeChart === 'sdg' && (
          <>
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  SDG Impact Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.sdgDistribution && data.sdgDistribution.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={data.sdgDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="percentage"
                          >
                            {data.sdgDistribution.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getSDGColor(entry.sdgNumber)} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={<SDGDistributionTooltip />}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  
                  <div className="space-y-3">
                    {data.sdgDistribution.map((sdg) => (
                      <div key={sdg.sdgNumber} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant="sdg" 
                            sdgNumber={sdg.sdgNumber}
                            className="text-xs"
                          >
                            {sdg.sdgNumber}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">{getSDGName(sdg.sdgNumber)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatHours(sdg.hours)} • {sdg.events} events
                            </p>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {sdg.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No SDG distribution data available for the selected time period.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Complete verified events with SDG tags to see your impact distribution.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          </>
        )}

        {activeChart === 'organizations' && (
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Organizations Impact</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your volunteer contributions by organization
              </p>
            </CardHeader>
            <CardContent>
              {data.organizationImpact && data.organizationImpact.length > 0 ? (
                <div className="space-y-4">
                  {data.organizationImpact.map((org) => (
                    <div key={org.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {org.logo && (
                            <Image 
                              src={org.logo} 
                              alt={org.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <Link href={`/organizations/${org.id}`}>
                              <h4 className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                {org.name}
                              </h4>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold"
                              >
                                {org.events} {org.events === 1 ? 'event' : 'events'}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 font-semibold"
                              >
                                {formatHours(org.hours)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {org.score.toFixed(1)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Impact Score</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-600 dark:text-gray-400 opacity-50" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No organization data available for the selected time period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeChart === 'events' && (
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Top Events</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your most impactful volunteer events
              </p>
            </CardHeader>
            <CardContent>
              {data.topEvents && data.topEvents.length > 0 ? (
                <div className="space-y-2">
                  {data.topEvents.map((event, index) => {
                    const rank = index + 1;
                    
                    // Get rank badge
                    const getRankBadge = () => {
                      if (rank === 1) {
                        return (
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold text-lg shadow-lg">
                            <Crown className="h-6 w-6" />
                          </div>
                        );
                      }
                      if (rank === 2) {
                        return (
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white font-bold text-lg shadow-lg">
                            <Medal className="h-6 w-6" />
                          </div>
                        );
                      }
                      if (rank === 3) {
                        return (
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-lg shadow-lg">
                            <Award className="h-6 w-6" />
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-lg">
                          #{rank}
                        </div>
                      );
                    };
                    
                    // Get rank-specific styling
                    const getRankStyling = () => {
                      if (rank === 1) {
                        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-400 dark:border-yellow-600 hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-900/30 dark:hover:to-yellow-800/30';
                      }
                      if (rank === 2) {
                        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-2 border-gray-400 dark:border-gray-600 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800/70 dark:hover:to-gray-700/70';
                      }
                      if (rank === 3) {
                        return 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-400 dark:border-orange-600 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30';
                      }
                      return 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700';
                    };
                    
                    return (
                      <div
                        key={event.id}
                        className={`flex items-center justify-between p-4 rounded-lg transition-all ${getRankStyling()}`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          {getRankBadge()}
                          <div className="flex-1">
                            <Link href={`/events/${event.id}`}>
                              <h4 className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer mb-1">
                                {event.title}
                              </h4>
                            </Link>
                            {event.organization && (
                              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <Building2 className="w-3 h-3 mr-1" />
                                {event.organization.name}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatHours(event.hours)}
                              </span>
                              {event.date && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(event.date).toLocaleDateString('en-US', { 
                                      month: 'long', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {event.score.toFixed(1)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Impact Score</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600 dark:text-gray-400 opacity-50" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No event data available for the selected time period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeChart === 'progression' && (
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Score Progression</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your impact score growth over time
              </p>
            </CardHeader>
            <CardContent>
              {data.scoreProgression && data.scoreProgression.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.scoreProgression}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        content={<CustomTooltip />}
                        formatter={(value: number) => [value.toFixed(1), 'Score']}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#scoreGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No score progression data available yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Complete verified events to see your score grow!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeChart === 'skills' && (
          <>
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Skills Impact Analysis</CardTitle>
                <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        What This Means:
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                        This shows the skills you&apos;ve used while volunteering and how they impact your score. 
                        When your skills match an event&apos;s requirements, you earn up to <strong>40% more points </strong> 
                        for the same hours worked. This rewards skilled volunteers and helps showcase your 
                        professional development.
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                        <strong>Why It Matters:</strong> Adding skills to your profile and volunteering 
                        for skill-matched events helps you maximize your impact score while building your 
                        professional portfolio.
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.skillsImpact.map((skill, index) => (
                    <div key={skill.skill} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{skill.skill}</h4>
                        <Badge 
                          variant="outline" 
                          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 hover:from-purple-600 hover:to-pink-700 font-semibold"
                        >
                          {skill.multiplier}x multiplier
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Hours</p>
                          <p className="font-medium">{formatHours(skill.hours)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Events</p>
                          <p className="font-medium">{skill.events}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Impact Score</p>
                          <p className="font-medium">
                            {Math.round(skill.hours * skill.multiplier)}
                          </p>
                        </div>
                      </div>
                      
                      <Progress 
                        value={(skill.hours / data.overview.totalHours) * 100} 
                        className="mt-2 h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Skills Developed */}
            {data.topSkills && data.topSkills.length > 0 ? (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Top Skills Developed
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Skills you&apos;ve gained through volunteering activities
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {data.topSkills.map((skill, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900 dark:text-white">{skill.skill}</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">{skill.hours}h</span>
                        </div>
                        <div className="relative">
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((skill.hours / (data.topSkills?.[0]?.hours || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Top Skills Developed
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Skills you&apos;ve gained through volunteering activities
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-600 dark:text-gray-400 opacity-50" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No skills data available for the selected time period.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}