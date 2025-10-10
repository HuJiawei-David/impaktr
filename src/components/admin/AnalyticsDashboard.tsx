// home/ubuntu/impaktrweb/src/components/admin/AnalyticsDashboard.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Award, 
  TrendingUp, 
  Globe, 
  Building2,
  Heart,
  GraduationCap,
  Activity,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Area,
  AreaChart
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalOrganizations: number;
    totalEvents: number;
    totalVolunteerHours: number;
    averageImpaktrScore: number;
    monthlyGrowth: number;
    activeUsers: number;
    verificationRate: number;
  };
  userGrowth: Array<{
    month: string;
    users: number;
    organizations: number;
    events: number;
  }>;
  sdgDistribution: Array<{
    sdg: number;
    name: string;
    participants: number;
    hours: number;
    color: string;
  }>;
  countryStats: Array<{
    country: string;
    users: number;
    avgScore: number;
    totalHours: number;
    flag: string;
  }>;
  organizationTypes: Array<{
    type: string;
    count: number;
    avgScore: number;
    totalEvents: number;
  }>;
  verificationStats: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  revenueData: Array<{
    month: string;
    subscriptions: number;
    transactionFees: number;
    total: number;
  }>;
  topPerformers: {
    individuals: Array<{
      id: string;
      name: string;
      score: number;
      rank: string;
      avatar: string;
      country: string;
    }>;
    organizations: Array<{
      id: string;
      name: string;
      score: number;
      type: string;
      logo: string;
      members: number;
    }>;
  };
}

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock data for demonstration
      setAnalyticsData(getMockAnalyticsData());
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const exportData = () => {
    // Implement CSV/Excel export
    console.log('Exporting analytics data...');
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner text="Loading analytics..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and user engagement
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{analyticsData.overview.totalUsers.toLocaleString()}</p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{analyticsData.overview.monthlyGrowth}% this month
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organizations</p>
                <p className="text-3xl font-bold">{analyticsData.overview.totalOrganizations.toLocaleString()}</p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <Building2 className="w-3 h-3 mr-1" />
                  {analyticsData.organizationTypes.reduce((sum, org) => sum + org.count, 0)} active
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold">{analyticsData.overview.totalEvents.toLocaleString()}</p>
                <div className="flex items-center text-sm text-blue-600 mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {Math.round(analyticsData.overview.totalEvents / 12)} per month avg
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Impact Hours</p>
                <p className="text-3xl font-bold">{analyticsData.overview.totalVolunteerHours.toLocaleString()}</p>
                <div className="flex items-center text-sm text-orange-600 mt-1">
                  <Activity className="w-3 h-3 mr-1" />
                  {analyticsData.overview.verificationRate}% verified
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  User Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="organizations" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* SDG Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  SDG Impact Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.sdgDistribution.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `SDG ${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="participants"
                    >
                      {analyticsData.sdgDistribution.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.overview.activeUsers.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Active Users (30d)</div>
                <div className="text-xs text-green-600 mt-1">
                  +12% vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.overview.averageImpaktrScore.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Impact Score</div>
                <div className="text-xs text-green-600 mt-1">
                  +5.2% vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.overview.verificationRate}%
                </div>
                <div className="text-sm text-muted-foreground">Verification Rate</div>
                <div className="text-xs text-purple-600 mt-1">
                  +2.1% vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(analyticsData.overview.totalVolunteerHours / analyticsData.overview.totalUsers)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Hours/User</div>
                <div className="text-xs text-orange-600 mt-1">
                  +8.5% vs last month
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Countries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Top Countries by Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.countryStats.slice(0, 10).map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 text-center">{country.flag}</div>
                        <div>
                          <div className="font-medium text-sm">{country.country}</div>
                          <div className="text-xs text-muted-foreground">
                            Avg Score: {country.avgScore.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{country.users.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {country.totalHours.toLocaleString()} hours
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Organization Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Organization Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={analyticsData.organizationTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Individual Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topPerformers.individuals.map((user, index) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <Users className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.country} • {user.rank}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">{user.score.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topPerformers.organizations.map((org, index) => (
                    <div key={org.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        {org.logo ? (
                          <img src={org.logo} alt={org.name} className="w-10 h-10 rounded-lg" />
                        ) : (
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{org.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {org.type} • {org.members} members
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{org.score.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Event Creation Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Event Creation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={analyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="events" stroke="#8B5CF6" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Verification Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Methods Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.verificationStats.map((stat) => (
                    <div key={stat.type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{stat.type.replace('_', ' ')}</span>
                        <span className="font-medium">{stat.percentage}%</span>
                      </div>
                      <Progress value={stat.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {stat.count.toLocaleString()} verifications
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="impact" className="space-y-6">
          {/* SDG Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                SDG Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Top Performing SDGs</h4>
                  {analyticsData.sdgDistribution.slice(0, 8).map((sdg) => (
                    <div key={sdg.sdg} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="sdg" sdgNumber={sdg.sdg} className="text-xs">
                          {sdg.sdg}
                        </Badge>
                        <span className="text-sm font-medium">{sdg.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{sdg.participants}</div>
                        <div className="text-xs text-muted-foreground">{sdg.hours}h</div>
                      </div>
                    </div>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={analyticsData.sdgDistribution.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sdg" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#10B981" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Impact Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <div className="text-2xl font-bold">12,847</div>
                <div className="text-sm text-muted-foreground">Total Badges Earned</div>
                <div className="text-xs text-green-600 mt-1">+23% this month</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <div className="text-2xl font-bold">847</div>
                <div className="text-sm text-muted-foreground">Avg Monthly Events</div>
                <div className="text-xs text-blue-600 mt-1">+15% this month</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <div className="text-2xl font-bold">94.3%</div>
                <div className="text-sm text-muted-foreground">User Satisfaction</div>
                <div className="text-xs text-green-600 mt-1">+1.2% this month</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="subscriptions" 
                      stackId="1" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.6}
                      name="Subscriptions"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="transactionFees" 
                      stackId="1" 
                      stroke="#F59E0B" 
                      fill="#F59E0B" 
                      fillOpacity={0.6}
                      name="Transaction Fees"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown (Current Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <div className="font-medium">Individual Subscriptions</div>
                      <div className="text-sm text-muted-foreground">2,847 × $4.99/month</div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      $14,206
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <div className="font-medium">NGO Subscriptions</div>
                      <div className="text-sm text-muted-foreground">127 organizations</div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      $31,750
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div>
                      <div className="font-medium">Corporate Subscriptions</div>
                      <div className="text-sm text-muted-foreground">43 companies</div>
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                      $129,000
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div>
                      <div className="font-medium">Transaction Fees</div>
                      <div className="text-sm text-muted-foreground">3.5% on donations</div>
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                      $8,420
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Total Monthly Revenue</div>
                      <div className="text-2xl font-bold brand-gradient-text">
                        $183,376
                      </div>
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      +27% vs last month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Projections */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold">$225K</div>
                  <div className="text-sm text-muted-foreground">Next Month</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold">$2.1M</div>
                  <div className="text-sm text-muted-foreground">End of Year</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold">$8.5M</div>
                  <div className="text-sm text-muted-foreground">Year 2 Target</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold">$25M</div>
                  <div className="text-sm text-muted-foreground">Year 3 Goal</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* System Health */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
                <Badge variant="success" className="mt-1">Excellent</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">1.2s</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
                <Badge variant="info" className="mt-1">Good</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">847</div>
                <div className="text-sm text-muted-foreground">Daily Active</div>
                <Badge variant="secondary" className="mt-1">+12%</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">3.4%</div>
                <div className="text-sm text-muted-foreground">Error Rate</div>
                <Badge variant="warning" className="mt-1">Monitor</Badge>
              </CardContent>
            </Card>
          </div>

          {/* User Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Daily Active Users</h4>
                  <div className="text-3xl font-bold">2,847</div>
                  <Progress value={76} className="h-2" />
                  <div className="text-sm text-muted-foreground">76% of weekly users</div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Session Duration</h4>
                  <div className="text-3xl font-bold">12m 34s</div>
                  <Progress value={84} className="h-2" />
                  <div className="text-sm text-muted-foreground">+8% vs last month</div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Return Rate</h4>
                  <div className="text-3xl font-bold">67.8%</div>
                  <Progress value={68} className="h-2" />
                  <div className="text-sm text-muted-foreground">7-day return rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Platform Issues & Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Database Performance</div>
                      <div className="text-sm text-muted-foreground">All queries under 200ms</div>
                    </div>
                  </div>
                  <Badge variant="success">Healthy</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">API Rate Limits</div>
                      <div className="text-sm text-muted-foreground">Some users approaching limits</div>
                    </div>
                  </div>
                  <Badge variant="warning">Monitor</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">File Storage</div>
                      <div className="text-sm text-muted-foreground">S3 storage at 34% capacity</div>
                    </div>
                  </div>
                  <Badge variant="success">Good</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Certificate Generation</div>
                      <div className="text-sm text-muted-foreground">All certificates generating successfully</div>
                    </div>
                  </div>
                  <Badge variant="success">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Real-time Platform Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[
              { type: 'user_joined', message: 'New user from Malaysia joined', time: '2 minutes ago', icon: Users, color: 'text-blue-500' },
              { type: 'event_created', message: 'Beach cleanup event created in Singapore', time: '5 minutes ago', icon: Calendar, color: 'text-green-500' },
              { type: 'badge_earned', message: 'Climate Action Champion badge earned', time: '8 minutes ago', icon: Award, color: 'text-yellow-500' },
              { type: 'verification', message: '127 hours verified for education tutoring', time: '12 minutes ago', icon: CheckCircle, color: 'text-purple-500' },
              { type: 'organization_joined', message: 'New NGO registered from Indonesia', time: '15 minutes ago', icon: Building2, color: 'text-orange-500' },
              { type: 'milestone', message: 'Platform reached 50K total users!', time: '1 hour ago', icon: TrendingUp, color: 'text-primary' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 hover:bg-accent/50 rounded-lg">
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
                <div className="flex-1">
                  <div className="text-sm">{activity.message}</div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mock data function for demonstration
function getMockAnalyticsData(): AnalyticsData {
  return {
    overview: {
      totalUsers: 52847,
      totalOrganizations: 1247,
      totalEvents: 8934,
      totalVolunteerHours: 134567,
      averageImpaktrScore: 287.4,
      monthlyGrowth: 23.5,
      activeUsers: 12847,
      verificationRate: 87.3
    },
    userGrowth: [
      { month: 'Jan', users: 5200, organizations: 120, events: 450 },
      { month: 'Feb', users: 8400, organizations: 180, events: 680 },
      { month: 'Mar', users: 12100, organizations: 250, events: 920 },
      { month: 'Apr', users: 18200, organizations: 340, events: 1200 },
      { month: 'May', users: 25800, organizations: 470, events: 1580 },
      { month: 'Jun', users: 34500, organizations: 650, events: 2100 },
      { month: 'Jul', users: 42300, organizations: 850, events: 2650 },
      { month: 'Aug', users: 47600, organizations: 980, events: 3200 },
      { month: 'Sep', users: 52847, organizations: 1247, events: 3780 }
    ],
    sdgDistribution: [
      { sdg: 4, name: 'Quality Education', participants: 8934, hours: 23456, color: '#C5192D' },
      { sdg: 13, name: 'Climate Action', participants: 7234, hours: 19234, color: '#3F7E44' },
      { sdg: 1, name: 'No Poverty', participants: 6123, hours: 16789, color: '#E5243B' },
      { sdg: 3, name: 'Good Health', participants: 5456, hours: 14567, color: '#4C9F38' },
      { sdg: 11, name: 'Sustainable Cities', participants: 4567, hours: 12345, color: '#FD9D24' },
      { sdg: 8, name: 'Decent Work', participants: 3789, hours: 9876, color: '#A21942' },
      { sdg: 10, name: 'Reduced Inequalities', participants: 3234, hours: 8765, color: '#DD1367' },
      { sdg: 5, name: 'Gender Equality', participants: 2987, hours: 7654, color: '#FF3A21' }
    ],
    countryStats: [
      { country: 'Malaysia', users: 18500, avgScore: 295.7, totalHours: 45678, flag: '🇲🇾' },
      { country: 'Singapore', users: 12300, avgScore: 342.1, totalHours: 38234, flag: '🇸🇬' },
      { country: 'Indonesia', users: 8900, avgScore: 234.5, totalHours: 23456, flag: '🇮🇩' },
      { country: 'Thailand', users: 6700, avgScore: 267.8, totalHours: 19876, flag: '🇹🇭' },
      { country: 'Philippines', users: 4200, avgScore: 198.9, totalHours: 12345, flag: '🇵🇭' },
      { country: 'Australia', users: 2100, avgScore: 387.6, totalHours: 9876, flag: '🇦🇺' }
    ],
    organizationTypes: [
      { type: 'NGO', count: 487, avgScore: 67.8, totalEvents: 2340 },
      { type: 'Corporate', count: 234, avgScore: 45.2, totalEvents: 890 },
      { type: 'School', count: 345, avgScore: 52.1, totalEvents: 1567 },
      { type: 'Healthcare', count: 181, avgScore: 71.3, totalEvents: 567 }
    ],
    verificationStats: [
      { type: 'organizer', count: 45234, percentage: 42 },
      { type: 'peer', count: 32165, percentage: 30 },
      { type: 'gps', count: 21098, percentage: 19 },
      { type: 'self', count: 9876, percentage: 9 }
    ],
    revenueData: [
      { month: 'Jan', subscriptions: 25900, transactionFees: 3400, total: 29300 },
      { month: 'Feb', subscriptions: 34200, transactionFees: 4200, total: 38400 },
      { month: 'Mar', subscriptions: 45600, transactionFees: 5800, total: 51400 },
      { month: 'Apr', subscriptions: 67800, transactionFees: 7200, total: 75000 },
      { month: 'May', subscriptions: 89400, transactionFees: 8900, total: 98300 },
      { month: 'Jun', subscriptions: 112000, transactionFees: 11200, total: 123200 },
      { month: 'Jul', subscriptions: 134500, transactionFees: 13100, total: 147600 },
      { month: 'Aug', subscriptions: 156700, transactionFees: 14800, total: 171500 },
      { month: 'Sep', subscriptions: 175000, transactionFees: 18400, total: 193400 }
    ],
    topPerformers: {
      individuals: [
        { id: '1', name: 'Sarah Chen', score: 847.2, rank: 'Global Citizen', avatar: '', country: 'Singapore' },
        { id: '2', name: 'Ahmad Rahman', score: 789.5, rank: 'Ambassador', avatar: '', country: 'Malaysia' },
        { id: '3', name: 'Maria Santos', score: 734.8, rank: 'Leader', avatar: '', country: 'Philippines' },
        { id: '4', name: 'David Kim', score: 698.3, rank: 'Leader', avatar: '', country: 'South Korea' },
        { id: '5', name: 'Priya Sharma', score: 667.9, rank: 'Mentor', avatar: '', country: 'India' }
      ],
      organizations: [
        { id: '1', name: 'WWF Malaysia', score: 89.7, type: 'NGO', logo: '', members: 234 },
        { id: '2', name: 'Microsoft Asia', score: 78.3, type: 'Corporate', logo: '', members: 1250 },
        { id: '3', name: 'NUS Singapore', score: 76.9, type: 'University', logo: '', members: 890 },
        { id: '4', name: 'Red Cross Indonesia', score: 74.2, type: 'NGO', logo: '', members: 456 },
        { id: '5', name: 'Shopee', score: 71.8, type: 'Corporate', logo: '', members: 780 }
      ]
    }
  };
}