// home/ubuntu/impaktrweb/src/components/organization/CorporateBadges.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Lock, CheckCircle, Leaf, Users, TrendingUp, Shield } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
}

interface CorporateBadgesProps {
  organizationId: string;
}

export default function CorporateBadges({ organizationId }: CorporateBadgesProps) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchBadges();
  }, [organizationId]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with API call
      const mockBadges: BadgeData[] = [
        {
          id: '1',
          name: 'Carbon Neutral Champion',
          description: 'Achieve carbon neutrality for 6 consecutive months',
          icon: 'leaf',
          category: 'esg',
          tier: 'gold',
          earned: true,
          earnedAt: '2024-09-15',
          progress: 100,
        },
        {
          id: '2',
          name: 'ESG Excellence',
          description: 'Maintain ESG score above 85 for one year',
          icon: 'trending-up',
          category: 'esg',
          tier: 'platinum',
          earned: false,
          progress: 73,
        },
        {
          id: '3',
          name: 'Team Builder',
          description: '100+ active employees participating',
          icon: 'users',
          category: 'participation',
          tier: 'gold',
          earned: true,
          earnedAt: '2024-08-20',
          progress: 100,
        },
        {
          id: '4',
          name: 'Community Impact Leader',
          description: '10,000+ volunteer hours contributed',
          icon: 'award',
          category: 'impact',
          tier: 'gold',
          earned: false,
          progress: 87,
        },
        {
          id: '5',
          name: 'Diversity Champion',
          description: 'Achieve diversity targets across all teams',
          icon: 'users',
          category: 'social',
          tier: 'silver',
          earned: true,
          earnedAt: '2024-07-10',
          progress: 100,
        },
        {
          id: '6',
          name: 'Governance Excellence',
          description: '100% compliance with governance standards',
          icon: 'shield',
          category: 'governance',
          tier: 'platinum',
          earned: false,
          progress: 92,
        },
        {
          id: '7',
          name: 'Innovation Pioneer',
          description: 'Launch 5+ sustainability innovations',
          icon: 'trending-up',
          category: 'impact',
          tier: 'silver',
          earned: true,
          earnedAt: '2024-06-05',
          progress: 100,
        },
        {
          id: '8',
          name: 'B Corp Certified',
          description: 'Achieve B Corporation certification',
          icon: 'award',
          category: 'certification',
          tier: 'platinum',
          earned: false,
          progress: 45,
        },
      ];

      setBadges(mockBadges);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Badges' },
    { value: 'esg', label: 'ESG' },
    { value: 'participation', label: 'Participation' },
    { value: 'impact', label: 'Impact' },
    { value: 'certification', label: 'Certification' },
  ];

  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(b => b.category === selectedCategory);

  const earnedBadges = badges.filter(b => b.earned);
  const totalBadges = badges.length;
  const completionRate = totalBadges > 0 ? (earnedBadges.length / totalBadges) * 100 : 0;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-cyan-400 to-blue-500';
      case 'gold':
        return 'from-yellow-400 to-orange-500';
      case 'silver':
        return 'from-gray-300 to-gray-500';
      default:
        return 'from-orange-400 to-red-500';
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconProps = { className: 'h-8 w-8' };
    switch (iconName) {
      case 'leaf':
        return <Leaf {...iconProps} />;
      case 'users':
        return <Users {...iconProps} />;
      case 'trending-up':
        return <TrendingUp {...iconProps} />;
      case 'shield':
        return <Shield {...iconProps} />;
      default:
        return <Award {...iconProps} />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Corporate Badges</h2>
              <p className="text-blue-100">Track your organization&apos;s achievements and milestones</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{earnedBadges.length}/{totalBadges}</div>
              <div className="text-sm text-blue-100">Badges Earned</div>
              <Progress value={completionRate} className="mt-2 h-2 bg-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category.value
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.map((badge) => (
          <Card 
            key={badge.id}
            className={`relative overflow-hidden transition-all hover:shadow-xl ${
              badge.earned ? 'border-2 border-green-500 dark:border-green-400' : ''
            }`}
          >
            <CardContent className="p-6">
              {/* Badge Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-4 rounded-xl bg-gradient-to-br ${getTierColor(badge.tier)} ${
                  !badge.earned ? 'opacity-40' : ''
                }`}>
                  <div className="text-white">
                    {getIconComponent(badge.icon)}
                  </div>
                </div>
                {badge.earned ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-400" />
                )}
              </div>

              {/* Badge Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold text-lg ${
                    !badge.earned ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {badge.name}
                  </h3>
                  <Badge className={`bg-gradient-to-r ${getTierColor(badge.tier)} text-white border-0`}>
                    {badge.tier}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {badge.description}
                </p>

                {/* Progress */}
                {!badge.earned && badge.progress !== undefined && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {badge.progress}%
                      </span>
                    </div>
                    <Progress value={badge.progress} className="h-2" />
                  </div>
                )}

                {/* Earned Date */}
                {badge.earned && badge.earnedAt && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Earned on {new Date(badge.earnedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
