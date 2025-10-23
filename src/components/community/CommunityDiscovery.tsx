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
}

export function CommunityDiscovery({ 
  communities = [], 
  onJoin, 
  onView, 
  onShare,
  onCreateCommunity 
}: CommunityDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSdg, setSelectedSdg] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'my' | 'discover' | 'recommended'>('discover');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedCommunities, setFetchedCommunities] = useState<Community[]>([]);
  
  // New Meetup-style state
  const [userLocation, setUserLocation] = useState<{city: string, country: string} | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<string>('50');
  const [selectedSDGCategory, setSelectedSDGCategory] = useState<string>('all');

  // Fetch communities from API
  useEffect(() => {
    fetchCommunities();
  }, [selectedCategory, selectedSdg, searchQuery]);

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

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSdg !== 'all') params.append('sdg', selectedSdg);
      if (searchQuery.trim()) params.append('search', searchQuery);
      
      const response = await fetch(`/api/communities?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch communities');
      }
      
      const data = await response.json();
      setFetchedCommunities(data.communities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Mock data - in real app, this would come from props or API
  const mockCommunities: Community[] = [
    {
      id: '1',
      name: 'Climate Action Warriors',
      description: 'Join us in fighting climate change through sustainable practices and environmental advocacy.',
      category: 'Environment',
      memberCount: 2847,
      postCount: 156,
      recentActivity: '2 hours ago',
      isPublic: true,
      isJoined: false,
      tags: ['Climate', 'Sustainability', 'Environment'],
      sdgFocus: [13, 15, 12],
      primarySDG: 13,
      location: { city: 'Kuala Lumpur', country: 'Malaysia' },
      distance: 5.2,
      rating: 4.8,
      memberAvatars: [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
      ]
    },
    {
      id: '2',
      name: 'Education for All',
      description: 'Promoting quality education and equal learning opportunities for children worldwide.',
      category: 'Education',
      memberCount: 1923,
      postCount: 89,
      recentActivity: '5 hours ago',
      isPublic: true,
      isJoined: true,
      tags: ['Education', 'Children', 'Learning'],
      sdgFocus: [4, 10, 1],
      primarySDG: 4,
      location: { city: 'Petaling Jaya', country: 'Malaysia' },
      distance: 12.5,
      rating: 4.9,
      memberAvatars: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
      ]
    },
    {
      id: '3',
      name: 'Health & Wellness Champions',
      description: 'Building healthier communities through healthcare initiatives and wellness programs.',
      category: 'Healthcare',
      memberCount: 1456,
      postCount: 67,
      recentActivity: '1 day ago',
      isPublic: true,
      isJoined: false,
      tags: ['Health', 'Wellness', 'Healthcare'],
      sdgFocus: [3, 6, 11],
      primarySDG: 3,
      location: { city: 'Kuala Lumpur', country: 'Malaysia' },
      distance: 8.7,
      rating: 4.6,
      memberAvatars: [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
      ]
    },
    {
      id: '4',
      name: 'Tech for Good',
      description: 'Leveraging technology to solve social problems and create positive impact.',
      category: 'Technology',
      memberCount: 3210,
      postCount: 234,
      recentActivity: '3 hours ago',
      isPublic: true,
      isJoined: true,
      tags: ['Technology', 'Innovation', 'Social Impact'],
      sdgFocus: [9, 8, 4],
      primarySDG: 9,
      location: { city: 'Cyberjaya', country: 'Malaysia' },
      distance: 25.3,
      rating: 4.7,
      memberAvatars: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
      ]
    },
    {
      id: '5',
      name: 'Women Empowerment Circle',
      description: 'Supporting women\'s rights, leadership, and economic empowerment globally.',
      category: 'Social',
      memberCount: 1876,
      postCount: 98,
      recentActivity: '6 hours ago',
      isPublic: true,
      isJoined: false,
      tags: ['Women', 'Empowerment', 'Gender Equality'],
      sdgFocus: [5, 8, 10],
      primarySDG: 5,
      location: { city: 'Kuala Lumpur', country: 'Malaysia' },
      distance: 3.1,
      rating: 4.9,
      memberAvatars: [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
      ]
    },
    {
      id: '6',
      name: 'Youth Leadership Network',
      description: 'Empowering young leaders to drive positive change in their communities.',
      category: 'Social',
      memberCount: 2567,
      postCount: 145,
      recentActivity: '4 hours ago',
      isPublic: true,
      isJoined: false,
      tags: ['Youth', 'Leadership', 'Community'],
      sdgFocus: [4, 16, 17],
      primarySDG: 4,
      location: { city: 'Shah Alam', country: 'Malaysia' },
      distance: 18.9,
      rating: 4.5,
      memberAvatars: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
      ]
    }
  ];

  const displayCommunities = mockCommunities;

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
    if (selectedTab === 'my') {
      filtered = filtered.filter(community => community.isJoined);
    } else if (selectedTab === 'recommended') {
      // Mock recommendation logic - prioritize communities with high member count and recent activity
      filtered = filtered
        .filter(community => !community.isJoined)
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

    return filtered;
  }, [displayCommunities, selectedTab, selectedSDGCategory, distanceFilter, searchQuery]);

  const getTabStats = () => {
    const myCommunities = displayCommunities.filter(c => c.isJoined).length;
    const totalCommunities = displayCommunities.length;
    const recommendedCount = Math.min(6, displayCommunities.filter(c => !c.isJoined).length);

    return { myCommunities, totalCommunities, recommendedCount };
  };

  const stats = getTabStats();

  return (
    <div className="space-y-6">
      {/* Meetup-style Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Communities near {userLocation ? `${userLocation.city}, ${userLocation.country}` : 'Your Location'}
            </h1>
            <p className="text-gray-600 mt-1">
              Join communities focused on {selectedSDGCategory !== 'all' ? `SDG ${selectedSDGCategory}` : 'social impact'} in your area
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

        {/* Location & Distance Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {filteredCommunities.length} communities found
            </span>
          </div>
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
              <SelectItem value="global">Anywhere</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SDG Category Pills (Meetup-style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedSDGCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedSDGCategory('all')}
          className="whitespace-nowrap rounded-full"
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
              className="whitespace-nowrap rounded-full flex items-center gap-2"
            >
              <img src={sdg.image} alt={sdg.title} className="w-4 h-4" />
              {sdg.title}
            </Button>
          );
        })}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SDG Filter */}
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-gray-400" />
              <Select value={selectedSdg} onValueChange={setSelectedSdg}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sdgOptions.map(sdg => (
                    <SelectItem key={sdg.value} value={sdg.value}>
                      {sdg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pill Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTab === 'my' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('my')}
          className={`rounded-full px-6 py-2 ${
            selectedTab === 'my' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          My Communities ({stats.myCommunities})
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
          <Star className="w-4 h-4 mr-2" />
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
              No communities found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery.trim() 
                ? 'Try adjusting your search terms or filters'
                : 'No communities match your current filters'
              }
            </p>
            {searchQuery.trim() && (
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
