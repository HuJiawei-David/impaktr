'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Trophy,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import dynamic from 'next/dynamic';

// Dynamically import the actual leaderboards page content
const LeaderboardsPageContent = dynamic(
  () => import('../leaderboards/page').then(mod => ({ default: mod.default })),
  { ssr: false, loading: () => <LoadingSpinner /> }
);

function DemoLeaderboardsWrapper() {
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
                <Trophy className="w-6 h-6" />
                <h1 className="text-xl font-semibold">Leaderboards Demo</h1>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Preview Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Actual Leaderboards Content */}
      <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner /></div>}>
        <LeaderboardsPageContent />
      </Suspense>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Compete and Make an Impact!
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join the leaderboard and see how you rank among impact makers worldwide
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                Join Now
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
            Start tracking your impact today • Free to join
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DemoLeaderboardsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DemoLeaderboardsWrapper />
    </Suspense>
  );
}
