// home/ubuntu/impaktrweb/src/components/admin/EventModeration.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Check, 
  X, 
  AlertTriangle, 
  Flag, 
  Clock, 
  Users,
  MapPin,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { formatDate, formatTimeAgo, getInitials } from '@/lib/utils';

interface ModerationEvent {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  flagReason?: string;
  startDate: string;
  location: {
    city: string;
    isVirtual: boolean;
  };
  maxParticipants?: number;
  sdgTags: number[];
  creator: {
    id: string;
    name: string;
    avatar: string;
    userType: string;
  };
  organization?: {
    id: string;
    name: string;
    logo: string;
    isVerified: boolean;
  };
  reports: Array<{
    id: string;
    reporterId: string;
    reporterName: string;
    reason: string;
    description: string;
    createdAt: string;
  }>;
  moderationHistory: Array<{
    id: string;
    action: string;
    moderatorName: string;
    reason: string;
    createdAt: string;
  }>;
  createdAt: string;
  riskScore: number;
}

interface ModerationFilters {
  status: string;
  riskLevel: string;
  userType: string;
  dateRange: string;
  search: string;
}

export function EventModeration() {
  const [events, setEvents] = useState<ModerationEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ModerationEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [filters, setFilters] = useState<ModerationFilters>({
    status: 'PENDING',
    riskLevel: 'all',
    userType: 'all',
    dateRange: '7d',
    search: ''
  });

  useEffect(() => {
    fetchModerationEvents();
  }, [filters]);

  const fetchModerationEvents = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.set(key, value);
        }
      });

      const response = await fetch(`/api/admin/events/moderation?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      } else {
        // Mock data for development
        setMockModerationData();
      }
    } catch (error) {
      console.error('Error fetching moderation events:', error);
      setMockModerationData();
    } finally {
      setIsLoading(false);
    }
  };

  const setMockModerationData = () => {
    const mockEvents: ModerationEvent[] = [
      {
        id: '1',
        title: 'Charity Beach Cleanup - Suspicious Activity',
        description: 'Join us for a beach cleanup initiative to protect marine life and coastal environments.',
        status: 'FLAGGED',
        flagReason: 'Unusual participant registration pattern',
        startDate: '2024-01-20T09:00:00Z',
        location: { city: 'Penang', isVirtual: false },
        maxParticipants: 50,
        sdgTags: [13, 14],
        creator: {
          id: 'user1',
          name: 'John Doe',
          avatar: '',
          userType: 'INDIVIDUAL'
        },
        reports: [
          {
            id: 'rep1',
            reporterId: 'user2',
            reporterName: 'Jane Smith',
            reason: 'Suspicious registration pattern',
            description: 'Multiple accounts registering from same IP address',
            createdAt: '2024-01-15T10:00:00Z'
          }
        ],
        moderationHistory: [],
        createdAt: '2024-01-14T15:30:00Z',
        riskScore: 75
      },
      {
        id: '2',
        title: 'Medical Volunteer Training Program',
        description: 'Training program for medical volunteers in rural healthcare centers.',
        status: 'PENDING',
        startDate: '2024-01-25T14:00:00Z',
        location: { city: 'Kuala Lumpur', isVirtual: false },
        maxParticipants: 30,
        sdgTags: [3],
        creator: {
          id: 'org1',
          name: 'HealthCare Malaysia',
          avatar: '',
          userType: 'HEALTHCARE'
        },
        organization: {
          id: 'org1',
          name: 'HealthCare Malaysia',
          logo: '',
          isVerified: true
        },
        reports: [],
        moderationHistory: [],
        createdAt: '2024-01-16T09:15:00Z',
        riskScore: 15
      },
      {
        id: '3',
        title: 'Coding Workshop for Underprivileged Youth',
        description: 'Free coding workshop to teach programming skills to underprivileged youth.',
        status: 'PENDING',
        startDate: '2024-01-22T10:00:00Z',
        location: { city: 'Shah Alam', isVirtual: false },
        maxParticipants: 25,
        sdgTags: [4, 10],
        creator: {
          id: 'org2',
          name: 'TechForGood MY',
          avatar: '',
          userType: 'NGO'
        },
        organization: {
          id: 'org2',
          name: 'TechForGood MY',
          logo: '',
          isVerified: false
        },
        reports: [],
        moderationHistory: [],
        createdAt: '2024-01-17T11:20:00Z',
        riskScore: 25
      }
    ];

    setEvents(mockEvents);
  };

  const handleModerationAction = async (eventId: string, action: 'approve' | 'reject' | 'flag') => {
    setActionLoading(eventId + action);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason: moderationNote,
        }),
      });

      if (response.ok) {
        // Update the event in the list
        setEvents(prev =>
          prev.map(event =>
            event.id === eventId
              ? { ...event, status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'FLAGGED' }
              : event
          )
        );
        setModerationNote('');
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error moderating event:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 70) return 'bg-red-100 text-red-800 border-red-200';
    if (riskScore >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getRiskLevel = (riskScore: number) => {
    if (riskScore >= 70) return 'High Risk';
    if (riskScore >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Moderation</h1>
          <p className="text-muted-foreground">Review and moderate platform events</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Badge variant="destructive" className="text-xs">
            {events.filter(e => e.status === 'FLAGGED').length} Flagged
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {events.filter(e => e.status === 'PENDING').length} Pending Review
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending Review</SelectItem>
                <SelectItem value="FLAGGED">Flagged</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.riskLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk (70+)</SelectItem>
                <SelectItem value="medium">Medium Risk (40-69)</SelectItem>
                <SelectItem value="low">Low Risk (&lt;40)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.userType} onValueChange={(value) => setFilters(prev => ({ ...prev, userType: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All User Types</SelectItem>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="NGO">NGO</SelectItem>
                <SelectItem value="CORPORATE">Corporate</SelectItem>
                <SelectItem value="SCHOOL">School</SelectItem>
                <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Events Requiring Moderation
            <div className="text-sm font-normal text-muted-foreground">
              {events.length} total events
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="w-24 h-8 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No events to moderate</h3>
              <p className="text-muted-foreground">All events are currently approved or processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                    event.status === 'FLAGGED' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' :
                    event.riskScore >= 70 ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/10' :
                    'border-border'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Creator Avatar */}
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={event.organization?.logo || event.creator.avatar} 
                        alt={event.organization?.name || event.creator.name}
                      />
                      <AvatarFallback>
                        {getInitials(event.organization?.name || event.creator.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {event.organization?.name || event.creator.name}
                              {event.organization?.isVerified && (
                                <Check className="w-3 h-3 ml-1 text-green-500" />
                              )}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(event.startDate)}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {event.location.isVirtual ? 'Virtual' : event.location.city}
                            </span>
                          </div>
                        </div>

                        {/* Status and Risk */}
                        <div className="flex items-center space-x-2">
                          <Badge className={getRiskBadgeColor(event.riskScore)}>
                            {getRiskLevel(event.riskScore)}
                          </Badge>
                          
                          <Badge
                            variant={
                              event.status === 'FLAGGED' ? 'destructive' :
                              event.status === 'APPROVED' ? 'default' :
                              event.status === 'REJECTED' ? 'secondary' :
                              'outline'
                            }
                          >
                            {event.status}
                          </Badge>

                          {event.reports.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {event.reports.length} Reports
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {event.description}
                      </p>

                      {/* SDG Tags */}
                      <div className="flex items-center space-x-2 mb-3">
                        {event.sdgTags.map((sdgNumber) => (
                          <Badge key={sdgNumber} variant="sdg" sdgNumber={sdgNumber} className="text-xs">
                            SDG {sdgNumber}
                          </Badge>
                        ))}
                      </div>

                      {/* Flag Reason */}
                      {event.flagReason && (
                        <div className="flex items-center space-x-2 p-2 bg-red-100 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800 mb-3">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-800 dark:text-red-200">{event.flagReason}</span>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Created {formatTimeAgo(event.createdAt)}</span>
                        <span>Risk Score: {event.riskScore}/100</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                              Event Moderation Review
                              <Badge className={getRiskBadgeColor(event.riskScore)}>
                                {getRiskLevel(event.riskScore)}
                              </Badge>
                            </DialogTitle>
                            <DialogDescription>
                              Review event details and take moderation action
                            </DialogDescription>
                          </DialogHeader>

                          {selectedEvent && (
                            <div className="space-y-6">
                              {/* Event Details */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">{selectedEvent.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <p className="text-muted-foreground">{selectedEvent.description}</p>
                                  
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Event Details</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>Start: {formatDate(selectedEvent.startDate)}</div>
                                        <div>Location: {selectedEvent.location.isVirtual ? 'Virtual' : selectedEvent.location.city}</div>
                                        <div>Max Participants: {selectedEvent.maxParticipants || 'Unlimited'}</div>
                                        <div>SDGs: {selectedEvent.sdgTags.join(', ')}</div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-2">Creator Info</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>Name: {selectedEvent.creator.name}</div>
                                        <div>Type: {selectedEvent.creator.userType}</div>
                                        {selectedEvent.organization && (
                                          <div>Organization: {selectedEvent.organization.name}</div>
                                        )}
                                        <div>Risk Score: {selectedEvent.riskScore}/100</div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Reports */}
                              {selectedEvent.reports.length > 0 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                      <Flag className="w-5 h-5 mr-2" />
                                      Reports ({selectedEvent.reports.length})
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      {selectedEvent.reports.map((report) => (
                                        <div key={report.id} className="p-3 border rounded-lg bg-muted/50">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm">{report.reporterName}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {formatTimeAgo(report.createdAt)}
                                            </span>
                                          </div>
                                          <div className="text-sm mb-1">
                                            <strong>Reason:</strong> {report.reason}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {report.description}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Moderation Actions */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Moderation Action</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">
                                      Moderation Notes (optional)
                                    </label>
                                    <Textarea
                                      placeholder="Add notes about your moderation decision..."
                                      value={moderationNote}
                                      onChange={(e) => setModerationNote(e.target.value)}
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex space-x-3">
                                    <Button
                                      variant="default"
                                      onClick={() => handleModerationAction(selectedEvent.id, 'approve')}
                                      disabled={actionLoading === selectedEvent.id + 'approve'}
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Approve Event
                                    </Button>
                                    
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleModerationAction(selectedEvent.id, 'reject')}
                                      disabled={actionLoading === selectedEvent.id + 'reject'}
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Reject Event
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      onClick={() => handleModerationAction(selectedEvent.id, 'flag')}
                                      disabled={actionLoading === selectedEvent.id + 'flag'}
                                    >
                                      <Flag className="w-4 h-4 mr-2" />
                                      Flag for Review
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {event.status === 'PENDING' && (
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            onClick={() => handleModerationAction(event.id, 'approve')}
                            disabled={actionLoading === event.id + 'approve'}
                            className="px-3"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleModerationAction(event.id, 'reject')}
                            disabled={actionLoading === event.id + 'reject'}
                            className="px-3"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Moderation Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">2.3h</div>
            <div className="text-sm text-muted-foreground">Avg Review Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">94.2%</div>
            <div className="text-sm text-muted-foreground">Approval Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Flag className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">3.1%</div>
            <div className="text-sm text-muted-foreground">Flag Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <X className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">2.7%</div>
            <div className="text-sm text-muted-foreground">Rejection Rate</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}