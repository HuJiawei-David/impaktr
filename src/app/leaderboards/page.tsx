// home/ubuntu/impaktrweb/src/app/leaderboards/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users, 
  Globe,
  Flag,
  Building2,
  Award,
  Filter,
  Search,
  Calendar,
  Star,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { formatScore, formatNumber, getInitials, getRankColor, getSDGColor, getSDGName } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  location?: {
    city: string;
    country: string;
  };
  score: number;
  rankTitle: string;
  badges: Array<{
    sdg: number;
    tier: string;
    name: string;
    earned: boolean;
  }>;
  stats: {
    verifiedHours: number;
    certificates: number;
    eventsJoined?: number;
    members?: number;
  };
  change?: number; // Position change from last period
}

interface CountryLeaderboardEntry {
  rank: number;
  country: string;
  flag: string;
  userCount: number;
  avgScore: number;
  totalScore: number;
  totalEvents: number;
}

export default function LeaderboardsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('individuals');
  const [timePeriod, setTimePeriod] = useState('all_time');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSDG, setSelectedSDG] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [individualLeaderboard, setIndividualLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [organizationLeaderboard, setOrganizationLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [countryLeaderboard, setCountryLeaderboard] = useState<CountryLeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    fetchLeaderboards();
  }, [session, status, activeTab, timePeriod, selectedCountry, selectedSDG]);

  const fetchLeaderboards = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        period: timePeriod,
        ...(selectedCountry && { country: selectedCountry }),
        ...(selectedSDG && { sdg: selectedSDG }),
        ...(searchQuery && { search: searchQuery }),
        limit: '50'
      });

      const response = await fetch(`/api/leaderboards?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        switch (activeTab) {
          case 'individuals':
            setIndividualLeaderboard(data.rankings);
            // Find user's position if they're in top 50
            const userPos = data.rankings.find((entry: LeaderboardEntry) => 
              entry.id === session?.user?.id
            );
            setUserPosition(userPos || null);
            break;
          case 'organizations':
            setOrganizationLeaderboard(data.rankings);
            break;
          case 'countries':
            setCountryLeaderboard(data.rankings);
            break;
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLeaderboards();
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Trophy className="w-5 h-5 text-muted-foreground" />;
  };

  const getPositionChangeIcon = (change?: number) => {
    if (!change) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    return null;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Impact Leaderboards
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the top changemakers, organizations, and countries creating the most verified social impact
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-40">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-40">
                  <Flag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Countries</SelectItem>
                  <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
                  <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                  <SelectItem value="Thailand">🇹🇭 Thailand</SelectItem>
                  <SelectItem value="Indonesia">🇮🇩 Indonesia</SelectItem>
                  <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                  <SelectItem value="United States">🇺🇸 United States</SelectItem>
                  <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSDG} onValueChange={setSelectedSDG}>
                <SelectTrigger className="w-40">
                  <Target className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All SDGs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All SDGs</SelectItem>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((sdg) => (
                    <SelectItem key={sdg} value={sdg.toString()}>
                      SDG {sdg}: {getSDGName(sdg).split(' ').slice(0, 2).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User's Current Position */}
        {userPosition && activeTab === 'individuals' && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      #{userPosition.rank}
                    </Badge>
                    {getRankIcon(userPosition.rank)}
                  </div>
                  <div>
                    <h3 className="font-semibold">Your Current Position</h3>
                    <p className="text-sm text-muted-foreground">
                      {userPosition.location?.country} • {formatScore(userPosition.score)} points
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold brand-gradient-text">
                    {formatScore(userPosition.score)}
                  </div>
                  <div className="text-sm text-muted-foreground">Impact Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Leaderboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="individuals" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Individuals</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Organizations</span>
            </TabsTrigger>
            <TabsTrigger value="countries" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Countries</span>
            </TabsTrigger>
          </TabsList>

          {/* Individuals Leaderboard */}
          <TabsContent value="individuals">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                        <div className="w-20 h-8 bg-muted rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {individualLeaderboard.map((entry, index) => (
                  <Card key={entry.id} className={`transition-all hover:shadow-lg ${
                    entry.rank <= 3 ? 'ring-2 ring-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Rank */}
                          <div className="flex items-center space-x-2 min-w-[60px]">
                            <Badge 
                              variant={entry.rank <= 3 ? "default" : "secondary"}
                              className="text-lg px-3 py-1"
                            >
                              #{entry.rank}
                            </Badge>
                            {getRankIcon(entry.rank)}
                            {getPositionChangeIcon(entry.change)}
                          </div>

                          {/* Avatar and Info */}
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={entry.avatar} alt={entry.name} />
                            <AvatarFallback className="text-lg font-semibold">
                              {getInitials(entry.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{entry.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              {entry.location && (
                                <span className="flex items-center">
                                  <Flag className="w-3 h-3 mr-1" />
                                  {entry.location.city}, {entry.location.country}
                                </span>
                              )}
                              <Badge 
                                variant="outline"
                                style={{ 
                                  borderColor: getRankColor(entry.rankTitle),
                                  color: getRankColor(entry.rankTitle)
                                }}
                              >
                                {entry.rankTitle}
                              </Badge>
                            </div>
                            
                            {/* Stats */}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span>{formatNumber(entry.stats.verifiedHours)} hours</span>
                              <span>{entry.stats.certificates} certificates</span>
                              {entry.stats.eventsJoined && (
                                <span>{entry.stats.eventsJoined} events</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Score and Badges */}
                        <div className="text-right space-y-2">
                          <div className="text-2xl font-bold brand-gradient-text">
                            {formatScore(entry.score)}
                          </div>
                          <div className="text-sm text-muted-foreground">Impact Score</div>
                          
                          {/* SDG Badges */}
                          <div className="flex flex-wrap justify-end gap-1 max-w-[200px]">
                            {entry.badges.slice(0, 4).map((badge) => (
                              <Badge
                                key={`${badge.sdg}-${badge.tier}`}
                                variant="sdg"
                                sdgNumber={badge.sdg}
                                className="text-xs"
                              >
                                {badge.sdg}
                              </Badge>
                            ))}
                            {entry.badges.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{entry.badges.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Organizations Leaderboard */}
          <TabsContent value="organizations">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/3"></div>
                        </div>
                        <div className="w-20 h-8 bg-muted rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {organizationLeaderboard.map((entry) => (
                  <Card key={entry.id} className={`transition-all hover:shadow-lg ${
                    entry.rank <= 3 ? 'ring-2 ring-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 min-w-[60px]">
                            <Badge 
                              variant={entry.rank <= 3 ? "default" : "secondary"}
                              className="text-lg px-3 py-1"
                            >
                              #{entry.rank}
                            </Badge>
                            {getRankIcon(entry.rank)}
                          </div>

                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            {entry.avatar ? (
                              <img src={entry.avatar} alt={entry.name} className="w-16 h-16 rounded-lg object-cover" />
                            ) : (
                              <Building2 className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{entry.name}</h3>
                            {entry.location && (
                              <p className="text-sm text-muted-foreground">
                                {entry.location.city}, {entry.location.country}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              {entry.stats.members && <span>{formatNumber(entry.stats.members)} members</span>}
                              <span>{entry.stats.verifiedHours} total hours</span>
                              <span>{entry.stats.certificates} certificates issued</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <div className="text-2xl font-bold text-blue-600">
                            {entry.score.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">Org Score</div>
                          
                          <div className="flex flex-wrap justify-end gap-1 max-w-[200px]">
                            {entry.badges.slice(0, 4).map((badge) => (
                              <Badge
                                key={`${badge.sdg}-${badge.tier}`}
                                variant="sdg"
                                sdgNumber={badge.sdg}
                                className="text-xs"
                              >
                                {badge.sdg}
                              </Badge>
                            ))}
                            {entry.badges.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{entry.badges.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Countries Leaderboard */}
          <TabsContent value="countries">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-8 bg-muted rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                        <div className="w-20 h-8 bg-muted rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {countryLeaderboard.map((entry) => (
                  <Card key={entry.country} className={`transition-all hover:shadow-lg ${
                    entry.rank <= 3 ? 'ring-2 ring-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 min-w-[60px]">
                            <Badge 
                              variant={entry.rank <= 3 ? "default" : "secondary"}
                              className="text-lg px-3 py-1"
                            >
                              #{entry.rank}
                            </Badge>
                            {getRankIcon(entry.rank)}
                          </div>

                          <div className="text-4xl">{entry.flag}</div>

                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{entry.country}</h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {formatNumber(entry.userCount)} users
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatNumber(entry.totalEvents)} events
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <div className="text-2xl font-bold text-green-600">
                            {formatScore(entry.totalScore)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Impact</div>
                          <div className="text-xs text-muted-foreground">
                            Avg: {formatScore(entry.avgScore)} per user
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-4">Ready to Climb the Leaderboard?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join verified events, earn SDG badges, and increase your Impact Score to rise through the ranks
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" asChild>
                <a href="/events">Find Events</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/dashboard">View Your Progress</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}