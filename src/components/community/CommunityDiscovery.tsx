'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  Filter,
  Plus,
  Users,
  TrendingUp,
  Star,
  Globe,
  Lock,
  Calendar,
  MessageCircle,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { EnhancedCommunityCard } from './EnhancedCommunityCard';
import { getSDGById } from '@/constants/sdgs';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  sdgFocus?: number[];
  memberCount: number;
  postCount: number;
  recentActivity: string;
  isPublic: boolean;
  isJoined?: boolean;
  isCreatedByMe?: boolean;
  userRole?: string | null;
  bannerImage?: string;
  avatar?: string;
  tags?: string[];
  location?: {
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  distance?: number;
  rating?: number;
  memberAvatars?: string[];
  primarySDG?: number;
}

interface CommunityDiscoveryProps {
  communities?: Community[];
  onJoin?: (communityId: string) => void;
  onView?: (communityId: string) => void;
  onShare?: (communityId: string) => void;
  onCreateCommunity?: () => void;
  requestedCommunities?: Set<string>;
}

export function CommunityDiscovery({ 
  communities = [], 
  onJoin,
  onView,
  onShare,
  onCreateCommunity,
  requestedCommunities = new Set()
}: CommunityDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSdg, setSelectedSdg] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'created' | 'joined' | 'discover' | 'recommended'>('discover');
  
  // New Meetup-style state
  const [userLocation, setUserLocation] = useState<{city: string, country: string} | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<string>('50');
  const [selectedSDGCategory, setSelectedSDGCategory] = useState<string>('all');
  const [locationSearch, setLocationSearch] = useState<string>('');


  // Detect user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For demo purposes, set Kuala Lumpur as default location
          setUserLocation({
            city: 'Kuala Lumpur',
            country: 'Malaysia'
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback to default location
          setUserLocation({
            city: 'Kuala Lumpur',
            country: 'Malaysia'
          });
        }
      );
    } else {
      // Fallback to default location
      setUserLocation({
        city: 'Kuala Lumpur',
        country: 'Malaysia'
      });
    }
  }, []);


  // Use communities from props (API data)
  const displayCommunities = communities;

  const categories = ['all', 'Environment', 'Education', 'Healthcare', 'Social', 'Technology', 'Business'];
  const sdgOptions = [
    { value: 'all', label: 'All SDGs' },
    { value: '1', label: 'SDG 1: No Poverty' },
    { value: '2', label: 'SDG 2: Zero Hunger' },
    { value: '3', label: 'SDG 3: Good Health' },
    { value: '4', label: 'SDG 4: Quality Education' },
    { value: '5', label: 'SDG 5: Gender Equality' },
    { value: '6', label: 'SDG 6: Clean Water' },
    { value: '7', label: 'SDG 7: Affordable Energy' },
    { value: '8', label: 'SDG 8: Decent Work' },
    { value: '9', label: 'SDG 9: Industry Innovation' },
    { value: '10', label: 'SDG 10: Reduced Inequalities' },
    { value: '11', label: 'SDG 11: Sustainable Cities' },
    { value: '12', label: 'SDG 12: Responsible Consumption' },
    { value: '13', label: 'SDG 13: Climate Action' },
    { value: '14', label: 'SDG 14: Life Below Water' },
    { value: '15', label: 'SDG 15: Life on Land' },
    { value: '16', label: 'SDG 16: Peace & Justice' },
    { value: '17', label: 'SDG 17: Partnerships' },
  ];

  const filteredCommunities = useMemo(() => {
    let filtered = displayCommunities;

    // Filter by tab
    if (selectedTab === 'created') {
      filtered = filtered.filter(community => community.isCreatedByMe === true);
    } else if (selectedTab === 'joined') {
      filtered = filtered.filter(community => community.isJoined && !community.isCreatedByMe);
    } else if (selectedTab === 'recommended') {
      // Mock recommendation logic - prioritize communities with high member count and recent activity
      filtered = filtered
        .filter(community => !community.isJoined && !community.isCreatedByMe)
        .sort((a, b) => b.memberCount - a.memberCount)
        .slice(0, 6);
    }

    // Filter by SDG category
    if (selectedSDGCategory !== 'all') {
      const sdgId = parseInt(selectedSDGCategory);
      filtered = filtered.filter(community => 
        community.sdgFocus?.includes(sdgId) || community.primarySDG === sdgId
      );
    }

    // Filter by distance
    if (distanceFilter !== 'global') {
      const maxDistance = parseInt(distanceFilter);
      filtered = filtered.filter(community => 
        !community.distance || community.distance <= maxDistance
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(query) ||
        community.description.toLowerCase().includes(query) ||
        community.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        community.location?.city.toLowerCase().includes(query)
      );
    }

    // Filter by location search
    if (locationSearch.trim()) {
      const locationQuery = locationSearch.toLowerCase();
      filtered = filtered.filter(community =>
        community.location?.city.toLowerCase().includes(locationQuery) ||
        community.location?.country.toLowerCase().includes(locationQuery)
      );
    }

    return filtered;
  }, [displayCommunities, selectedTab, selectedSDGCategory, distanceFilter, searchQuery, locationSearch]);

  const getTabStats = () => {
    const createdCommunities = displayCommunities.filter(c => c.isCreatedByMe === true).length;
    const joinedCommunities = displayCommunities.filter(c => c.isJoined && !c.isCreatedByMe).length;
    const totalCommunities = displayCommunities.length;
    const recommendedCount = Math.min(6, displayCommunities.filter(c => !c.isJoined && !c.isCreatedByMe).length);

    return { createdCommunities, joinedCommunities, totalCommunities, recommendedCount };
  };

  const stats = getTabStats();

  return (
    <div className="space-y-6">
      {/* Meetup-style Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Communities {locationSearch.trim() ? (
                <>
                  in <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">{locationSearch}</span>
                </>
              ) : distanceFilter === 'global' ? 'around the world' : (
                <>
                  near <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    {userLocation ? `${userLocation.city}, ${userLocation.country}` : 'Your Location'}
                  </span>
                </>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Join communities focused on {selectedSDGCategory !== 'all' ? `SDG ${selectedSDGCategory}` : 'social impact'} {locationSearch.trim() ? `in ${locationSearch}` : distanceFilter === 'global' ? 'anywhere' : 'in your area'}
            </p>
          </div>
          <Button 
            onClick={onCreateCommunity}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Community
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Communities Count */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold text-3xl mb-1">
              {filteredCommunities.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Communities
            </div>
          </div>

          {/* Total Members */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent font-bold text-3xl mb-1">
              {filteredCommunities.reduce((sum, community) => sum + community.memberCount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Total Members
            </div>
          </div>

          {/* Active Communities */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent font-bold text-3xl mb-1">
              {filteredCommunities.filter(c => c.postCount > 0).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Active Communities
            </div>
          </div>

          {/* SDG Coverage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent font-bold text-3xl mb-1">
              {new Set(filteredCommunities.flatMap(c => c.sdgFocus || [])).size}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              SDGs Covered
            </div>
          </div>
        </div>

        {/* Location & Distance Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Location Search */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by city or country..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Distance Filter */}
            <Select value={distanceFilter} onValueChange={setDistanceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Distance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Within 5 km</SelectItem>
                <SelectItem value="10">Within 10 km</SelectItem>
                <SelectItem value="25">Within 25 km</SelectItem>
                <SelectItem value="50">Within 50 km</SelectItem>
                <SelectItem value="100">Within 100 km</SelectItem>
                <SelectItem value="global">Anywhere in the world</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* SDG Category Pills (Meetup-style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedSDGCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedSDGCategory('all')}
          className={`whitespace-nowrap rounded-full ${
            selectedSDGCategory === 'all' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          All Communities
        </Button>
        {Array.from({ length: 17 }, (_, i) => i + 1).map((sdgId) => {
          const sdg = getSDGById(sdgId);
          if (!sdg) return null;
          return (
            <Button
              key={sdgId}
              variant={selectedSDGCategory === sdgId.toString() ? 'default' : 'outline'}
              onClick={() => setSelectedSDGCategory(sdgId.toString())}
              className={`whitespace-nowrap rounded-full flex items-center gap-2 ${
                selectedSDGCategory === sdgId.toString() 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <img src={sdg.image} alt={sdg.title} className="w-4 h-4" />
              SDG {sdgId}: {sdg.title}
            </Button>
          );
        })}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>

      {/* Unified Search */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search communities by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tab Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTab === 'created' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('created')}
          className={`rounded-full px-6 py-2 ${
            selectedTab === 'created' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Star className="w-4 h-4 mr-2" />
          Created ({stats.createdCommunities})
        </Button>
        <Button
          variant={selectedTab === 'joined' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('joined')}
          className={`rounded-full px-6 py-2 ${
            selectedTab === 'joined' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Joined ({stats.joinedCommunities})
        </Button>
        <Button
          variant={selectedTab === 'discover' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('discover')}
          className={`rounded-full px-6 py-2 ${
            selectedTab === 'discover' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Globe className="w-4 h-4 mr-2" />
          Discover ({stats.totalCommunities})
        </Button>
        <Button
          variant={selectedTab === 'recommended' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('recommended')}
          className={`rounded-full px-6 py-2 ${
            selectedTab === 'recommended' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Recommended ({stats.recommendedCount})
        </Button>
      </div>

      {/* Communities Grid */}
      {filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <EnhancedCommunityCard
              key={community.id}
              community={community}
              onJoin={onJoin}
              onView={onView}
              onShare={onShare}
              isRequested={requestedCommunities.has(community.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {selectedTab === 'created'
                ? "You haven't created any communities yet"
                : selectedTab === 'joined'
                ? "You haven't joined any communities yet"
                : 'No communities found'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedTab === 'created'
                ? 'Create your first community to bring people together around your cause'
                : selectedTab === 'joined'
                ? 'Explore communities in the Discover tab and join ones that match your interests'
                : searchQuery.trim() 
                  ? 'Try adjusting your search terms or filters'
                  : 'No communities match your current filters'
              }
            </p>
            {selectedTab === 'created' ? (
              <Button 
                onClick={onCreateCommunity}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>
            ) : selectedTab === 'joined' ? (
              <Button 
                onClick={() => setSelectedTab('discover')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                Discover Communities
              </Button>
            ) : searchQuery.trim() && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
