// home/ubuntu/impaktrweb/src/app/admin/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { redirect } from 'next/navigation';
import {
  Users,
  Building2,
  Calendar,
  Award,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Globe,
  BarChart3,
  PieChart,
  Activity,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { UserManagement } from '@/components/admin/UserManagement';
import { OrganizationManagement } from '@/components/admin/OrganizationManagement';
import { EventModeration } from '@/components/admin/EventModeration';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { RevenueAnalytics } from '@/components/admin/RevenueAnalytics';
import { SystemHealth } from '@/components/admin/SystemHealth';
import { VerificationQueue } from '@/components/admin/VerificationQueue';

interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  totalEvents: number;
  totalHours: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  pendingVerifications: number;
  systemHealth: number;
  userGrowthRate: number;
  orgGrowthRate: number;
  recentActivity: any[];
}

export default function AdminDashboard() {
  const { user, isLoading } = useUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/api/auth/login');
      return;
    }

    // Check if user is admin
    if (user && !isUserAdmin(user)) {
      redirect('/dashboard');
      return;
    }

    if (user) {
      fetchAdminStats();
    }
  }, [isLoading, user]);

  const isUserAdmin = (user: any) => {
    // Check if user has admin role
    return user['https://impaktr.com/roles']?.includes('admin') || 
           user.email === 'admin@impaktr.com' ||
           user.email?.endsWith('@impaktr.com');
  };

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (isLoading || isLoadingStats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isUserAdmin(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <ShieldCheck className="w-8 h-8 mr-3 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Platform management and analytics for Impaktr
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="px-3 py-1">
              <Activity className="w-3 h-3 mr-1" />
              System Healthy
            </Badge>
            <Badge variant="outline">
              Admin Access
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <AdminStatsCards stats={stats} />

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Impact Hours</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalHours.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats?.monthlyRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      +23% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.activeSubscriptions}</div>
                    <p className="text-xs text-muted-foreground">
                      +8% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendingVerifications}</div>
                    <p className="text-xs text-muted-foreground">
                      Requires attention
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnalyticsDashboard />
                <RevenueAnalytics />
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Platform Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'user_signup', message: '23 new users registered', time: '2 minutes ago', severity: 'info' },
                      { type: 'organization_verified', message: 'WWF Malaysia verified', time: '15 minutes ago', severity: 'success' },
                      { type: 'payment_received', message: '$299 subscription payment received', time: '1 hour ago', severity: 'success' },
                      { type: 'event_flagged', message: 'Event flagged for review', time: '2 hours ago', severity: 'warning' },
                      { type: 'system_backup', message: 'Daily backup completed', time: '3 hours ago', severity: 'info' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.severity === 'success' ? 'bg-green-500' :
                          activity.severity === 'warning' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations">
            <OrganizationManagement />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <EventModeration />
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications">
            <VerificationQueue />
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Recurring Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      ${stats?.monthlyRevenue.toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                      +23% from last month
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Individual Premium</span>
                        <span className="text-sm font-medium">1,247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">NGO Pro</span>
                        <span className="text-sm font-medium">89</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Corporate Growth</span>
                        <span className="text-sm font-medium">34</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Enterprise</span>
                        <span className="text-sm font-medium">12</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Churn Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">2.3%</div>
                    <div className="text-sm text-muted-foreground">
                      Below industry average of 5.2%
                    </div>
                    <Progress value={23} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              <RevenueAnalytics />
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <SystemHealth />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}