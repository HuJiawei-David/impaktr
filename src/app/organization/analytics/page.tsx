// home/ubuntu/impaktrweb/src/app/organization/analytics/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Award,
  Target,
  Activity,
  PieChart,
  LineChart,
  Download,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsData {
  overview: {
    totalMembers: number;
    activeMembers: number;
    totalEvents: number;
    totalParticipants: number;
    volunteerHours: number;
    impactScore: number;
    participationRate: number;
  };
  trends: {
    memberGrowth: Array<{ month: string; count: number }>;
    eventParticipation: Array<{ month: string; participants: number }>;
    impactScore: Array<{ month: string; score: number }>;
    volunteerHours: Array<{ month: string; hours: number }>;
  };
  topPerformers: Array<{
    id: string;
    name: string;
    impactScore: number;
    volunteerHours: number;
    eventsParticipated: number;
  }>;
  eventStats: Array<{
    id: string;
    title: string;
    participants: number;
    volunteerHours: number;
    impactScore: number;
    status: string;
  }>;
  sdgBreakdown: Array<{
    sdg: number;
    name: string;
    events: number;
    participants: number;
    impactScore: number;
  }>;
}

interface OrganizationData {
  id: string;
  name: string;
  analytics: AnalyticsData;
}

export default function OrganizationAnalyticsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchAnalyticsData();
    }
  }, [isLoading, user, router, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange: timeRange,
      });

      const response = await fetch(`/api/organization/analytics?${params}`);
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.status === 404) {
        router.push('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setOrganizationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log('Export analytics data');
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!organizationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-muted-foreground mb-4">You are not part of any organization.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { analytics } = organizationData;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[22px] pb-8">

        {/* Compact Professional Header */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left: Page Info */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Analytics Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track your organization's performance and impact metrics
                  </p>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center space-x-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleExportData} 
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{analytics.overview.totalMembers}</p>
                  <p className="text-xs text-green-600">
                    {analytics.overview.activeMembers} active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{analytics.overview.totalEvents}</p>
                  <p className="text-xs text-muted-foreground">
                    {analytics.overview.totalParticipants} participants
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Volunteer Hours</p>
                  <p className="text-2xl font-bold">{analytics.overview.volunteerHours.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {analytics.overview.participationRate.toFixed(1)}% participation rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Impact Score</p>
                  <p className="text-2xl font-bold">{analytics.overview.impactScore.toLocaleString()}</p>
                  <p className="text-xs text-green-600">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +12% this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Member Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="w-6 h-6 mr-2" />
                Member Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <LineChart className="w-12 h-12 mx-auto mb-2" />
                  <p>Member growth chart</p>
                  <p className="text-sm">Chart visualization coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Participation Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-6 h-6 mr-2" />
                Event Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Event participation chart</p>
                  <p className="text-sm">Chart visualization coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers and Event Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-6 h-6 mr-2" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{performer.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {performer.eventsParticipated} events
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{performer.impactScore.toLocaleString()} pts</p>
                      <p className="text-sm text-muted-foreground">
                        {performer.volunteerHours} hours
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Event Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-6 h-6 mr-2" />
                Event Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.eventStats.map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold truncate">{event.title}</h3>
                      <Badge variant={
                        event.status === 'ACTIVE' ? 'default' :
                        event.status === 'COMPLETED' ? 'secondary' : 'outline'
                      }>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Participants</p>
                        <p className="font-semibold">{event.participants}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hours</p>
                        <p className="font-semibold">{event.volunteerHours}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Impact</p>
                        <p className="font-semibold">{event.impactScore}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SDG Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-6 h-6 mr-2" />
              SDG Impact Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.sdgBreakdown.map((sdg) => (
                <div key={sdg.sdg} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">SDG {sdg.sdg}</h3>
                    <Badge variant="outline">{sdg.events} events</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{sdg.name}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Participants</span>
                      <span className="font-semibold">{sdg.participants}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Impact Score</span>
                      <span className="font-semibold">{sdg.impactScore.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
