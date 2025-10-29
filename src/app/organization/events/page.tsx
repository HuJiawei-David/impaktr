// home/ubuntu/impaktrweb/src/app/organization/events/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Plus, 
  Users, 
  MapPin, 
  Clock,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { useEventNotificationStore } from '@/store/eventNotificationStore';
import { useConfirmDialog } from '@/components/ui/simple-confirm-dialog';

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
  status: string;
  sdg: number[];
  isPublic: boolean;
  coverImage?: string | null;
  imageUrl?: string | null;
}

interface OrganizationData {
  id: string;
  name: string;
  events: Event[];
}

export default function OrganizationEventsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Event notification store - clear notifications when visiting events page
  const { clearCount } = useEventNotificationStore();
  
  // Confirm dialog
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  const fetchOrganizationData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organization/events');
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.status === 404) {
        router.push('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch organization events');
      }

      const data = await response.json();
      setOrganizationData({
        id: 'temp', // We don't need the org ID for this page
        name: 'Organization', // We don't need the org name for this page
        events: data.events || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching organization events:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchOrganizationData();
    }
  }, [isLoading, user, router, fetchOrganizationData]);

  // Clear event notifications when visiting the organization events page
  useEffect(() => {
    clearCount();
  }, [clearCount]);

  const handleCreateEvent = () => {
    router.push('/organization/events/create');
  };

  const handleDuplicateEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/organization/events/${eventId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate event');
      }

      toast.success('Event duplicated successfully');
      fetchOrganizationData(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate event');
    }
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    showConfirm({
      title: 'Delete Event',
      message: `Are you sure you want to delete "${eventTitle}"? This action cannot be undone and all event data will be permanently removed.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'delete',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete event');
          }

          toast.success('Event deleted successfully');
          fetchOrganizationData(); // Refresh data
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete event');
        }
      }
    });
  };


  const filteredEvents = organizationData?.events?.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'public' && event.isPublic) ||
                       (typeFilter === 'private' && !event.isPublic);
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'DRAFT': return 'Draft';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const getTypeColor = (isPublic: boolean) => {
    return isPublic ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!organizationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-muted-foreground mb-4">You are not part of any organization.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[22px] pb-8">

        {/* Compact Professional Header */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left: Page Info */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Event Management
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create and manage your organization&apos;s events
                  </p>
                </div>
              </div>

              {/* Right: Action Button */}
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleCreateEvent} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{organizationData.events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold">
                    {organizationData.events.filter(e => e.status === 'ACTIVE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold">
                    {organizationData.events.reduce((sum, e) => sum + e.currentParticipants, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Public Events</p>
                  <p className="text-2xl font-bold">
                    {organizationData.events.filter(e => e.isPublic).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="public">Public Events</SelectItem>
                    <SelectItem value="private">Private Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const eventImageUrl = event.coverImage || event.imageUrl || '/default-event-cover.svg';
            
            return (
              <Card 
                key={event.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => router.push(`/organization/events/${event.id}`)}
              >
                {/* Event Cover Image */}
                <div className="relative w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                  <img
                    src={eventImageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to default image if the image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-event-cover.svg';
                    }}
                  />
                  {/* Status and Type Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    <Badge className={`${getStatusColor(event.status)} shadow-md`}>
                      {getStatusDisplay(event.status)}
                    </Badge>
                    <Badge className={`${getTypeColor(event.isPublic)} shadow-md`}>
                      {event.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  {/* Actions Menu Overlay */}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="shadow-md"
                        >
                          <Filter className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/organization/events/${event.id}`);
                        }}>
                          <Eye className="w-4 h-4 mr-3" />
                          View Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/organization/events/${event.id}/edit`);
                        }}>
                          <Edit className="w-4 h-4 mr-3" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateEvent(event.id);
                        }}>
                          <Copy className="w-4 h-4 mr-3" />
                          Duplicate Event
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id, event.title);
                          }}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                      {event.endDate && (
                        <span className="mx-1">-</span>
                      )}
                      {event.endDate && (
                        <span>{new Date(event.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="truncate">
                          {typeof event.location === 'string' 
                            ? event.location 
                            : event.location?.isVirtual 
                              ? 'Virtual Event' 
                              : event.location?.city || event.location?.address || 'Location TBD'
                          }
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>
                        {event.currentParticipants}
                        {event.maxParticipants && ` / ${event.maxParticipants}`} participants
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredEvents.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first event to get started'
                }
              </p>
              {(!searchQuery && statusFilter === 'all' && typeFilter === 'all') && (
                <Button onClick={handleCreateEvent} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}