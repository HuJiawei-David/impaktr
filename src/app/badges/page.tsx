'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Award, 
  Trophy, 
  Target,
  Info
} from 'lucide-react';

interface RankBadge {
  rank: string;
  name: string;
  description: string;
  icon: string;
  requirements: {
    minScore: number;
    minHours: number;
    minBadges: number;
  };
  color: string;
}

interface TierBadge {
  tier: string;
  name: string;
  description: string;
  icon: string;
  requirements: {
    minEmployeeParticipation: number;
    minAverageScore: number;
    minEvents: number;
    minSDGDiversity: number;
  };
  color: string;
}

interface SDGBadge {
  sdgNumber: number;
  sdgName: string;
  icon: string;
  color: string;
  tiers: Array<{
    tier: string;
    individual: {
      name: string;
      description: string;
      minHours: number;
      minActivities: number;
    };
    organization: {
      name: string;
      description: string;
      minHours: number;
      minActivities: number;
    };
  }>;
}

interface BadgeData {
  individualRanks: RankBadge[];
  organizationTiers: TierBadge[];
  sdgBadges: SDGBadge[];
}

export default function BadgeGlossaryPage() {
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'organization'>('individual');

  useEffect(() => {
    fetchBadgeData();
  }, []);

  const fetchBadgeData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/badges?type=public');
      
      if (!response.ok) {
        throw new Error('Failed to fetch badge data');
      }

      const data = await response.json();
      setBadgeData(data);
    } catch (err) {
      console.error('Error fetching badges:', err);
      setError('Failed to load badge data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !badgeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-red-500">{error || 'Failed to load badges'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-center mb-6">
            <Trophy className="h-16 w-16 mr-4" />
          </div>
          <h1 className="text-5xl font-bold text-center mb-6">
            impaktr Badge System
          </h1>
          <p className="text-xl text-center max-w-3xl mx-auto opacity-90">
            Discover how our gamification system rewards your social impact journey.
            Earn badges, climb the ranks, and become a recognized changemaker.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-8 py-3 rounded-md font-medium transition-all ${
                activeTab === 'individual'
                  ? 'bg-white dark:bg-gray-800 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Award className="inline-block h-5 w-5 mr-2" />
              Individual Badges
            </button>
            <button
              onClick={() => setActiveTab('organization')}
              className={`px-8 py-3 rounded-md font-medium transition-all ${
                activeTab === 'organization'
                  ? 'bg-white dark:bg-gray-800 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="inline-block h-5 w-5 mr-2" />
              Organization Badges
            </button>
          </div>
        </div>

        {activeTab === 'individual' ? (
          <>
            {/* Individual Rank Badges */}
            <section className="mb-16">
              <div className="flex items-center mb-8">
                <Target className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h2 className="text-3xl font-bold">Individual Journey Ranks</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Progress through 10 levels based on your overall impact score
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {badgeData.individualRanks.map((rank, index) => (
                  <Card 
                    key={rank.rank}
                    className="hover:shadow-lg transition-shadow border-2"
                  >
                    <CardContent className="p-6">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${rank.color} flex items-center justify-center`}>
                        <Award className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-center mb-2">
                        {rank.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                        {rank.description}
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Score:</span>
                          <span className="font-semibold">{rank.requirements.minScore}+</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Hours:</span>
                          <span className="font-semibold">{rank.requirements.minHours}+</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Badges:</span>
                          <span className="font-semibold">{rank.requirements.minBadges}+</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Individual SDG Badges */}
            <section className="mb-16">
              <div className="flex items-center mb-8">
                <Info className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-3xl font-bold">SDG-Specific Badges (Individuals)</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Earn specialized badges for each of the 17 UN Sustainable Development Goals
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {badgeData.sdgBadges.map((sdg) => (
                  <Card key={sdg.sdgNumber}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${sdg.color} flex items-center justify-center mr-4 text-white font-bold`}>
                          {sdg.sdgNumber}
                        </div>
                        <div>
                          <div className="text-xl">SDG {sdg.sdgNumber}: {sdg.sdgName}</div>
                          <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                            4 progressive badge levels
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sdg.tiers.map((tier) => (
                          <div 
                            key={tier.tier}
                            className="border-2 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r ${sdg.color} flex items-center justify-center`}>
                              <Award className="h-8 w-8 text-white" />
                            </div>
                            <h4 className="text-center font-bold mb-2">
                              {tier.individual.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3">
                              {tier.individual.description}
                            </p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                <span>Hours:</span>
                                <span className="font-semibold">{tier.individual.minHours}+</span>
                              </div>
                              <div className="flex justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                <span>Activities:</span>
                                <span className="font-semibold">{tier.individual.minActivities}+</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Organization Tier Badges */}
            <section className="mb-16">
              <div className="flex items-center mb-8">
                <Trophy className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h2 className="text-3xl font-bold">Organization Impact Tiers</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Progress through 10 tiers based on your organization's collective impact
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {badgeData.organizationTiers.map((tier) => (
                  <Card 
                    key={tier.tier}
                    className="hover:shadow-lg transition-shadow border-2"
                  >
                    <CardContent className="p-6">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                        <Trophy className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-center mb-2">
                        {tier.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                        {tier.description}
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Participation:</span>
                          <span className="font-semibold">{tier.requirements.minEmployeeParticipation}%+</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Avg Score:</span>
                          <span className="font-semibold">{tier.requirements.minAverageScore}+</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Events:</span>
                          <span className="font-semibold">{tier.requirements.minEvents}+</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">SDGs:</span>
                          <span className="font-semibold">{tier.requirements.minSDGDiversity}+</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Organization SDG Badges */}
            <section className="mb-16">
              <div className="flex items-center mb-8">
                <Info className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-3xl font-bold">SDG-Specific Badges (Organizations)</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Earn corporate badges for each of the 17 UN Sustainable Development Goals
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {badgeData.sdgBadges.map((sdg) => (
                  <Card key={sdg.sdgNumber}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${sdg.color} flex items-center justify-center mr-4 text-white font-bold`}>
                          {sdg.sdgNumber}
                        </div>
                        <div>
                          <div className="text-xl">SDG {sdg.sdgNumber}: {sdg.sdgName}</div>
                          <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                            4 progressive corporate badge levels
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sdg.tiers.map((tier) => (
                          <div 
                            key={tier.tier}
                            className="border-2 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r ${sdg.color} flex items-center justify-center`}>
                              <Trophy className="h-8 w-8 text-white" />
                            </div>
                            <h4 className="text-center font-bold mb-2">
                              {tier.organization.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3">
                              {tier.organization.description}
                            </p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                <span>Hours:</span>
                                <span className="font-semibold">{tier.organization.minHours}+</span>
                              </div>
                              <div className="flex justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                <span>Activities:</span>
                                <span className="font-semibold">{tier.organization.minActivities}+</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Impact Journey?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of changemakers earning badges and making a difference
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/signup"
                className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Sign Up Now
              </a>
              <a
                href="/signin"
                className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Sign In
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


