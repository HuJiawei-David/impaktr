'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  BarChart3,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Import actual dashboard components
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ImpaktrScore } from '@/components/dashboard/ImpaktrScore';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { BadgeProgress } from '@/components/dashboard/BadgeProgress';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { GamificationJourney } from '@/components/dashboard/GamificationJourney';
import { SDGBadgeCollection } from '@/components/dashboard/SDGBadgeCollection';
import { AchievementFeed } from '@/components/dashboard/AchievementFeed';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { FeaturedOrganizations } from '@/components/dashboard/FeaturedOrganizations';

export default function DashboardDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Preview Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-white/30"></div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6" />
                <h1 className="text-xl font-semibold">Dashboard Demo</h1>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Preview Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Actual Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Your Dashboard 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your impact, connect with communities, and make a difference
          </p>
        </div>

        {/* Main Dashboard Layout - LinkedIn Style */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Stats & Featured Organizations */}
          <div className="lg:col-span-3 space-y-4">
            {/* Impact Score Card */}
            <ImpaktrScore />

            {/* Quick Actions */}
            <QuickActions />

            {/* Badge Progress */}
            <BadgeProgress />

            {/* Featured Organizations */}
            <FeaturedOrganizations />
          </div>

          {/* Main Feed - Center */}
          <div className="lg:col-span-6 space-y-4">
            {/* Achievement Feed */}
            <AchievementFeed maxItems={5} />
          </div>

          {/* Right Sidebar - Upcoming Events & Connections */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upcoming Events */}
            <UpcomingEventsWidget />

            {/* Recent Activity */}
            <RecentActivity />
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-8 space-y-6">
          {/* Gamification Journey */}
          <GamificationJourney />

          {/* SDG Badge Collection */}
          <SDGBadgeCollection />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of individuals making a difference in their communities
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                Sign Up Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-white/80 text-sm mt-6">
            No credit card required • Get started in minutes
          </p>
        </div>
      </div>
    </div>
  );
}
