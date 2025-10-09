// home/ubuntu/impaktrweb/src/app/analytics/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
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
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Filter,
  Target,
  Clock,
  MapPin,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface UserAnalytics {
  totalHours: number;
  totalEvents: number;
  totalBadges: number;
  currentRank: string;
  impaktrScore: number;
  monthlyHours: Array<{ month: string; hours: number }>;
  sdgBreakdown: Array<{ sdg: number; hours: number; percentage: number }>;
  eventTypes: Array<{ type: string; count: number; hours: number }>;
  recentActivity: Array<{ date: string; event: string; hours: number }>;
  achievements: Array<{ name: string; date: string; description: string }>;
  topSkills: Array<{ skill: string; hours: number }>;
  impactMetrics: {
    peopleHelped: number;
    carbonFootprint: number;
    socialImpact: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/auth/signin');
      return;
    }

    fetchAnalytics();
  }, [session, status, dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - in production, this would fetch from an API
      const mockData: UserAnalytics = {
        totalHours: 247,
        totalEvents: 18,
        totalBadges: 12,
        currentRank: 'Impact Champion',
        impaktrScore: 1847,
        monthlyHours: [
          { month: 'Jan', hours: 32 },
          { month: 'Feb', hours: 28 },
          { month: 'Mar', hours: 45 },
          { month: 'Apr', hours: 38 },
          { month: 'May', hours: 52 },
          { month: 'Jun', hours: 42 }
        ],
        sdgBreakdown: [
          { sdg: 13, hours: 45, percentage: 18.2 },
          { sdg: 4, hours: 38, percentage: 15.4 },
          { sdg: 3, hours: 32, percentage: 13.0 },
          { sdg: 1, hours: 28, percentage: 11.3 },
          { sdg: 6, hours: 25, percentage: 10.1 },
          { sdg: 11, hours: 22, percentage: 8.9 },
          { sdg: 8, hours: 20, percentage: 8.1 },
          { sdg: 2, hours: 17, percentage: 6.9 }
        ],
        eventTypes: [
          { type: 'Environmental', count: 8, hours: 95 },
          { type: 'Education', count: 5, hours: 78 },
          { type: 'Healthcare', count: 3, hours: 45 },
          { type: 'Community', count: 2, hours: 29 }
        ],
        recentActivity: [
          { date: '2024-06-15', event: 'Beach Cleanup Drive', hours: 4 },
          { date: '2024-06-12', event: 'Math Tutoring Program', hours: 6 },
          { date: '2024-06-08', event: 'Food Distribution', hours: 3 },
          { date: '2024-06-05', event: 'Tree Planting Initiative', hours: 5 }
        ],
        achievements: [
          { name: 'Climate Action Supporter', date: '2024-06-15', description: 'Completed 10 environmental events' },
          { name: 'Education Champion', date: '2024-06-12', description: 'Helped 50+ students with tutoring' },
          { name: 'Community Builder', date: '2024-05-28', description: 'Organized 5 community events' }
        ],
        topSkills: [
          { skill: 'Teaching', hours: 78 },
          { skill: 'Environmental Conservation', hours: 95 },
          { skill: 'Event Organization', hours: 45 },
          { skill: 'Community Outreach', hours: 29 }
        ],
        impactMetrics: {
          peopleHelped: 247,
          carbonFootprint: 1250,
          socialImpact: 89
        }
      };
      
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Impact Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your volunteering journey and visualize your impact
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Hours</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.totalHours}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">+12% this month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Events Joined</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.totalEvents}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">+3 this month</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Badges Earned</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.totalBadges}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">+2 this month</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Impact Score</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.impaktrScore}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">+89 this month</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-white shadow-lg rounded-xl p-2">
              <TabsTrigger 
                value="overview" 
                className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <LineChart className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="impact" 
                className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <Target className="w-4 h-4 mr-2" />
                Impact
              </TabsTrigger>
              <TabsTrigger 
                value="skills" 
                className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Skills
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <Award className="w-4 h-4 mr-2" />
                Awards
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Hours Over Time */}
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" />
                    Hours Volunteered Over Time
                  </CardTitle>
                  <p className="text-sm text-gray-600">Your volunteering activity in the past 6 months</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={analytics?.monthlyHours}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
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

              {/* SDG Breakdown */}
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-green-600" />
                    SDG Focus Areas
                  </CardTitle>
                  <p className="text-sm text-gray-600">Your contribution to UN Sustainable Development Goals</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={analytics?.sdgBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ sdg, percentage }) => `SDG ${sdg}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="hours"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {analytics?.sdgBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Event Types */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                  Event Types Breakdown
                </CardTitle>
                <p className="text-sm text-gray-600">Hours spent across different types of volunteering activities</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsBarChart data={analytics?.eventTypes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="type" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="hours" fill="url(#colorBar)" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="impact" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2 text-gray-900">{analytics?.impactMetrics.peopleHelped}</h3>
                  <p className="text-gray-600 font-medium">People Helped</p>
                  <p className="text-xs text-green-600 font-medium mt-2">+23 this month</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2 text-gray-900">{analytics?.impactMetrics.carbonFootprint}kg</h3>
                  <p className="text-gray-600 font-medium">CO₂ Reduced</p>
                  <p className="text-xs text-green-600 font-medium mt-2">+180kg this month</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2 text-gray-900">{analytics?.impactMetrics.socialImpact}%</h3>
                  <p className="text-gray-600 font-medium">Social Impact Score</p>
                  <p className="text-xs text-green-600 font-medium mt-2">+7% this month</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-600" />
                  Recent Activity
                </CardTitle>
                <p className="text-sm text-gray-600">Your latest volunteering activities</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{activity.event}</h4>
                          <p className="text-sm text-gray-600">{activity.date}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium">{activity.hours}h</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-8">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                  Top Skills Developed
                </CardTitle>
                <p className="text-sm text-gray-600">Skills you've gained through volunteering activities</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analytics?.topSkills.map((skill, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">{skill.skill}</span>
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{skill.hours}h</span>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={(skill.hours / (analytics?.topSkills[0]?.hours || 1)) * 100} 
                          className="h-3 bg-gray-200"
                        />
                        <div 
                          className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${(skill.hours / (analytics?.topSkills[0]?.hours || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-8">
            <div className="grid gap-6">
              {analytics?.achievements.map((achievement, index) => (
                <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900 mb-2">{achievement.name}</h3>
                        <p className="text-gray-600 mb-3 leading-relaxed">{achievement.description}</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-500 font-medium">Earned on {achievement.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
