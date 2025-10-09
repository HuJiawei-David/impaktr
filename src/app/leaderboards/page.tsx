'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
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

export default function LeaderboardsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  const scrollToMyProgress = () => {
    const progressSection = document.getElementById('your-progress');
    if (progressSection) {
      progressSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Impact Leaderboards
              </h1>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                See who's making the biggest difference. Compete, collaborate, and celebrate impact achievements together.
              </p>
            </div>
            <div className="flex flex-col items-end space-y-3">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={scrollToMyProgress}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View My Ranking
              </Button>
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Updated every hour</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Progress */}
        <div id="your-progress" className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Progress</h2>
              </div>
              
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  #247
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Current Rank
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                  ↑ Up 23 positions
                </p>
              </div>
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  2,847
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Impact Points
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  +156 this week
                </p>
              </div>
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  12
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Badges Earned
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 font-medium">
                  2 new this month
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Progress to next rank (#246)
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  2,847 / 2,950 points
                </span>
              </div>
              <div className="relative">
                <Progress value={96} className="h-4 bg-gray-200 dark:bg-gray-700" />
                <div className="absolute top-0 left-0 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500" style={{ width: '96%' }} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium">
                Only 103 points to go! 🎯
              </p>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Top Impact Makers
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Celebrating our community's most dedicated volunteers</p>
            </div>
            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300">
              <Filter className="w-4 h-4 mr-2" />
              Filter Period
            </Button>
          </div>

          <div className="space-y-6">
            {topPerformers.map((performer) => (
              <Card key={performer.rank} className={`transition-all duration-300 hover:shadow-xl border-0 ${
                performer.rank <= 3 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 ring-2 ring-yellow-200 dark:ring-yellow-800' 
                  : 'bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl'
              }`}>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-4">
                        {getRankIcon(performer.rank)}
                        <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-gray-700 shadow-lg">
                          <AvatarImage src={performer.avatar} alt={performer.name} />
                          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {performer.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {performer.name}
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                          {performer.specialty}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{performer.hoursVolunteered} hours</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{performer.eventsJoined} events</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Award className="w-4 h-4" />
                            <span>{performer.badges} badges</span>
                          </div>
                        </div>
                      </div>
                    </div>
            
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {performer.points.toLocaleString()}
                      </div>
                      <div className={`flex items-center justify-end space-x-1 text-sm font-medium ${
                        performer.trend === 'up' ? 'text-green-600' : 'text-red-500'
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Special Achievements
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Recognizing outstanding contributions and milestones</p>
                            </div>
                            
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <Card key={index} className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border-0 hover:scale-105">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 rounded-full ${achievement.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                            </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {achievement.subtitle}
                    </p>
                    <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {achievement.winner}
                          </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                      {achievement.value}
                        </div>
                      </CardContent>
                    </Card>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-100 via-purple-50 to-cyan-100 dark:from-blue-900/30 dark:via-purple-900/20 dark:to-cyan-900/30 border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Ready to climb the leaderboard?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Join the competition and start making measurable impact. Track your progress, earn badges, and celebrate achievements with the community.
              </p>
              <Link href="/events">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Making Impact
                </Button>
              </Link>
            </CardContent>
          </Card>
            </div>
      </div>
    </div>
  );
}