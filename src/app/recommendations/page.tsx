'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  MapPin, 
  Clock, 
  Users, 
  Calendar,
  Briefcase,
  Filter,
  Search,
  Heart,
  Bookmark,
  Share2,
  TrendingUp,
  Star,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Recommendation {
  id: string;
  type: 'event' | 'opportunity' | 'user';
  title: string;
  description: string;
  matchScore: number;
  // Event specific
  startDate?: string;
  endDate?: string;
  location?: string;
  imageUrl?: string;
  sdg?: string;
  organization?: any;
  stats?: any;
  hasApplied?: boolean;
  // Opportunity specific
  requirements?: string[];
  spots?: number;
  spotsFilled?: number;
  deadline?: string;
  isRemote?: boolean;
  skills?: string[];
  // User specific
  name?: string;
  bio?: string;
  image?: string;
  city?: string;
  country?: string;
  tier?: string;
  badges?: any[];
}

export default function RecommendationsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('events');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('matchScore');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      redirect('/signin');
    }

    fetchRecommendations();
  }, [session, status, activeTab]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/recommendations?type=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/participate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update the recommendation to show it's applied
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === eventId ? { ...rec, hasApplied: true } : rec
          )
        );
      }
    } catch (error) {
      console.error('Error applying to event:', error);
    }
  };

  const handleApplyToOpportunity = async (opportunityId: string) => {
    try {
      const response = await fetch(`/api/organization/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'I am interested in this opportunity and would like to apply.',
        }),
      });
      
      if (response.ok) {
        // Update the recommendation to show it's applied
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === opportunityId ? { ...rec, hasApplied: true } : rec
          )
        );
      }
    } catch (error) {
      console.error('Error applying to opportunity:', error);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update the recommendation to show it's followed
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === userId ? { ...rec, isFollowed: true } : rec
          )
        );
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  };

  const filteredRecommendations = recommendations.filter(rec =>
    rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    if (sortBy === 'matchScore') {
      return b.matchScore - a.matchScore;
    } else if (sortBy === 'date') {
      return new Date(b.startDate || b.deadline || '').getTime() - new Date(a.startDate || a.deadline || '').getTime();
    }
    return 0;
  });

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-[10px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pt-2 pb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Recommendations
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Personalized opportunities and connections for you
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    AI Powered
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="pt-3 pb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search recommendations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matchScore">Best Match</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Type Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'events'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2 inline-block" />
            Events
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'opportunities'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Briefcase className="w-4 h-4 mr-2 inline-block" />
            Opportunities
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2 inline-block" />
            People
          </button>
        </div>

        {/* Main Content */}
        <div className="pb-8">
          <div className="space-y-4">
            {activeTab === 'events' && (
              <div className="space-y-4">
                {sortedRecommendations.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Event Recommendations Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Complete your profile and participate in events to get personalized recommendations.
                      </p>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Browse All Events
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  sortedRecommendations.map((rec) => (
                <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {rec.title}
                          </h3>
                          <Badge className={getMatchScoreColor(rec.matchScore)}>
                            {rec.matchScore}% Match
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {rec.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(rec.startDate!).toLocaleDateString()}</span>
                          </div>
                          {rec.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{rec.location}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{rec.stats?.participants}/{rec.stats?.maxParticipants} participants</span>
                          </div>
                          {rec.sdg && (
                            <Badge variant="outline">SDG {rec.sdg}</Badge>
                          )}
                        </div>

                        {rec.organization && (
                          <div className="flex items-center space-x-2 mb-3">
                            <Avatar className="h-6 w-6">
                              {rec.organization.logo && (
                                <AvatarImage src={rec.organization.logo} alt={rec.organization.name} />
                              )}
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                                {rec.organization.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {rec.organization.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {getMatchScoreLabel(rec.matchScore)}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Based on your interests and skills
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Bookmark className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                            <Button 
                              onClick={() => handleApplyToEvent(rec.id)}
                              disabled={rec.hasApplied}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              {rec.hasApplied ? 'Applied' : 'Apply'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div className="space-y-4">
                {sortedRecommendations.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Opportunity Recommendations Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Update your skills and preferences to get personalized opportunity recommendations.
                      </p>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Browse All Opportunities
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  sortedRecommendations.map((rec) => (
                <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {rec.title}
                          </h3>
                          <Badge className={getMatchScoreColor(rec.matchScore)}>
                            {rec.matchScore}% Match
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {rec.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{rec.spotsFilled}/{rec.spots} filled</span>
                          </div>
                          {rec.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{rec.location}</span>
                            </div>
                          )}
                          {rec.deadline && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>Deadline: {new Date(rec.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          {rec.isRemote && (
                            <Badge variant="outline">Remote</Badge>
                          )}
                        </div>

                        {rec.requirements && rec.requirements.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements:</h4>
                            <div className="flex flex-wrap gap-1">
                              {rec.requirements.map((req, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.skills && rec.skills.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills:</h4>
                            <div className="flex flex-wrap gap-1">
                              {rec.skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {getMatchScoreLabel(rec.matchScore)}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Based on your skills and location
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Bookmark className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button 
                              onClick={() => handleApplyToOpportunity(rec.id)}
                              disabled={rec.hasApplied}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              {rec.hasApplied ? 'Applied' : 'Apply'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                {sortedRecommendations.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No People Recommendations Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Complete your profile and connect with others to get personalized people recommendations.
                      </p>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Explore Community
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  sortedRecommendations.map((rec) => (
                <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        {rec.image && (
                          <AvatarImage src={rec.image} alt={rec.name} />
                        )}
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg">
                          {rec.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {rec.name}
                          </h3>
                          <Badge className={getMatchScoreColor(rec.matchScore)}>
                            {rec.matchScore}% Match
                          </Badge>
                          <Badge variant="outline">{rec.tier}</Badge>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {rec.bio}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {rec.city && rec.country && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{rec.city}, {rec.country}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{rec.stats?.participations} events</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{rec.stats?.followers} followers</span>
                          </div>
                        </div>

                        {rec.skills && rec.skills.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills:</h4>
                            <div className="flex flex-wrap gap-1">
                              {rec.skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {getMatchScoreLabel(rec.matchScore)}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Similar interests and activities
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Heart className="h-4 w-4 mr-1" />
                              Like
                            </Button>
                            <Button 
                              onClick={() => handleFollowUser(rec.id)}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              Follow
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
