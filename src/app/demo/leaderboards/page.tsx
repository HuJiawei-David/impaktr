'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  TrendingUp,
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
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export default function LeaderboardsDemo() {
  const topPerformers = [
    {
      rank: 1,
      name: 'Alex Chen',
      avatar: '/api/placeholder/64/64',
      points: 15847,
      change: '+245',
      trend: 'up',
      badges: 28,
      hoursVolunteered: 340,
      eventsJoined: 45,
      specialty: 'Environmental Activism'
    },
    {
      rank: 2,
      name: 'Maria Rodriguez',
      avatar: '/api/placeholder/64/64',
      points: 14523,
      change: '+189',
      trend: 'up',
      badges: 25,
      hoursVolunteered: 298,
      eventsJoined: 38,
      specialty: 'Community Development'
    },
    {
      rank: 3,
      name: 'David Kim',
      avatar: '/api/placeholder/64/64',
      points: 13891,
      change: '+156',
      trend: 'up',
      badges: 23,
      hoursVolunteered: 275,
      eventsJoined: 42,
      specialty: 'Education Support'
    },
    {
      rank: 4,
      name: 'Sarah Johnson',
      avatar: '/api/placeholder/64/64',
      points: 12765,
      change: '-23',
      trend: 'down',
      badges: 21,
      hoursVolunteered: 256,
      eventsJoined: 34,
      specialty: 'Healthcare Volunteer'
    },
    {
      rank: 5,
      name: 'Michael Brown',
      avatar: '/api/placeholder/64/64',
      points: 11934,
      change: '+78',
      trend: 'up',
      badges: 19,
      hoursVolunteered: 234,
      eventsJoined: 29,
      specialty: 'Youth Mentorship'
    }
  ];

  const categories = [
    {
      title: 'Environmental Champions',
      icon: Globe,
      color: 'bg-green-500',
      leaders: [
        { name: 'Alex Chen', points: 5847, avatar: '/api/placeholder/32/32' },
        { name: 'Emma Wilson', points: 4923, avatar: '/api/placeholder/32/32' },
        { name: 'James Park', points: 4156, avatar: '/api/placeholder/32/32' }
      ]
    },
    {
      title: 'Community Heroes',
      icon: Heart,
      color: 'bg-red-500',
      leaders: [
        { name: 'Maria Rodriguez', points: 6234, avatar: '/api/placeholder/32/32' },
        { name: 'Lisa Chang', points: 5789, avatar: '/api/placeholder/32/32' },
        { name: 'Tom Anderson', points: 4567, avatar: '/api/placeholder/32/32' }
      ]
    },
    {
      title: 'Education Advocates',
      icon: Building2,
      color: 'bg-blue-500',
      leaders: [
        { name: 'David Kim', points: 5432, avatar: '/api/placeholder/32/32' },
        { name: 'Rachel Green', points: 4876, avatar: '/api/placeholder/32/32' },
        { name: 'Mark Taylor', points: 4234, avatar: '/api/placeholder/32/32' }
      ]
    }
  ];

  const achievements = [
    {
      title: 'Most Volunteer Hours',
      subtitle: 'This Month',
      winner: 'Alex Chen',
      value: '45 hours',
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      title: 'Event Organizer',
      subtitle: 'Most Events Created',
      winner: 'Maria Rodriguez',
      value: '12 events',
      icon: Calendar,
      color: 'bg-orange-500'
    },
    {
      title: 'Rising Star',
      subtitle: 'Biggest Point Gain',
      winner: 'David Kim',
      value: '+890 points',
      icon: TrendingUp,
      color: 'bg-cyan-500'
    },
    {
      title: 'Team Player',
      subtitle: 'Most Collaborations',
      winner: 'Sarah Johnson',
      value: '28 collaborations',
      icon: Users,
      color: 'bg-pink-500'
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold">{rank}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
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

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-6 text-yellow-200" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Impact Leaderboards
          </h1>
          <p className="text-xl text-yellow-100 mb-8 max-w-3xl mx-auto">
            See who's making the biggest difference. Compete, collaborate, and celebrate impact achievements together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-4 text-lg">
              <BarChart3 className="w-5 h-5 mr-2" />
              View My Ranking
            </Button>
            <div className="text-white/80 text-sm">
              Updated every hour
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        {/* Top Performers */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Top Impact Makers
            </h2>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter Period
            </Button>
          </div>

          <div className="space-y-4">
            {topPerformers.map((performer) => (
              <Card key={performer.rank} className={`transition-all duration-300 hover:shadow-lg ${performer.rank <= 3 ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        {getRankIcon(performer.rank)}
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={performer.avatar} alt={performer.name} />
                          <AvatarFallback>{performer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {performer.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {performer.specialty}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{performer.hoursVolunteered} hours</span>
                          <span>{performer.eventsJoined} events</span>
                          <span>{performer.badges} badges</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {performer.points.toLocaleString()}
                      </div>
                      <div className={`flex items-center justify-end space-x-1 text-sm ${
                        performer.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {performer.trend === 'up' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <span>{performer.change}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        impact points
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Category Leaders */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Category Leaders
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${category.color}`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-lg">{category.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {category.leaders.map((leader, leaderIndex) => (
                      <div key={leaderIndex} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 w-4">
                            {leaderIndex + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={leader.avatar} alt={leader.name} />
                            <AvatarFallback className="text-xs">
                              {leader.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {leader.name}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {leader.points.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Special Achievements */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Special Achievements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full ${achievement.color} flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {achievement.subtitle}
                    </p>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {achievement.winner}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Your Progress */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Your Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  #247
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current Rank
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ↑ Up 23 positions
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  2,847
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Impact Points
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  +156 this week
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  12
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Badges Earned
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  2 new this month
                </p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Progress to next rank (#246)
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  2,847 / 2,950 points
                </span>
              </div>
              <Progress value={96} className="h-3" />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Only 103 points to go!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-8">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to climb the leaderboard?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Join the competition and start making measurable impact. Track your progress, earn badges, and celebrate achievements with the community.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Competing Today
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}







