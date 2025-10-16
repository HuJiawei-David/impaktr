'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Award, Crown } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface LeaderboardEntry {
  rank: number;
  orgId: string;
  name: string;
  logo?: string | null;
  score: number;
  industry: string;
  trend: number; // Positive or negative rank change
  isCurrentOrg: boolean;
}

interface CorporateLeaderboardProps {
  organizationId: string;
  currentRank: number;
}

export default function CorporateLeaderboard({ organizationId, currentRank }: CorporateLeaderboardProps) {
  const [filter, setFilter] = useState('overall');
  const [period, setPeriod] = useState('2024-Q4');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      // Try to fetch from API
      try {
        const response = await fetch(`/api/organizations/leaderboard?filter=${filter}&period=${period}`);
        if (response.ok) {
          const data = await response.json();
          const formattedData = data.rankings.map((entry: { orgId: string; rank: number; name: string; logo: string | null; score: number; industry: string; trend: number }) => ({
            ...entry,
            isCurrentOrg: entry.orgId === organizationId,
          }));
          setLeaderboard(formattedData);
          return;
        }
      } catch (apiError) {
        console.log('API not ready, using mock data:', apiError);
      }

      // Fallback to mock data
      const mockData: LeaderboardEntry[] = [
        {
          rank: 1,
          orgId: '1',
          name: 'Green Tech Solutions',
          logo: null,
          score: 9850,
          industry: 'Technology',
          trend: 2,
          isCurrentOrg: false,
        },
        {
          rank: 2,
          orgId: '2',
          name: 'Sustainable Energy Corp',
          logo: null,
          score: 9720,
          industry: 'Energy',
          trend: -1,
          isCurrentOrg: false,
        },
        {
          rank: 3,
          orgId: '3',
          name: 'EcoManufacturing Ltd',
          logo: null,
          score: 9650,
          industry: 'Manufacturing',
          trend: 1,
          isCurrentOrg: false,
        },
        {
          rank: 4,
          orgId: organizationId,
          name: 'Your Organization',
          logo: null,
          score: 9420,
          industry: 'Technology',
          trend: 3,
          isCurrentOrg: true,
        },
        {
          rank: 5,
          orgId: '5',
          name: 'CleanWater Initiative',
          logo: null,
          score: 9200,
          industry: 'Utilities',
          trend: 0,
          isCurrentOrg: false
        },
        {
        rank: 6,
        orgId: '6',
        name: 'Urban Farming Co',
        logo: null,
        score: 8950,
        industry: 'Agriculture',
        trend: -2,
        isCurrentOrg: false,
        },
        {
        rank: 7,
        orgId: '7',
        name: 'Circular Economy Group',
        logo: null,
        score: 8720,
        industry: 'Waste Management',
        trend: 1,
        isCurrentOrg: false,
        },
        {
        rank: 8,
        orgId: '8',
        name: 'Healthcare for All',
        logo: null,
        score: 8500,
        industry: 'Healthcare',
        trend: -1,
        isCurrentOrg: false,
        },
        {
        rank: 9,
        orgId: '9',
        name: 'Education Excellence',
        logo: null,
        score: 8320,
        industry: 'Education',
        trend: 2,
        isCurrentOrg: false,
        },
        {
        rank: 10,
        orgId: '10',
        name: 'Community Builders Inc',
        logo: null,
        score: 8100,
        industry: 'Non-Profit',
        trend: 0,
        isCurrentOrg: false,
        },
        ];
        setLeaderboard(mockData);
} catch (error) {
  console.error('Failed to fetch leaderboard:', error);
} finally {
      setLoading(false);
    }
  }, [filter, period, organizationId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getTrendIcon = (trend: number) => {
if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
return <Minus className="h-4 w-4 text-gray-400" />;
};
const getRankBadge = (rank: number) => {
if (rank === 1) {
return (
<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold text-lg shadow-lg">
<Crown className="h-6 w-6" />
</div>
);
}
if (rank === 2) {
return (
<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white font-bold text-lg shadow-lg">
<Medal className="h-6 w-6" />
</div>
);
}
if (rank === 3) {
return (
<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-lg shadow-lg">
<Award className="h-6 w-6" />
</div>
);
}
return (
<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-lg">
#{rank}
</div>
);
};
const topThree = leaderboard.slice(0, 3);
const remaining = leaderboard.slice(3);
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
{/* Header */}
<div className="flex items-center justify-between">
<div>
<h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
<Trophy className="h-8 w-8 text-yellow-600" />
<span>Corporate Leaderboard</span>
</h2>
<p className="text-gray-600 dark:text-gray-400 mt-1">
See how your organization ranks globally
</p>
</div>
<div className="flex items-center space-x-4">
<Select value={filter} onValueChange={setFilter}>
<SelectTrigger className="w-48">
<SelectValue />
</SelectTrigger>
<SelectContent>
<SelectItem value="overall">Overall Rankings</SelectItem>
<SelectItem value="industry">My Industry</SelectItem>
<SelectItem value="size">Similar Size</SelectItem>
<SelectItem value="sdg-13">SDG 13: Climate Action</SelectItem>
<SelectItem value="sdg-8">SDG 8: Decent Work</SelectItem>
</SelectContent>
</Select>
<Select value={period} onValueChange={setPeriod}>
<SelectTrigger className="w-32">
<SelectValue />
</SelectTrigger>
<SelectContent>
<SelectItem value="2024-Q4">2024 Q4</SelectItem>
<SelectItem value="2024-Q3">2024 Q3</SelectItem>
<SelectItem value="2024-Q2">2024 Q2</SelectItem>
<SelectItem value="2024-Q1">2024 Q1</SelectItem>
</SelectContent>
</Select>
</div>
</div>
{/* Top 3 Podium */}
{topThree.length >= 3 && (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      <CardContent className="p-8">
        <div className="flex items-end justify-center space-x-8">
          {/* Second Place */}
          {topThree[1] && (
            <div className="flex flex-col items-center space-y-3" style={{ paddingBottom: '40px' }}>
              <Avatar className="h-20 w-20 border-4 border-gray-400">
                {topThree[1].logo ? (
                  <img src={topThree[1].logo} alt={topThree[1].name} />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-2xl">
                    {topThree[1].name[0]}
                  </div>
                )}
              </Avatar>
              <div className="w-32 h-32 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex flex-col items-center justify-center shadow-lg">
                <Medal className="h-12 w-12 text-white mb-2" />
                <span className="text-white font-bold text-2xl">2nd</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white">{topThree[1].name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{topThree[1].score.toLocaleString()} pts</p>
              </div>
            </div>
          )}

          {/* First Place */}
          {topThree[0] && (
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24 border-4 border-yellow-400">
                {topThree[0].logo ? (
                  <img src={topThree[0].logo} alt={topThree[0].name} />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-3xl">
                    {topThree[0].name[0]}
                  </div>
                )}
              </Avatar>
              <div className="w-32 h-40 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-lg flex flex-col items-center justify-center shadow-xl">
                <Crown className="h-16 w-16 text-white mb-2" />
                <span className="text-white font-bold text-3xl">1st</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white">{topThree[0].name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{topThree[0].score.toLocaleString()} pts</p>
              </div>
            </div>
          )}

          {/* Third Place */}
          {topThree[2] && (
            <div className="flex flex-col items-center space-y-3" style={{ paddingBottom: '80px' }}>
              <Avatar className="h-20 w-20 border-4 border-orange-400">
                {topThree[2].logo ? (
                  <img src={topThree[2].logo} alt={topThree[2].name} />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                    {topThree[2].name[0]}
                  </div>
                )}
              </Avatar>
              <div className="w-32 h-24 bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-lg flex flex-col items-center justify-center shadow-lg">
                <Award className="h-10 w-10 text-white mb-2" />
                <span className="text-white font-bold text-2xl">3rd</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white">{topThree[2].name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{topThree[2].score.toLocaleString()} pts</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )}

  {/* Leaderboard Table */}
  <Card>
    <CardHeader>
      <CardTitle>Full Rankings</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {remaining.map((entry) => (
          <div
            key={entry.orgId}
            className={`flex items-center justify-between p-4 rounded-lg transition-all ${
              entry.isCurrentOrg
                ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-2 border-blue-600 dark:border-blue-400'
                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center space-x-4 flex-1">
              {getRankBadge(entry.rank)}
              <Avatar className="h-12 w-12">
                {entry.logo ? (
                  <img src={entry.logo} alt={entry.name} />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {entry.name[0]}
                  </div>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className={`font-bold ${entry.isCurrentOrg ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                    {entry.name}
                  </p>
                  {entry.isCurrentOrg && (
                    <Badge className="bg-blue-600 text-white">You</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{entry.industry}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {entry.score.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">points</p>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(entry.trend)}
                {entry.trend !== 0 && (
                  <span className={`text-sm font-medium ${
                    entry.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(entry.trend)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
</div>
);
}