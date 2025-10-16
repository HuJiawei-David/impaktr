// home/ubuntu/impaktrweb/src/components/profile/ImpactStatistics.tsx

'use client';

import React, { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatHours, formatScore, getSDGName, getSDGColor } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface ImpactStatisticsProps {
  userId: string;
}

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
  activityTypes: Array<{
    type: string;
    hours: number;
    count: number;
    color: string;
  }>;
  verificationBreakdown: Array<{
    type: string;
    count: number;
    percentage: number;
    color: string;
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
}

export function ImpactStatistics({ userId }: ImpactStatisticsProps) {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12months');
  const [activeChart, setActiveChart] = useState('overview');

  useEffect(() => {
    fetchStatistics();
  }, [userId, timeRange]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      // Replace with actual API call
      // const response = await fetch(`/api/users/${userId}/statistics?range=${timeRange}`);
      // const data = await response.json();
      
      // Mock data for demonstration
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
        activityTypes: [
          { type: 'Environmental Cleanup', hours: 52.5, count: 8, color: '#22c55e' },
          { type: 'Education & Tutoring', hours: 38.2, count: 6, color: '#3b82f6' },
          { type: 'Community Service', hours: 31.8, count: 5, color: '#f59e0b' },
          { type: 'Healthcare Support', hours: 18.7, count: 3, color: '#ef4444' },
          { type: 'Food Distribution', hours: 12.3, count: 2, color: '#8b5cf6' }
        ],
        verificationBreakdown: [
          { type: 'Organizer Verified', count: 15, percentage: 65, color: '#10b981' },
          { type: 'Peer Verified', count: 5, percentage: 22, color: '#3b82f6' },
          { type: 'GPS Verified', count: 2, percentage: 9, color: '#f59e0b' },
          { type: 'Self Reported', count: 1, percentage: 4, color: '#6b7280' }
        ],
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
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
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
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Statistics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Impact Statistics</h2>
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
            <SelectItem value="12months">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{formatHours(data.overview.totalHours)}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Events Joined</p>
                <p className="text-2xl font-bold">{data.overview.totalEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
                <p className="text-2xl font-bold">{data.overview.badgesEarned}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impaktr Score</p>
                <p className="text-2xl font-bold">{formatScore(data.overview.impaktrScore)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance vs Average */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {data.compareToAverage.hoursVsAverage}%
              </div>
              <p className="text-sm text-muted-foreground">vs Average Hours</p>
              <Progress value={Math.min(data.compareToAverage.hoursVsAverage, 200)} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {data.compareToAverage.scoreVsAverage}%
              </div>
              <p className="text-sm text-muted-foreground">vs Average Score</p>
              <Progress value={Math.min(data.compareToAverage.scoreVsAverage, 200)} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {data.compareToAverage.rankPercentile}th
              </div>
              <p className="text-sm text-muted-foreground">Percentile</p>
              <Progress value={data.compareToAverage.rankPercentile} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

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
          variant={activeChart === 'verification' ? 'default' : 'outline'}
          onClick={() => setActiveChart('verification')}
          className={`rounded-full px-6 py-2 ${
            activeChart === 'verification' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Verification
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
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity Overview</CardTitle>
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
        )}

        {activeChart === 'sdg' && (
          <Card>
            <CardHeader>
              <CardTitle>SDG Impact Distribution</CardTitle>
            </CardHeader>
            <CardContent>
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
                        formatter={(value) => [`${value}%`, 'Impact Share']}
                        labelFormatter={(sdgNumber) => getSDGName(sdgNumber as number)}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3">
                  {data.sdgDistribution.map((sdg) => (
                    <div key={sdg.sdgNumber} className="flex items-center justify-between">
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
            </CardContent>
          </Card>
        )}

        {activeChart === 'verification' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={data.verificationBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="percentage"
                      >
                        {data.verificationBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.activityTypes.map((activity) => (
                    <div key={activity.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{activity.type}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatHours(activity.hours)}
                        </span>
                      </div>
                      <Progress 
                        value={(activity.hours / data.overview.totalHours) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        {activity.count} events
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeChart === 'skills' && (
          <Card>
            <CardHeader>
              <CardTitle>Skills Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.skillsImpact.map((skill, index) => (
                  <div key={skill.skill} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{skill.skill}</h4>
                      <Badge variant="outline">
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
        )}
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {achievement.type === 'milestone' && <Target className="w-5 h-5 text-primary" />}
                    {achievement.type === 'badge' && <Award className="w-5 h-5 text-yellow-500" />}
                    {achievement.type === 'rank' && <TrendingUp className="w-5 h-5 text-green-500" />}
                    {achievement.type === 'streak' && <Zap className="w-5 h-5 text-orange-500" />}
                  </div>
                  
                  <div>
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <Badge variant="secondary">
                  +{achievement.points} points
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}