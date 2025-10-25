'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  Users,
  Star,
  Heart,
  Globe,
  TrendingUp,
  ChevronDown,
  Filter,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { countries } from '@/constants/countries';
import { useEventNotificationStore } from '@/store/eventNotificationStore';
import { EventCard } from '@/components/events/EventCard';

// Utility functions (moved to shared EventCard component)

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    address?: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
    isVirtual: boolean;
  };
  maxParticipants?: number;
  currentParticipants: number;
  interestedCount: number;
  sdgTags: number[];
  skills: string[];
  intensity: number;
  verificationType: string;
  images: string[];
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  organization?: {
    id: string;
    name: string;
    logo?: string;
  };
  createdAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isFavorited?: boolean;
  isAttending?: boolean;
  distance?: number;
  trending?: boolean;
  featured?: boolean;
  isBookmarked?: boolean;
}

interface EventFilters {
  search: string;
  status: string;
  sortBy: string;
  nearMe: boolean;
  maxDistance: number;
  showVirtual: boolean;
  sdgs: number[];
  category?: string;
}

// SDG Definitions
const SDG_DEFINITIONS = {
  1: { name: 'No Poverty', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  2: { name: 'Zero Hunger', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  3: { name: 'Good Health and Well-being', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  4: { name: 'Quality Education', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  5: { name: 'Gender Equality', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  6: { name: 'Clean Water and Sanitation', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  7: { name: 'Affordable and Clean Energy', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  8: { name: 'Decent Work and Economic Growth', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' },
  9: { name: 'Industry, Innovation and Infrastructure', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  10: { name: 'Reduced Inequalities', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  11: { name: 'Sustainable Cities and Communities', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  12: { name: 'Responsible Consumption and Production', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200' },
  13: { name: 'Climate Action', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  14: { name: 'Life Below Water', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' },
  15: { name: 'Life on Land', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  16: { name: 'Peace, Justice and Strong Institutions', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200' },
  17: { name: 'Partnerships for the Goals', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' }
};

function EventsPageContent() {
  const { data: session } = useSession();
  const user = session?.user;
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  // Event notification store - clear notifications when visiting events page
  const { clearCount } = useEventNotificationStore();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('near-you');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [showSDGDropdown, setShowSDGDropdown] = useState(false);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showVirtualDropdown, setShowVirtualDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    status: 'ACTIVE',
    sortBy: 'startDate',
    nearMe: true,
    maxDistance: 50,
    showVirtual: true,
    sdgs: [],
    category: category || undefined
  });

  useEffect(() => {
    fetchEvents();
  }, [filters, activeTab]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Clear event notifications when visiting the events page
  useEffect(() => {
    clearCount();
  }, [clearCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showSDGDropdown && !target.closest('.sdg-dropdown-container')) {
        setShowSDGDropdown(false);
      }
      if (showDistanceDropdown && !target.closest('.distance-dropdown-container')) {
        setShowDistanceDropdown(false);
      }
      if (showSortDropdown && !target.closest('.sort-dropdown-container')) {
        setShowSortDropdown(false);
      }
      if (showVirtualDropdown && !target.closest('.virtual-dropdown-container')) {
        setShowVirtualDropdown(false);
      }
      if (showCountryDropdown && !target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSDGDropdown, showDistanceDropdown, showSortDropdown, showVirtualDropdown, showCountryDropdown]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching events for tab:', activeTab);
      
      let response;
      if (activeTab === 'for-you') {
        // Fetch recommendations for "For You" tab
        response = await fetch('/api/recommendations?type=events');
      } else {
        // Regular events fetch - include status parameter for past events
        let apiUrl = '/api/events';
        if (activeTab === 'past') {
          apiUrl += '?status=COMPLETED';
        }
        response = await fetch(apiUrl);
      }
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      console.log('Data received:', data);
      
      // Transform API data to match our Event interface
      const sourceEvents = activeTab === 'for-you' ? (data.recommendations || []) : (data.events || []);
      const transformedEvents: Event[] = sourceEvents.map((event: any) => {
        let locationData;
        if (typeof event.location === 'string') {
          try {
            locationData = JSON.parse(event.location);
          } catch (e) {
            // If parsing fails, treat as a simple address string
            locationData = {
              address: event.location,
              city: 'Unknown',
              country: 'Unknown',
              isVirtual: false
            };
          }
        } else {
          locationData = event.location;
        }
        
        let sdgData;
        if (event.sdg) {
          if (typeof event.sdg === 'string') {
            try {
              sdgData = JSON.parse(event.sdg);
            } catch (e) {
              // If parsing fails, treat as a single SDG number
              sdgData = [parseInt(event.sdg)];
            }
          } else if (typeof event.sdg === 'number') {
            sdgData = [event.sdg];
          } else {
            sdgData = event.sdg;
          }
        } else {
          sdgData = [];
        }

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: {
            address: locationData.address,
            city: locationData.city,
            country: locationData.country,
            coordinates: locationData.coordinates,
            isVirtual: locationData.isVirtual || false
          },
          maxParticipants: event.maxParticipants,
          currentParticipants: event.currentParticipants || 0,
          interestedCount: 0, // Can be added later
          sdgTags: Array.isArray(sdgData) ? sdgData : [],
          skills: event.skills || [],
          intensity: event.intensity || 1,
          verificationType: event.verificationType || 'ORGANIZER',
          images: event.imageUrl ? [event.imageUrl] : [],
          creator: event.organization ? {
            id: event.organization.id,
            name: event.organization.name,
            avatar: event.organization.logo
          } : {
            id: 'unknown',
            name: 'Unknown',
          },
          organization: event.organization ? {
            id: event.organization.id,
            name: event.organization.name,
            logo: event.organization.logo
          } : undefined,
          createdAt: event.createdAt,
          status: event.status,
          isFavorited: false,
          isBookmarked: event.isBookmarked || false,
          isAttending: false,
          trending: false,
          featured: false
        };
      });
      
      setEvents(transformedEvents);
      filterEventsByTab(transformedEvents, activeTab);
    } catch (error) {
      console.error('Error fetching events:', error);
      console.error('Error details:', error);
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEventsByTab = (eventList: Event[], tab: string) => {
    let filtered = [...eventList];
    const now = new Date();

    switch (tab) {
      case 'near-you':
        filtered = eventList.filter(event => {
          if (event.location.isVirtual) return filters.showVirtual;
          if (event.distance !== undefined) {
            return event.distance <= (filters.maxDistance || 50);
          }
          return true;
        });
        break;
      case 'latest':
        filtered = eventList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'upcoming':
        filtered = eventList.filter(event => new Date(event.startDate) > now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        break;
      case 'past':
        filtered = eventList.filter(event => new Date(event.startDate) < now)
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        break;
      case 'attending':
        filtered = eventList.filter(event => event.isAttending);
        break;
      case 'favorites':
        console.log('Filtering favorites from', eventList.length, 'events');
        filtered = eventList.filter(event => event.isBookmarked);
        console.log('Found', filtered.length, 'favorites:', filtered.map(e => ({id: e.id, title: e.title, isBookmarked: e.isBookmarked})));
        break;
      default:
        filtered = eventList;
    }

    // Apply other filters
    if (filters.search) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.location.city.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.sdgs && filters.sdgs.length > 0) {
      filtered = filtered.filter(event =>
        event.sdgTags.some(sdg => filters.sdgs.includes(sdg))
      );
    }

    if (selectedCountry && selectedCountry !== 'all') {
      filtered = filtered.filter(event =>
        event.location.country.toLowerCase() === selectedCountry.toLowerCase()
      );
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (newFilters: Partial<EventFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    filterEventsByTab(events, tab);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'ACTIVE',
      sortBy: 'startDate',
      nearMe: true,
      maxDistance: 50,
      showVirtual: true,
      sdgs: []
    });
    setSelectedCountry('all');
    setShowSDGDropdown(false);
    setShowDistanceDropdown(false);
    setShowSortDropdown(false);
    setShowVirtualDropdown(false);
    setShowCountryDropdown(false);
  };

  const toggleFavorite = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, isFavorited: !event.isFavorited }
        : event
    ));
  };

  const toggleBookmark = async (eventId: string) => {
    console.log('Toggle bookmark called for:', eventId);
    console.log('Active tab:', activeTab);
    
    // Find the event to determine current bookmark status
    const event = events.find(e => e.id === eventId);
    const currentlyBookmarked = event?.isBookmarked || false;
    
    // Optimistically update UI
    const updatedEvents = events.map(event => 
      event.id === eventId 
        ? { ...event, isBookmarked: !event.isBookmarked }
        : event
    );
    
    console.log('Updated event bookmarked?', updatedEvents.find(e => e.id === eventId)?.isBookmarked);
    
    setEvents(updatedEvents);
    
    // Apply the same filter logic to update filtered events
    filterEventsByTab(updatedEvents, activeTab);
    
    // Make API call to persist the change
    try {
      const response = await fetch(`/api/events/${eventId}/bookmark`, {
        method: currentlyBookmarked ? 'DELETE' : 'POST'
      });

      if (!response.ok) {
        // Revert the optimistic update on error
        setEvents(events);
        filterEventsByTab(events, activeTab);
        console.error('Failed to update bookmark');
      }
    } catch (error) {
      // Revert the optimistic update on error
      setEvents(events);
      filterEventsByTab(events, activeTab);
      console.error('Failed to update bookmark:', error);
    }
  };

  const toggleSDG = (sdgNumber: number) => {
    const currentSDGs = filters.sdgs || [];
    const newSDGs = currentSDGs.includes(sdgNumber)
      ? currentSDGs.filter(sdg => sdg !== sdgNumber)
      : [...currentSDGs, sdgNumber];
    
    handleFilterChange({ sdgs: newSDGs });
  };

  const removeSDG = (sdgNumber: number) => {
    const newSDGs = (filters.sdgs || []).filter(sdg => sdg !== sdgNumber);
    handleFilterChange({ sdgs: newSDGs });
  };

  const clearAllSDGs = () => {
    handleFilterChange({ sdgs: [] });
  };

  const getCategoryTitle = (category: string) => {
    const categoryTitles: Record<string, string> = {
      volunteer: 'Volunteer Events',
      research: 'Research Opportunities',
      education: 'Education Programs',
      environment: 'Environmental Action',
      health: 'Health & Wellness',
      community: 'Community Service'
    };
    return categoryTitles[category] || 'Events';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {category 
                ? getCategoryTitle(category)
                : 'Impact Events Near You'
              }
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              {category 
                ? `Discover ${getCategoryTitle(category).toLowerCase()} and make an impact in your area of interest`
                : 'Join thousands of changemakers creating positive impact worldwide'
              }
            </p>
          </div>

          {/* Main Search Bar */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search events, causes, or organizations..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange({ search: e.target.value })}
                      className="pl-10 h-12 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2 country-dropdown-container">
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="h-12 w-full justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center text-gray-900 dark:text-white">
                        <Globe className="w-4 h-4 mr-2" />
                        {selectedCountry === 'all' ? 'Any Country' : 
                          countries.find(c => c.code.toLowerCase() === selectedCountry)?.name || 'Any Country'
                        }
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              type="text"
                              placeholder="Search countries..."
                              value={countrySearchQuery}
                              onChange={(e) => setCountrySearchQuery(e.target.value)}
                              className="pl-10 h-10"
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        {/* Country List */}
                        <div className="overflow-y-auto max-h-60">
                          <button
                            onClick={() => {
                              setSelectedCountry('all');
                              setShowCountryDropdown(false);
                              setCountrySearchQuery('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                          >
                            <span className="mr-2">🌍</span>
                            Any Country
                          </button>
                          {countries
                            .filter(country => 
                              country.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
                            )
                            .map(country => (
                              <button
                                key={country.code}
                                onClick={() => {
                                  setSelectedCountry(country.code.toLowerCase());
                                  setShowCountryDropdown(false);
                                  setCountrySearchQuery('');
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                              >
                                <span className="mr-2">{country.flag}</span>
                                {country.name}
                              </button>
                            ))}
                          {countries.filter(country => 
                            country.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
                          ).length === 0 && countrySearchQuery && (
                            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Button 
                    className="h-12 w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    onClick={() => fetchEvents()}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button variant="ghost" className="!bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:!bg-white/20 px-6 py-3 shadow-none hover:shadow-none">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending Events
            </Button>
            <Button variant="ghost" className="!bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:!bg-white/20 px-6 py-3 shadow-none hover:shadow-none">
              <Globe className="w-4 h-4 mr-2" />
              Featured Events
            </Button>
            {user && (
              <Link href="/events/create">
                <Button variant="ghost" className="!bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:!bg-white/20 px-6 py-3 shadow-none hover:shadow-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            )}
            <Button variant="ghost" className="!bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:!bg-white/20 px-6 py-3 shadow-none hover:shadow-none">
              <Users className="w-4 h-4 mr-2" />
              Join Community
            </Button>
          </div>

          {/* Trending Events Section */}
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-6 text-blue-100">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                <span className="text-sm">Trending: Beach Cleanup, Food Drive, Tree Planting</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                <span className="text-sm">Featured in 25+ countries</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section - Full Width White Container */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Event Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => handleTabChange('near-you')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                  activeTab === 'near-you' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                }`}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Near You
              </button>
              <button
                onClick={() => handleTabChange('for-you')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                  activeTab === 'for-you' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                }`}
              >
                <Target className="w-4 h-4 mr-2" />
                For You
              </button>
              <button
                onClick={() => handleTabChange('latest')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                  activeTab === 'latest' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Latest
              </button>
              <button
                onClick={() => handleTabChange('upcoming')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                  activeTab === 'upcoming' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Upcoming
              </button>
              <button
                onClick={() => handleTabChange('past')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                  activeTab === 'past' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                }`}
              >
                <Clock className="w-4 h-4 mr-2" />
                Past
              </button>
              {user && (
                <>
                  <button
                    onClick={() => handleTabChange('attending')}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                      activeTab === 'attending' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                        : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                    }`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Attending
                  </button>
                  <button
                    onClick={() => handleTabChange('favorites')}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                      activeTab === 'favorites' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                        : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                    }`}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Favorites
                  </button>
                </>
              )}
            </div>
                
            {/* Advanced Filters Toggle */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full justify-between bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <span>Advanced Filters</span>
                  {(filters.sdgs && filters.sdgs.length > 0) && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {filters.sdgs.length} SDG{filters.sdgs.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Collapsible Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mb-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
              {/* SDG Filters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filter by SDG Categories
                  </label>
                  {(filters.sdgs && filters.sdgs.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllSDGs}
                      className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      Clear all ({filters.sdgs.length})
                    </Button>
                  )}
                </div>

                {/* Selected SDGs Tag Cloud */}
                {filters.sdgs && filters.sdgs.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {filters.sdgs.map(sdgNumber => {
                        const sdgInfo = SDG_DEFINITIONS[sdgNumber as keyof typeof SDG_DEFINITIONS];
                        return (
                          <div
                            key={sdgNumber}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${sdgInfo?.color || 'bg-gray-100 text-gray-800'}`}
                          >
                            <span className="mr-2">SDG {sdgNumber}</span>
                            <button
                              onClick={() => removeSDG(sdgNumber)}
                              className="ml-1 hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SDG Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Object.entries(SDG_DEFINITIONS).map(([number, info]) => {
                    const sdgNumber = parseInt(number);
                    const isSelected = filters.sdgs?.includes(sdgNumber);
                    return (
                      <button
                        key={sdgNumber}
                        onClick={() => toggleSDG(sdgNumber)}
                        className={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
                          isSelected
                            ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-bold mb-1">SDG {sdgNumber}</div>
                          <div className="text-xs leading-tight">{info.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Other Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Distance Filter */}
                <div className="distance-dropdown-container relative">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Distance
                  </label>
                  <Button
                    variant="outline"
                    onClick={() => setShowDistanceDropdown(!showDistanceDropdown)}
                    className="w-full justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                  >
                    <span className="text-gray-900 dark:text-white">
                      {filters.maxDistance === 10 && 'Within 10 km'}
                      {filters.maxDistance === 25 && 'Within 25 km'}
                      {filters.maxDistance === 50 && 'Within 50 km'}
                      {filters.maxDistance === 100 && 'Within 100 km'}
                      {filters.maxDistance === 999 && 'Any distance'}
                      {!filters.maxDistance && 'Within 50 km'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDistanceDropdown ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {showDistanceDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        {[
                          { value: 10, label: 'Within 10 km' },
                          { value: 25, label: 'Within 25 km' },
                          { value: 50, label: 'Within 50 km' },
                          { value: 100, label: 'Within 100 km' },
                          { value: 999, label: 'Any distance' }
                        ].map(option => (
                          <button
                            key={option.value.toString()}
                            onClick={() => {
                              handleFilterChange({ maxDistance: option.value });
                              setShowDistanceDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 rounded text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-900 dark:text-white"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort Filter */}
                <div className="sort-dropdown-container relative">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Sort by
                  </label>
                  <Button
                    variant="outline"
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="w-full justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                  >
                    <span className="text-gray-900 dark:text-white">
                      {filters.sortBy === 'startDate' && 'Date (Upcoming first)'}
                      {filters.sortBy === 'relevance' && 'Relevance'}
                      {filters.sortBy === 'participants' && 'Most popular'}
                      {filters.sortBy === 'newest' && 'Newest first'}
                      {filters.sortBy === 'distance' && 'Distance (Nearest first)'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {showSortDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        {[
                          { value: 'startDate', label: 'Date (Upcoming first)' },
                          { value: 'relevance', label: 'Relevance' },
                          { value: 'participants', label: 'Most popular' },
                          { value: 'newest', label: 'Newest first' },
                          { value: 'distance', label: 'Distance (Nearest first)' }
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              handleFilterChange({ sortBy: option.value });
                              setShowSortDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 rounded text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-900 dark:text-white"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Virtual Events Filter */}
                <div className="virtual-dropdown-container relative">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Virtual Events
                  </label>
                  <Button
                    variant="outline"
                    onClick={() => setShowVirtualDropdown(!showVirtualDropdown)}
                    className="w-full justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                  >
                    <span className="text-gray-900 dark:text-white">
                      {filters.showVirtual ? 'Show virtual events' : 'Hide virtual events'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showVirtualDropdown ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {showVirtualDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        {[
                          { value: true, label: 'Show virtual events' },
                          { value: false, label: 'Hide virtual events' }
                        ].map(option => (
                          <button
                            key={option.value.toString()}
                            onClick={() => {
                              handleFilterChange({ showVirtual: option.value });
                              setShowVirtualDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 rounded text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-900 dark:text-white"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear Filters */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    &nbsp;
                  </label>
                  <Button 
                    onClick={clearFilters} 
                    className="w-full h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Events Grid - 4 columns on desktop */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No events found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try searching in a different location or check back later for new events.
              </p>
              {user && (
                <Link href="/events/create">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create an Event
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onToggleFavorite={toggleFavorite} onToggleBookmark={toggleBookmark} showOrganization={true} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredEvents.length > 0 && filteredEvents.length >= 12 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={fetchEvents}>
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventsPageContent />
    </Suspense>
  );
}

// EventCard component is now imported from @/components/events/EventCard