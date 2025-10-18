'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Medal, 
  Award,
  Crown, 
  Star,
  TrendingUp, 
  TrendingDown,
  Minus,
  Users, 
  Calendar,
  Target,
  Zap,
  Globe,
  Heart,
  Building2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Filter,
  Clock,
  BarChart3,
  Leaf,
  MapPin,
  Search,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sdgs } from '@/constants/sdgs';
import { countries } from '@/constants/countries';

// Mock data for demo
const mockIndividualUsers = [
  { id: '1', name: 'Sarah Chen', image: '', impactScore: 2847, volunteerHours: 156, eventsJoined: 24, badgesEarned: 18, rank: 1, tier: 'PLATINUM', trend: 2, specialty: 'SDG 13: Climate Action', location: { city: 'San Francisco', country: 'United States' } },
  { id: '2', name: 'David Rodriguez', image: '', impactScore: 2634, volunteerHours: 142, eventsJoined: 21, badgesEarned: 16, rank: 2, tier: 'GOLD', trend: 1, specialty: 'SDG 4: Quality Education', location: { city: 'Madrid', country: 'Spain' } },
  { id: '3', name: 'Emma Thompson', image: '', impactScore: 2489, volunteerHours: 138, eventsJoined: 19, badgesEarned: 15, rank: 3, tier: 'GOLD', trend: -1, specialty: 'SDG 3: Good Health', location: { city: 'London', country: 'United Kingdom' } },
  { id: '4', name: 'Michael Zhang', image: '', impactScore: 2356, volunteerHours: 129, eventsJoined: 18, badgesEarned: 14, rank: 4, tier: 'GOLD', trend: 3, specialty: 'SDG 7: Clean Energy', location: { city: 'Singapore', country: 'Singapore' } },
  { id: '5', name: 'Sofia Martinez', image: '', impactScore: 2198, volunteerHours: 121, eventsJoined: 17, badgesEarned: 13, rank: 5, tier: 'SILVER', trend: 0, specialty: 'SDG 2: Zero Hunger', location: { city: 'Mexico City', country: 'Mexico' } },
  { id: '6', name: 'James Wilson', image: '', impactScore: 2087, volunteerHours: 115, eventsJoined: 16, badgesEarned: 12, rank: 6, tier: 'SILVER', trend: 2, specialty: 'SDG 14: Life Below Water', location: { city: 'Vancouver', country: 'Canada' } },
  { id: '7', name: 'Priya Patel', image: '', impactScore: 1945, volunteerHours: 108, eventsJoined: 15, badgesEarned: 11, rank: 7, tier: 'SILVER', trend: -2, specialty: 'SDG 5: Gender Equality', location: { city: 'Mumbai', country: 'India' } },
  { id: '8', name: 'Lucas Silva', image: '', impactScore: 1834, volunteerHours: 102, eventsJoined: 14, badgesEarned: 10, rank: 8, tier: 'BRONZE', trend: 1, specialty: 'SDG 15: Life on Land', location: { city: 'São Paulo', country: 'Brazil' } },
  { id: '9', name: 'Yuki Tanaka', image: '', impactScore: 1723, volunteerHours: 96, eventsJoined: 13, badgesEarned: 9, rank: 9, tier: 'BRONZE', trend: 1, specialty: 'SDG 11: Sustainable Cities', location: { city: 'Tokyo', country: 'Japan' } },
  { id: '10', name: 'Anna Kowalski', image: '', impactScore: 1612, volunteerHours: 89, eventsJoined: 12, badgesEarned: 8, rank: 10, tier: 'BRONZE', trend: 0, specialty: 'SDG 10: Reduced Inequalities', location: { city: 'Warsaw', country: 'Poland' } },
];

const mockOrganizationRankings = [
  { id: '1', name: 'GreenTech Solutions', logo: '', type: 'Technology', impactScore: 15847, esgScore: 94, rank: 1, tier: 'PLATINUM', location: { city: 'San Francisco', country: 'United States' }, stats: { members: 234, events: 48 } },
  { id: '2', name: 'EcoWarriors Foundation', logo: '', type: 'Non-Profit', impactScore: 14523, esgScore: 92, rank: 2, tier: 'GOLD', location: { city: 'London', country: 'United Kingdom' }, stats: { members: 198, events: 42 } },
  { id: '3', name: 'Community Care Network', logo: '', type: 'Community Organization', impactScore: 13876, esgScore: 89, rank: 3, tier: 'GOLD', location: { city: 'Toronto', country: 'Canada' }, stats: { members: 187, events: 39 } },
  { id: '4', name: 'Global Impact Corp', logo: '', type: 'Corporate', impactScore: 12654, esgScore: 86, rank: 4, tier: 'GOLD', location: { city: 'Singapore', country: 'Singapore' }, stats: { members: 156, events: 36 } },
  { id: '5', name: 'Youth for Change', logo: '', type: 'Youth Organization', impactScore: 11234, esgScore: 84, rank: 5, tier: 'SILVER', location: { city: 'Berlin', country: 'Germany' }, stats: { members: 142, events: 32 } },
  { id: '6', name: 'Sustainable Future Co', logo: '', type: 'Social Enterprise', impactScore: 10987, esgScore: 82, rank: 6, tier: 'SILVER', location: { city: 'Melbourne', country: 'Australia' }, stats: { members: 128, events: 29 } },
  { id: '7', name: 'Clean Ocean Initiative', logo: '', type: 'Environmental', impactScore: 9876, esgScore: 79, rank: 7, tier: 'SILVER', location: { city: 'Auckland', country: 'New Zealand' }, stats: { members: 115, events: 27 } },
  { id: '8', name: 'Education For All', logo: '', type: 'Education', impactScore: 9234, esgScore: 76, rank: 8, tier: 'BRONZE', location: { city: 'Nairobi', country: 'Kenya' }, stats: { members: 103, events: 24 } },
  { id: '9', name: 'Health Heroes', logo: '', type: 'Healthcare', impactScore: 8765, esgScore: 74, rank: 9, tier: 'BRONZE', location: { city: 'Stockholm', country: 'Sweden' }, stats: { members: 98, events: 22 } },
  { id: '10', name: 'Tech For Good', logo: '', type: 'Technology', impactScore: 8234, esgScore: 71, rank: 10, tier: 'BRONZE', location: { city: 'Amsterdam', country: 'Netherlands' }, stats: { members: 89, events: 20 } },
];

export default function DemoLeaderboardsPage() {
  const [leaderboardType, setLeaderboardType] = useState<'individuals' | 'organizations'>('individuals');
  const [sdgFilter, setSdgFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all_time');
  const [countryFilter, setCountryFilter] = useState('all');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0';
      case 'GOLD': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0';
      case 'SILVER': return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 border-0';
      case 'BRONZE': return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500">
        <Crown className="w-6 h-6 text-white" />
      </div>
    );
    if (rank === 2) return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500">
        <Medal className="w-6 h-6 text-white" />
      </div>
    );
    if (rank === 3) return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
        <Award className="w-6 h-6 text-white" />
      </div>
    );
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">#{rank}</span>
      </div>
    );
  };

  const getTrendIndicator = (trend: number | undefined) => {
    if (!trend || trend === 0) {
      return (
        <div className="flex items-center text-gray-400">
          <Minus className="w-4 h-4" />
        </div>
      );
    }
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">+{trend}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-red-500">
        <TrendingDown className="w-4 h-4 mr-1" />
        <span className="text-xs font-medium">{trend}</span>
      </div>
    );
  };

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const currentUserMock = mockIndividualUsers[4]; // Sofia Martinez as the "current user"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* Demo Preview Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Type Switcher */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            onClick={() => setLeaderboardType('individuals')}
            variant={leaderboardType === 'individuals' ? 'default' : 'outline'}
            className={leaderboardType === 'individuals' ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' : ''}
          >
            <Users className="w-4 h-4 mr-2" />
            Individuals
          </Button>
          <Button
            onClick={() => setLeaderboardType('organizations')}
            variant={leaderboardType === 'organizations' ? 'default' : 'outline'}
            className={leaderboardType === 'organizations' ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' : ''}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Organizations
          </Button>
        </div>

        {/* Header Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  {leaderboardType === 'individuals' ? (
                    <Trophy className="h-8 w-8 text-white" />
                  ) : (
                    <Building2 className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leaderboardType === 'individuals' ? 'Individual Leaderboard' : 'Organization Leaderboard'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {leaderboardType === 'individuals' 
                      ? 'See how you rank against other volunteers'
                      : 'Compare organizations by their social impact'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leaderboardType === 'individuals' ? '10,247' : '1,342'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {leaderboardType === 'individuals' ? 'Volunteers' : 'Organizations'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current User Card - Only for individuals */}
        {leaderboardType === 'individuals' && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-2xl">
                      {currentUserMock.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUserMock.name}</h2>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {currentUserMock.location.city}, {currentUserMock.location.country}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getTierColor(currentUserMock.tier)}>
                        {currentUserMock.tier}
                      </Badge>
                      <Badge variant="outline">
                        {currentUserMock.specialty}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end mb-2">
                    {getRankBadge(currentUserMock.rank)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Rank</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {currentUserMock.impactScore.toLocaleString()} pts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-64">
                <Select value={sdgFilter} onValueChange={setSdgFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="SDG" />
                  </SelectTrigger>
                  <SelectContent 
                    className="max-h-80 overflow-y-auto" 
                    position="popper" 
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    avoidCollisions={false}
                  >
                    <SelectItem value="all">All SDGs</SelectItem>
                    {sdgs.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.id}. {s.shortTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-48">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">This Month</SelectItem>
                    <SelectItem value="yearly">This Year</SelectItem>
                    <SelectItem value="all_time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-64 country-dropdown-container relative">
                <Button
                  variant="outline"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="h-10 w-full justify-between"
                >
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    {countryFilter === 'all' ? 'All Countries' : 
                      countries.find(c => c.name === countryFilter)?.name || 'All Countries'
                    }
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                </Button>
                
                {showCountryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto">
                      <button
                        onClick={() => {
                          setCountryFilter('all');
                          setShowCountryDropdown(false);
                          setCountrySearch('');
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          countryFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        All Countries
                      </button>
                      {filteredCountries.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setCountryFilter(country.name);
                            setShowCountryDropdown(false);
                            setCountrySearch('');
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            countryFilter === country.name ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {country.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Leaderboard */}
        {leaderboardType === 'individuals' && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Top Volunteers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockIndividualUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        {getRankBadge(user.rank)}
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                            <span>{user.name}</span>
                            {user.rank <= 3 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                          </div>
                          {user.location && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {user.location.city && `${user.location.city}, `}
                              {user.location.country}
                            </div>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            {user.tier && (
                              <Badge className={getTierColor(user.tier)} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                {user.tier}
                              </Badge>
                            )}
                            {user.specialty && (
                              <Badge variant="outline" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                {user.specialty}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
            
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-center">
                            <p className="font-semibold">{user.volunteerHours.toLocaleString()}</p>
                            <p className="text-muted-foreground text-xs">Hours</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{user.eventsJoined}</p>
                            <p className="text-muted-foreground text-xs">Events</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{user.badgesEarned}</p>
                            <p className="text-muted-foreground text-xs">Badges</p>
                          </div>
                        </div>
                        
                        <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                        
                        <div className="text-center min-w-[100px]">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <p className="font-bold text-lg text-gray-900 dark:text-white">{user.impactScore.toLocaleString()}</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Impact Score</p>
                        </div>
                        
                        <div className="min-w-[50px] flex justify-center">
                          {getTrendIndicator(user.trend)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Highlights Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📊 Highlights</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="hover:shadow-sm transition">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Most Events Joined</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{mockIndividualUsers[0].name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{mockIndividualUsers[0].eventsJoined} events</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-sm transition">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3">
                      <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Most Volunteer Hours</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{mockIndividualUsers[0].name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{mockIndividualUsers[0].volunteerHours.toLocaleString()} hrs</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-sm transition">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Most Badges Earned</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{mockIndividualUsers[0].name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{mockIndividualUsers[0].badgesEarned} badges</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Organization Leaderboard */}
        {leaderboardType === 'organizations' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                <span>Top Organizations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockOrganizationRankings.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      {getRankBadge(org.rank)}
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold">
                          {org.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                          <span>{org.name}</span>
                          {org.rank <= 3 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{org.type}</div>
                        {org.location && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {org.location.city && `${org.location.city}, `}
                            {org.location.country}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{org.stats?.members || 0}</p>
                          <p className="text-muted-foreground text-xs">Members</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{org.stats?.events || 0}</p>
                          <p className="text-muted-foreground text-xs">Events</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{org.esgScore || 0}</p>
                          <p className="text-muted-foreground text-xs">ESG Score</p>
                        </div>
                      </div>
                      
                      <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                      
                      <div className="text-center min-w-[100px]">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <Zap className="w-4 h-4 text-orange-500" />
                          <p className="font-bold text-lg text-gray-900 dark:text-white">{org.impactScore.toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Impact Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 py-12 px-8 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 text-center">
          <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Climb the Leaderboard?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">Join more events, volunteer more hours, and earn badges to boost your impact score.</p>
          <Link href="/events">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Sparkles className="w-5 h-5 mr-2" />
              Find Events to Join
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
