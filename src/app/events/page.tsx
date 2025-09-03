// home/ubuntu/impaktrweb/src/app/events/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  Users,
  Star,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventFilters } from '@/components/events/EventFilters';
import { EventCard } from '@/components/events/EventCard';
import { formatDate, formatTimeAgo } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    address?: string;
    city: string;
    coordinates?: { lat: number; lng: number };
    isVirtual: boolean;
  };
  maxParticipants?: number;
  currentParticipants: number;
  sdgTags: number[];
  skills: string[];
  intensity: number;
  verificationType: string;
  images: string[];
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  organization?: {
    id: string;
    name: string;
    logo: string;
  };
  createdAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

interface EventFilters {
  search: string;
  sdg?: number;
  location?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  sortBy: string;
}

export default function EventsPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    status: 'ACTIVE',
    sortBy: 'startDate'
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.sdg) queryParams.set('sdg', filters.sdg.toString());
      if (filters.location) queryParams.set('location', filters.location);
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      if (filters.status) queryParams.set('status', filters.status);

      const response = await fetch(`/api/events?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        filterEventsByTab(data.events, activeTab);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEventsByTab = (eventList: Event[], tab: string) => {
    let filtered = [...eventList];

    switch (tab) {
      case 'recommended':
        // Filter based on user's SDG preferences and location
        // This would use actual user preferences from the profile
        filtered = eventList.filter(event => 
          event.sdgTags.some(sdg => [13, 4, 1].includes(sdg)) // Mock user SDG preferences
        );
        break;
      case 'nearby':
        // Filter by location proximity
        // This would use actual geolocation
        filtered = eventList.filter(event => 
          event.location.city.toLowerCase().includes('kuala lumpur') ||
          event.location.city.toLowerCase().includes('selangor')
        );
        break;
      case 'virtual':
        filtered = eventList.filter(event => event.location.isVirtual);
        break;
      case 'my-events':
        // Filter events where user is participating
        // This would check actual user participation
        filtered = user ? eventList.filter(event => 
          Math.random() > 0.7 // Mock participation
        ) : [];
        break;
      default:
        filtered = eventList;
    }

    setFilteredEvents(filtered);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    filterEventsByTab(events, tab);
  };

  const handleFilterChange = (newFilters: Partial<EventFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'ACTIVE',
      sortBy: 'startDate'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Impact Events</h1>
            <p className="text-muted-foreground">
              Discover volunteering opportunities and create positive impact
            </p>
          </div>
          
          {user && (
            <Link href="/events/create">
              <Button className="mt-4 md:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search events by title, description, or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange({ sortBy: value })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startDate">Sort by Date</SelectItem>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="participants">Most Popular</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <EventFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClear={clearFilters}
              />
            </CardContent>
          </Card>
        )}

        {/* Event Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="nearby">Nearby</TabsTrigger>
            <TabsTrigger value="virtual">Virtual</TabsTrigger>
            {user && <TabsTrigger value="my-events">My Events</TabsTrigger>}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} events
              </div>
              
              {filters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange({ search: '' })}
                >
                  Clear search
                </Button>
              )}
            </div>

            {/* Events Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-20 bg-muted rounded"></div>
                        <div className="flex space-x-2">
                          <div className="h-6 bg-muted rounded w-16"></div>
                          <div className="h-6 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filters.search 
                      ? `No events match your search for "${filters.search}"`
                      : 'No events match your current filters'
                    }
                  </p>
                  {user && (
                    <Link href="/events/create">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create the first event
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Load More */}
        {filteredEvents.length > 0 && filteredEvents.length >= 12 && (
          <div className="text-center mt-8">
            <Button variant="outline" onClick={fetchEvents}>
              Load More Events
            </Button>
          </div>
        )}

        {/* Featured Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Featured Organizations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'WWF Malaysia', logo: '/orgs/wwf.png', events: 12, focus: 'Environment' },
              { name: 'UNICEF', logo: '/orgs/unicef.png', events: 8, focus: 'Children' },
              { name: 'Red Crescent', logo: '/orgs/redcrescent.png', events: 15, focus: 'Healthcare' },
              { name: 'Teach for Malaysia', logo: '/orgs/tfm.png', events: 6, focus: 'Education' }
            ].map((org, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {org.name.charAt(0)}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{org.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{org.focus}</p>
                  <Badge variant="secondary">{org.events} active events</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}