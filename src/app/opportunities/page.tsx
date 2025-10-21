'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Search,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Globe,
  Building,
  GraduationCap,
  Heart,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import { sdgs } from '@/constants/sdgs';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  spots: number;
  spotsFilled: number;
  deadline?: string;
  location?: string;
  isRemote: boolean;
  skills: string[];
  sdg?: string;
  status: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    logo?: string;
    tier: string;
  };
  stats: {
    totalApplications: number;
    spotsRemaining: number;
    appliedCount: number;
    acceptedCount: number;
    rejectedCount: number;
  };
  isBookmarked?: boolean;
  isApplied?: boolean;
}

export default function OpportunitiesPage() {
  const { data: session } = useSession();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [sdgFilter, setSdgFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('recent');
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [bookmarkedOpportunities, setBookmarkedOpportunities] = useState<string[]>([]);
  const [appliedOpportunities, setAppliedOpportunities] = useState<string[]>([]);

  const fetchOpportunities = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchTerm,
        location: locationFilter,
        sdg: sdgFilter.join(','),
        sort: sortBy,
      });

      const response = await fetch(`/api/opportunities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.opportunities);
        
        // Initialize bookmark and application states from API data
        const bookmarkedIds = data.opportunities
          .filter((opp: Opportunity) => opp.isBookmarked)
          .map((opp: Opportunity) => opp.id);
        setBookmarkedOpportunities(bookmarkedIds);
        
        const appliedIds = data.opportunities
          .filter((opp: Opportunity) => opp.isApplied)
          .map((opp: Opportunity) => opp.id);
        setAppliedOpportunities(appliedIds);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Failed to fetch opportunities');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, locationFilter, statusFilter, sdgFilter, sortBy]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleApply = async (opportunityId: string) => {
    if (!session) {
      toast.error('Please sign in to apply');
      return;
    }

    try {
      setIsApplying(opportunityId);
      const response = await fetch(`/api/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'I am interested in this opportunity and would like to apply.',
        }),
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        setAppliedOpportunities(prev => [...prev, opportunityId]);
        fetchOpportunities(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to apply');
      }
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to apply to opportunity');
    } finally {
      setIsApplying(null);
    }
  };

  const handleBookmark = async (opportunityId: string) => {
    console.log('handleBookmark called with:', opportunityId);
    console.log('session:', session);
    
    if (!session) {
      toast.error('Please sign in to bookmark opportunities');
      return;
    }

    try {
      const isBookmarked = bookmarkedOpportunities.includes(opportunityId);
      console.log('isBookmarked:', isBookmarked);
      console.log('bookmarkedOpportunities:', bookmarkedOpportunities);
      
      const response = await fetch(`/api/opportunities/${opportunityId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        if (isBookmarked) {
          setBookmarkedOpportunities(prev => prev.filter(id => id !== opportunityId));
          toast.success('Removed from bookmarks');
        } else {
          setBookmarkedOpportunities(prev => [...prev, opportunityId]);
          toast.success('Added to bookmarks');
        }
      } else {
        toast.error(responseData.error || 'Failed to update bookmark');
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
      toast.error('Failed to bookmark opportunity');
    }
  };

  const getBadgeColor = (text: string, type: 'requirement' | 'skill') => {
    const lowerText = text.toLowerCase();
    
    if (type === 'requirement') {
      if (lowerText.includes('experience') || lowerText.includes('years')) {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      } else if (lowerText.includes('skill') || lowerText.includes('ability')) {
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      } else if (lowerText.includes('available') || lowerText.includes('time')) {
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      } else {
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      }
    } else {
      if (lowerText.includes('leadership') || lowerText.includes('management')) {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      } else if (lowerText.includes('teaching') || lowerText.includes('education')) {
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      } else if (lowerText.includes('computer') || lowerText.includes('technical')) {
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      } else {
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CLOSED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getFilteredOpportunities = () => {
    let filtered = opportunities;
    
    // Apply tab filtering
    switch (activeTab) {
      case 'bookmarked':
        filtered = filtered.filter(opp => bookmarkedOpportunities.includes(opp.id));
        break;
      case 'applied':
        filtered = filtered.filter(opp => appliedOpportunities.includes(opp.id));
        break;
      default:
        // 'all' tab - no additional filtering
        break;
    }
    
    return filtered;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading opportunities...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                Opportunities
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                Find meaningful opportunities to make an impact. Apply to positions that match your skills and interests.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Opportunities
            </button>
            <button
              onClick={() => setActiveTab('bookmarked')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'bookmarked'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Bookmarked ({bookmarkedOpportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'applied'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Applied ({appliedOpportunities.length})
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {/* Main Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search opportunities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              <div>
                <LocationAutocomplete
                  value={locationFilter}
                  onChange={setLocationFilter}
                  placeholder="Search location (e.g., California, United States)"
                  className="h-12"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="FILLED">Filled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SDG Filter */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter by SDG</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSdgFilter([])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sdgFilter.length === 0
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All SDGs
                </button>
                {sdgs.slice(0, 8).map((sdg) => (
                  <button
                    key={sdg.id}
                    onClick={() => {
                      if (sdgFilter.includes(sdg.id.toString())) {
                        setSdgFilter(prev => prev.filter(s => s !== sdg.id.toString()));
                      } else {
                        setSdgFilter(prev => [...prev, sdg.id.toString()]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                      sdgFilter.includes(sdg.id.toString())
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="text-lg">{sdg.icon}</span>
                    <span>SDG {sdg.id}</span>
                  </button>
                ))}
                {sdgs.length > 8 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1.5">
                    +{sdgs.length - 8} more
                  </span>
                )}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="deadline">Deadline Soon</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getFilteredOpportunities().length} opportunities found
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-6">
          {getFilteredOpportunities().length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {activeTab === 'bookmarked' 
                  ? 'No bookmarked opportunities'
                  : activeTab === 'applied'
                  ? 'No applied opportunities'
                  : 'No opportunities found'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'bookmarked'
                  ? 'Bookmark opportunities you\'re interested in to see them here.'
                  : activeTab === 'applied'
                  ? 'Apply to opportunities to track your applications here.'
                  : 'Try adjusting your search criteria or check back later for new opportunities.'
                }
              </p>
            </div>
          ) : (
            getFilteredOpportunities().map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Link href={`/opportunities/${opportunity.id}`}>
                    <div className="cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {opportunity.title}
                          </h3>
                        <Badge className={getStatusColor(opportunity.status)}>
                          {opportunity.status}
                        </Badge>
                        {opportunity.isRemote && (
                          <Badge variant="outline">Remote</Badge>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBookmark(opportunity.id);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10 relative"
                      >
                        <Heart 
                          className={`w-5 h-5 ${
                            bookmarkedOpportunities.includes(opportunity.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        />
                      </button>
                    </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4" />
                          <span>{opportunity.organization.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{opportunity.spotsFilled}/{opportunity.spots} filled</span>
                        </div>
                        {opportunity.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{opportunity.location}</span>
                          </div>
                        )}
                        {opportunity.deadline && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Deadline: {formatDate(opportunity.deadline)}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {opportunity.description}
                      </p>

                      {opportunity.requirements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements:</h4>
                          <div className="flex flex-wrap gap-2">
                            {opportunity.requirements.map((req, index) => (
                              <Badge key={index} className={`text-xs ${getBadgeColor(req, 'requirement')}`}>
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {opportunity.skills.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills:</h4>
                          <div className="flex flex-wrap gap-2">
                            {opportunity.skills.map((skill, index) => (
                              <Badge key={index} className={`text-xs ${getBadgeColor(skill, 'skill')}`}>
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {opportunity.sdg && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SDG Alignment:</h4>
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const sdgInfo = sdgs.find(s => s.id === parseInt(opportunity.sdg!));
                              return sdgInfo ? (
                                <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900 dark:to-purple-900 dark:text-blue-200 flex items-center space-x-1">
                                  <span className="text-lg">{sdgInfo.icon}</span>
                                  <span>SDG {sdgInfo.id}</span>
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span>{opportunity.stats.totalApplications} applications</span>
                          <span className="mx-2">•</span>
                          <span>Posted {formatDate(opportunity.createdAt)}</span>
                        </div>
                        
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleApply(opportunity.id);
                          }}
                          disabled={isApplying === opportunity.id || opportunity.status !== 'OPEN' || opportunity.stats.spotsRemaining <= 0 || appliedOpportunities.includes(opportunity.id)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          {isApplying === opportunity.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Applying...
                            </>
                          ) : appliedOpportunities.includes(opportunity.id) ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Applied
                            </>
                          ) : opportunity.status !== 'OPEN' ? (
                            'Closed'
                          ) : opportunity.stats.spotsRemaining <= 0 ? (
                            'Full'
                          ) : (
                            'Apply Now'
                          )}
                        </Button>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}