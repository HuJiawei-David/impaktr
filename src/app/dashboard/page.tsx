// home/ubuntu/impaktrweb/src/app/dashboard/page.tsx

'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  Calendar,
  TrendingUp,
  Award,
  Users,
  Clock,
  MapPin,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ImpaktrScore } from '@/components/dashboard/ImpaktrScore';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { BadgeProgress } from '@/components/dashboard/BadgeProgress';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StatsCards } from '@/components/dashboard/StatsCards';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    redirect('/api/auth/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {String(user.name?.split(' ')[0] ?? 'there')}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your impact journey today.
          </p>
        </div>

        {/* Stats Overview */}
        <StatsCards />

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Impaktr Score */}
            <ImpaktrScore />
            
            {/* Recent Activity */}
            <RecentActivity />
            
            {/* Badge Progress */}
            <BadgeProgress />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions />
            
            {/* Upcoming Events */}
            <UpcomingEvents />
            
            {/* Achievements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Climate Action Supporter</h4>
                    <p className="text-xs text-muted-foreground">Earned 2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">50 Hours Milestone</h4>
                    <p className="text-xs text-muted-foreground">Earned 1 week ago</p>
                  </div>
                </div>

                <Link href="/achievements">
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    View All Achievements
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Leaderboard Position */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Your Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Global Rank</span>
                    <span className="font-medium">#2,847</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Country Rank</span>
                    <span className="font-medium">#284</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Title</span>
                    <Badge variant="secondary" className="text-xs">Contributor</Badge>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-muted-foreground">Progress to Builder</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Need 33 more verified hours
                  </p>
                </div>

                <Link href="/leaderboards">
                  <Button variant="outline" size="sm" className="w-full">
                    View Leaderboards
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Recommended Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Recommended for You
              </span>
              <Link href="/events">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sample recommended events */}
              <div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <Badge variant="sdg" sdgNumber={13} className="mb-2">SDG 13</Badge>
                <h4 className="font-medium mb-2">Beach Cleanup Drive</h4>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  Marina Bay, Singapore
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Clock className="w-4 h-4 mr-1" />
                  2 hours • Tomorrow 9:00 AM
                </div>
                <Button size="sm" className="w-full">Join Event</Button>
              </div>

              <div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <Badge variant="sdg" sdgNumber={4} className="mb-2">SDG 4</Badge>
                <h4 className="font-medium mb-2">Math Tutoring Program</h4>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  Community Center KL
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Clock className="w-4 h-4 mr-1" />
                  3 hours • Weekly
                </div>
                <Button size="sm" className="w-full">Join Event</Button>
              </div>

              <div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <Badge variant="sdg" sdgNumber={1} className="mb-2">SDG 1</Badge>
                <h4 className="font-medium mb-2">Food Distribution Drive</h4>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  Subang Jaya
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <Clock className="w-4 h-4 mr-1" />
                  4 hours • This Weekend
                </div>
                <Button size="sm" className="w-full">Join Event</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}