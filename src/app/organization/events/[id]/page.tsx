'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Share2,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  UserPlus,
  Mail,
  Phone,
  Award,
  Target,
  Zap,
  Shield,
  FileText,
  Settings,
  QrCode,
  Key,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'react-hot-toast';
import { getSDGById, getSDGColor } from '@/constants/sdgs';
import { useConfirmDialog } from '@/components/ui/simple-confirm-dialog';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  location: {
    address?: string;
    city: string;
    coordinates?: { lat: number; lng: number };
    isVirtual: boolean;
  } | string;
  maxParticipants?: number;
  currentParticipants: number;
  status: string;
  sdg: string;
  type: string;
  isPublic: boolean;
  createdAt: string;
  imageUrl?: string;
  skills: string[];
  intensity: number;
  verificationType: string;
  eventInstructions?: string;
  materialsNeeded: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    email: string;
  };
  requiresApproval: boolean;
  autoIssueCertificates: boolean;
  participations: Participation[];
  attendanceCode?: string | null;
  attendanceEnabled?: boolean;
  attendanceEnabledAt?: string | null;
  attendanceDisabledAt?: string | null;
}

interface Participation {
  id: string;
  userId: string;
  status: string;
  joinedAt: string;
  verifiedAt?: string;
  hours?: number;
  feedback?: string;
  registrationInfo?: {
    motivation?: string;
    skills?: string;
    notes?: string;
    hoursCommitted?: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    impactScore: number;
    tier: string;
    firstName?: string | null;
    lastName?: string | null;
    dateOfBirth?: string | null;
  };
}

interface EventStats {
  totalParticipants: number;
  verifiedParticipants: number;
  pendingParticipants: number;
  totalHours: number;
  averageRating: number;
  completionRate: number;
}

export default function EventDetailPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('registration-approval');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [showAllRegistrations, setShowAllRegistrations] = useState(false);
  const [showAllVerifications, setShowAllVerifications] = useState(false);
  
  
  // Confirm dialog
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  
  // Helper function to toggle card expansion
  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };
  
  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string | null | undefined): string => {
    if (!dateOfBirth) return '';
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age.toString();
    } catch (e) {
      return '';
    }
  };
  
  // Helper function to format participant name
  const getParticipantName = (participant: Participation): string => {
    if (participant.user.firstName || participant.user.lastName) {
      return `${participant.user.firstName || ''} ${participant.user.lastName || ''}`.trim();
    }
    return participant.user.name || 'Unknown';
  };

  // Helper function to get first name from participant
  const getParticipantFirstName = (participant: Participation): string => {
    if (participant.user.firstName) {
      return participant.user.firstName;
    }
    // Parse from name field if firstName is not available
    // First name is all parts except the last one (e.g., "Li Yuan" from "Li Yuan Peng")
    if (participant.user.name) {
      const parts = participant.user.name.trim().split(/\s+/);
      if (parts.length > 1) {
        return parts.slice(0, -1).join(' ') || '-';
      }
      return parts[0] || '-';
    }
    return '-';
  };

  // Helper function to get last name from participant
  const getParticipantLastName = (participant: Participation): string => {
    if (participant.user.lastName) {
      return participant.user.lastName;
    }
    // Parse from name field if lastName is not available
    // Last name is the last part (e.g., "Peng" from "Li Yuan Peng")
    if (participant.user.name) {
      const parts = participant.user.name.trim().split(/\s+/);
      if (parts.length > 1) {
        return parts[parts.length - 1] || '-';
      }
    }
    return '-';
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user && eventId) {
      fetchEventDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, eventId]);


  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/organization/events/${eventId}`);
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.status === 403) {
        setError('You do not have permission to view this event');
        return;
      }

      if (response.status === 404) {
        setError('Event not found');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch event details' }));
        throw new Error(errorData.error || 'Failed to fetch event details');
      }

      const data = await response.json();
      if (!data.event) {
        throw new Error('Event data is missing from response');
      }
      setEvent(data.event);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VOLUNTEERING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'WORKSHOP': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'FUNDRAISER': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CLEANUP': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'AWARENESS': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeDisplay = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const getParticipationStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTERED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'CONFIRMED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'VERIFIED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'ATTENDED': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getParticipationStatusIcon = (status: string) => {
    switch (status) {
      case 'REGISTERED': return <Clock className="w-4 h-4" />;
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'VERIFIED': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <AlertCircle className="w-4 h-4" />;
      case 'ATTENDED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleEditEvent = () => {
    router.push(`/organization/events/${eventId}/edit`);
  };

  const handleDuplicateEvent = async () => {
    try {
      const response = await fetch(`/api/organization/events/${eventId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to duplicate event' }));
        throw new Error(errorData.error || 'Failed to duplicate event');
      }

      const data = await response.json();
      toast.success('Event duplicated successfully');
      // Redirect to events list page to see the duplicated event
      router.push('/organization/events');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate event';
      toast.error(errorMessage);
      console.error('Error duplicating event:', error);
    }
  };

  const handleDeleteEvent = () => {
    if (!event) return;
    
    showConfirm({
      title: 'Delete Event',
      message: `Are you sure you want to delete "${event.title}"? This action cannot be undone and all event data will be permanently removed.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'delete',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/organization/events/${eventId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete event');
          }

          toast.success('Event deleted successfully');
          router.push('/organization/events');
        } catch (error) {
          toast.error('Failed to delete event');
          console.error('Error deleting event:', error);
        }
      }
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/organization/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event status');
      }

      toast.success('Event status updated successfully');
      fetchEventDetails(); // Refresh data
    } catch (error) {
      toast.error('Failed to update event status');
      console.error('Error updating event status:', error);
    }
  };

  const handleToggleAttendance = async (enabled: boolean) => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendance/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to toggle attendance' }));
        const errorMessage = errorData.error || errorData.details || 'Failed to toggle attendance';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      toast.success(data.message || (enabled ? 'Attendance enabled' : 'Attendance disabled'));
      fetchEventDetails(); // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle attendance';
      toast.error(errorMessage);
      console.error('Error toggling attendance:', error);
    }
  };

  const handleApproveParticipation = async (participationId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants/${participationId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = text ? { error: text } : { error: `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('Approve participation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        const errorMessage = errorData.error || errorData.details || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(result.message || 'Registration approved successfully');
      fetchEventDetails(); // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve participation';
      toast.error(errorMessage);
      console.error('Error approving participation:', error);
    }
  };

  const handleRejectParticipation = async (participationId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants/${participationId}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Clone response to read as text without consuming the original
        const clonedResponse = response.clone();
        let errorData: any = {};
        
        try {
          // Read response as text first to check if it's empty
          const responseText = await clonedResponse.text();
          
          if (responseText && responseText.trim() !== '' && responseText.trim() !== '{}') {
            try {
              errorData = JSON.parse(responseText);
            } catch (jsonError) {
              // Not valid JSON, use text as error
              errorData = { error: responseText };
            }
          }
          
          // If we still have an empty object, provide helpful default
          if (!errorData.error && !errorData.details && !errorData.message) {
            if (responseText && responseText.trim() === '{}') {
              errorData = { 
                error: `HTTP ${response.status}: ${response.statusText}`,
                details: 'Server returned an empty JSON object. This may indicate a database configuration issue. Check server logs for details.'
              };
            } else if (!responseText || responseText.trim() === '') {
              errorData = { 
                error: `HTTP ${response.status}: ${response.statusText}`,
                details: 'Server returned an empty response. This may indicate a database configuration issue or server error. Please ensure the database migration has been applied: npx prisma migrate deploy'
              };
            } else {
              errorData = { 
                error: `HTTP ${response.status}: ${response.statusText}`,
                details: responseText.substring(0, 200)
              };
            }
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            details: 'Unable to read error response from server. Check server logs for details.'
          };
        }
        
        console.error('Reject participation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          keys: Object.keys(errorData)
        });
        
        const errorMessage = errorData.error || errorData.details || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(result.message || 'Registration rejected');
      fetchEventDetails(); // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject participation';
      toast.error(errorMessage);
      console.error('Error rejecting participation:', error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Event Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The event you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/organization/events')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const sdgNumbers = event.sdg ? (() => {
    try {
      // Try to parse as JSON array first
      if (typeof event.sdg === 'string' && event.sdg.startsWith('[')) {
        const parsed = JSON.parse(event.sdg);
        return Array.isArray(parsed) ? parsed.filter((num: any) => num !== null && !isNaN(num)) : [];
      }
      // Otherwise, try split by comma
      return event.sdg.split(',').map(sdg => {
        const match = sdg.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      }).filter(num => num !== null);
    } catch {
      // If parsing fails, try split by comma
      return event.sdg.split(',').map(sdg => {
        const match = sdg.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      }).filter(num => num !== null);
    }
  })() : [];
  const participationRate = event.maxParticipants ? (event.currentParticipants / event.maxParticipants) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/organization/events')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleDuplicateEvent}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                onClick={handleEditEvent}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteEvent}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-100 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {event.title}
              </h1>
              <div className="flex items-center space-x-3 mb-4">
                <Badge className={getStatusColor(event.status)}>
                  {getStatusDisplay(event.status)}
                </Badge>
                <Badge className={getTypeColor(event.type)}>
                  {getTypeDisplay(event.type)}
                </Badge>
                <Badge className={event.isPublic ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}>
                  {event.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Attendance Management */}
              {(event.status === 'ACTIVE' || event.status === 'UPCOMING') && (
                event.attendanceEnabled ? (
                  <Button
                    variant="outline"
                    onClick={() => handleToggleAttendance(false)}
                    className="px-4 py-2 text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-100 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Disable Attendance
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleToggleAttendance(true)}
                    className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Enable Attendance
                  </Button>
                )
              )}
              {event.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('COMPLETED')}
                  className="px-4 py-2 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-100 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              )}
              {event.status === 'DRAFT' && (
                <Button
                  onClick={() => handleStatusChange('ACTIVE')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Publish Event
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-900 dark:text-white">Event Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(event.startDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {event.endDate && (
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(event.endDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {event.registrationDeadline && (
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Registration Deadline</p>
                        <p className="font-medium text-orange-600 dark:text-orange-400">
                          {new Date(event.registrationDeadline).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {typeof event.location === 'string' 
                          ? event.location 
                          : event.location?.isVirtual 
                            ? 'Virtual Event' 
                            : event.location?.city || event.location?.address || 'Location TBD'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.currentParticipants}
                        {event.maxParticipants && ` / ${event.maxParticipants}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SDG Tags */}
                {sdgNumbers.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">SDG Focus Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {sdgNumbers.map((sdgNumber) => {
                        // Safety check to ensure sdgNumber is valid
                        if (!sdgNumber || isNaN(sdgNumber)) {
                          return null;
                        }
                        
                        const sdg = getSDGById(sdgNumber);
                        return (
                          <div
                            key={sdgNumber}
                            className="group relative overflow-hidden rounded-lg border transition-all hover:shadow-md"
                            style={{ borderColor: getSDGColor(sdgNumber) }}
                          >
                            <div 
                              className="absolute inset-0 opacity-5"
                              style={{ backgroundColor: getSDGColor(sdgNumber) }}
                            />
                            <div className="relative px-3 py-1.5 flex items-center space-x-2">
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                style={{ backgroundColor: getSDGColor(sdgNumber) }}
                              >
                                {sdgNumber}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {sdg?.title || `SDG ${sdgNumber}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {event.skills && event.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Configuration & Impact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-900 dark:text-white">Event Configuration & Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scoring Parameters */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-purple-600" />
                    Impact Scoring Parameters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Intensity Multiplier */}
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center space-x-2 mb-1">
                        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Intensity Multiplier</p>
                      </div>
                      <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{event.intensity || 1.0}x</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {event.intensity && event.intensity > 1.0 ? 'High Impact' : event.intensity && event.intensity < 1.0 ? 'Standard Impact' : 'Normal Impact'}
                      </p>
                    </div>

                    {/* Estimated Hours per Participant */}
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Est. Hours/Participant</p>
                      </div>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {event.type === 'WORKSHOP' ? '2-4' : event.type === 'FUNDRAISER' ? '3-6' : '2-3'} hrs
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Based on event type</p>
                    </div>

                    {/* Skill Impact Multiplier */}
                    <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-1">
                        <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <p className="text-xs font-medium text-green-700 dark:text-green-300">Skills Required</p>
                      </div>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">
                        {event.skills && event.skills.length > 0 ? `+${(event.skills.length * 0.1).toFixed(1)}x` : '1.0x'}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {event.skills && event.skills.length > 0 ? `${event.skills.length} skills boost` : 'No skills boost'}
                      </p>
                    </div>

                    {/* Verification Multiplier */}
                    <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-2 mb-1">
                        <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Verification Type</p>
                      </div>
                      <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                        {event.verificationType === 'ORGANIZER' ? '1.1x' : event.verificationType === 'PEER' ? '1.0x' : '0.8x'}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{event.verificationType || 'ORGANIZER'}</p>
                    </div>
                  </div>

                  {/* Potential Impact Score Calculation */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                          Potential Impact Score (per participant)
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                          Formula: Base Hours × Intensity × Skills × Verification × Location
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                          {(
                            (event.type === 'WORKSHOP' ? 3 : event.type === 'FUNDRAISER' ? 4 : 2.5) *
                            (event.intensity || 1.0) *
                            (1 + (event.skills?.length || 0) * 0.1) *
                            (event.verificationType === 'ORGANIZER' ? 1.1 : 1.0) *
                            10
                          ).toFixed(1)}
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">points</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Settings */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-blue-600" />
                    Event Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Target className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Requires Approval</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {event.requiresApproval ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Award className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Auto-Issue Certificates</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {event.autoIssueCertificates ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Management */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <QrCode className="w-4 h-4 mr-2 text-purple-600" />
                    Attendance Management
                  </h3>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    {event.attendanceEnabled ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-700 dark:text-green-300">Attendance Enabled</span>
                          </div>
                        </div>
                        {event.attendanceCode && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-purple-300 dark:border-purple-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attendance Code</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono tracking-wider">
                                  {event.attendanceCode}
                                </p>
                              </div>
                              <Key className="w-8 h-8 text-purple-400" />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Share this code with participants to mark attendance
                            </p>
                          </div>
                        )}
                        {event.attendanceEnabledAt && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Enabled at: {new Date(event.attendanceEnabledAt).toLocaleString()}
                          </div>
                        )}
                        {event.attendanceDisabledAt && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            Disabled at: {new Date(event.attendanceDisabledAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">Attendance tracking is disabled</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Enable attendance to generate a code for participants
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {event.eventInstructions && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instructions</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {event.eventInstructions}
                    </p>
                  </div>
                )}

                {event.materialsNeeded && event.materialsNeeded.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Materials Needed</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.materialsNeeded.map((material, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {event.emergencyContact && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Emergency Contact</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {event.emergencyContact.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {event.emergencyContact.phone}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {event.emergencyContact.email}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Event Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-900 dark:text-white">Event Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <>
                    {/* Participation Rate Progress */}
                    <div className="space-y-2 p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Participation Rate</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {participationRate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={participationRate} className="h-2.5" />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Total</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {stats.totalParticipants}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Participants</div>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">Verified</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {stats.verifiedParticipants}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">Confirmed</div>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Hours</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {stats.totalHours}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Volunteered</div>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Complete</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                          {stats.completionRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Rate</div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Certificate Configuration Button - Same width as Event Statistics card */}
                <Button
                  className="w-full mt-4"
                  onClick={() => router.push(`/organization/events/${eventId}/certificate`)}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Certificate for this event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Participants Section - Centered with ESG Table Design */}
        <div className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  Participants ({event.participations?.filter(p => p.status === 'CONFIRMED' || p.status === 'ATTENDED' || p.status === 'VERIFIED').length || 0})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage event participants, approve registrations, and verify attendance
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pills for filtering */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveTab('registration-approval')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        activeTab === 'registration-approval'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Registration Approval ({event.participations?.filter(p => p.status === 'PENDING' || p.status === 'REGISTERED').length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('participant-management')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        activeTab === 'participant-management'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Participant Management ({event.participations?.filter(p => p.status === 'CONFIRMED' || p.status === 'ATTENDED' || p.status === 'VERIFIED').length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('post-event-verification')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        activeTab === 'post-event-verification'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Post-Event Verification ({event.participations?.filter(p => p.status === 'ATTENDED' || p.status === 'VERIFIED').length || 0})
                    </button>
                  </div>

                  {/* Participants List - ESG Table Design */}
                  {activeTab === 'registration-approval' && (
                    <>
                      {event.participations && event.participations.filter(p => p.status === 'PENDING' || p.status === 'REGISTERED').length > 0 ? (
                        <>
                          <div className="flex items-center justify-end mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAllRegistrations(!showAllRegistrations)}
                              className="text-gray-600 dark:text-gray-400"
                            >
                              {showAllRegistrations ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-1" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  Show All
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="space-y-4">
                            {event.participations
                              .filter(p => p.status === 'PENDING' || p.status === 'REGISTERED')
                              .slice(0, showAllRegistrations ? undefined : 2)
                              .map((participation, index) => {
                            const isExpanded = expandedCards.has(participation.id);
                            return (
                            <Card key={participation.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-medium">{getParticipantName(participation)}</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleCard(participation.id)}
                                    className="text-gray-600 dark:text-gray-400"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-4 h-4 mr-1" />
                                        Collapse
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4 mr-1" />
                                        Expand
                                      </>
                                    )}
                                  </Button>
                                </div>
                                
                                {isExpanded && (
                                <div className="space-y-3">
                                  {/* First Name */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">First Name:</span> {getParticipantFirstName(participation)}
                                    </p>
                                  </div>

                                  {/* Last Name */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Last Name:</span> {getParticipantLastName(participation)}
                                    </p>
                                  </div>

                                  {/* Age */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Age:</span> {calculateAge(participation.user.dateOfBirth) || '-'}
                                    </p>
                                  </div>

                                  {/* Email */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span> {participation.user.email}
                                    </p>
                                  </div>

                                  {/* Impact Score */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Impact Score:</span> {participation.user.impactScore.toFixed(1)}
                                    </p>
                                  </div>

                                  {/* Joined Date */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Joined Date:</span> {new Date(participation.joinedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>

                                  {/* Registration Information */}
                                  {participation.registrationInfo && (
                                    <>
                                      {participation.registrationInfo.hoursCommitted && (
                                        <div>
                                          <p className="text-sm text-gray-900 dark:text-white">
                                            <span className="font-medium text-gray-600 dark:text-gray-400">Hours Committed:</span> {participation.registrationInfo.hoursCommitted} hours
                                          </p>
                                        </div>
                                      )}
                                      {participation.registrationInfo.motivation && (
                                        <div>
                                          <p className="text-sm text-gray-900 dark:text-white">
                                            <span className="font-medium text-gray-600 dark:text-gray-400">Motivation:</span>
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-4">
                                            {participation.registrationInfo.motivation}
                                          </p>
                                        </div>
                                      )}
                                      {participation.registrationInfo.skills && (
                                        <div>
                                          <p className="text-sm text-gray-900 dark:text-white">
                                            <span className="font-medium text-gray-600 dark:text-gray-400">Relevant Skills:</span>
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-4">
                                            {participation.registrationInfo.skills}
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* Actions */}
                                  {(participation.status === 'PENDING' || participation.status === 'REGISTERED') && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Actions</p>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleApproveParticipation(participation.id)}
                                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-100 hover:bg-green-50 dark:hover:bg-green-900/20"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRejectParticipation(participation.id)}
                                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-100 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              </CardContent>
                            </Card>
                            );
                          })}
                        </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No registrations pending approval</p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'post-event-verification' && (
                    <>
                      {event.participations && event.participations.filter(p => p.status === 'ATTENDED' || p.status === 'VERIFIED').length > 0 ? (
                        <>
                          <div className="flex items-center justify-end mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAllVerifications(!showAllVerifications)}
                              className="text-gray-600 dark:text-gray-400"
                            >
                              {showAllVerifications ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-1" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  Show All
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="space-y-4">
                            {event.participations
                              .filter(p => p.status === 'ATTENDED' || p.status === 'VERIFIED')
                              .slice(0, showAllVerifications ? undefined : 2)
                              .map((participation, index) => {
                            const isExpanded = expandedCards.has(participation.id);
                            return (
                            <Card key={participation.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{getParticipantName(participation)}</h4>
                                    {/* Progress Bar */}
                                    <div className="mt-2 space-y-1">
                                      <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                                        <span>Verification Progress</span>
                                        <span className="font-medium">
                                          {participation.status === 'VERIFIED' ? '100%' : participation.status === 'ATTENDED' ? '50%' : '0%'}
                                        </span>
                                      </div>
                                      <Progress 
                                        value={participation.status === 'VERIFIED' ? 100 : participation.status === 'ATTENDED' ? 50 : 0} 
                                        className="h-2" 
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-4">
                                    {participation.status !== 'VERIFIED' && (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                          showConfirm({
                                            title: 'Grant Approval',
                                            message: `Are you sure you want to grant approval to ${getParticipantName(participation)}? This will issue a certificate and update their impact score.`,
                                            confirmText: 'Grant Approval',
                                            cancelText: 'Cancel',
                                            type: 'warning',
                                            onConfirm: async () => {
                                              try {
                                                // Fetch certificate config first
                                                const configResponse = await fetch(`/api/organization/events/${eventId}/certificate-config`);
                                                let certName = event?.title || '';
                                                let certContent = '';
                                                if (configResponse.ok) {
                                                  const configData = await configResponse.json();
                                                  if (configData.certificateConfig) {
                                                    certName = configData.certificateConfig.certificateName || event?.title || '';
                                                    certContent = configData.certificateConfig.certificateContent || '';
                                                  }
                                                }
                                                const response = await fetch(`/api/organization/events/${eventId}/participants/${participation.id}/grant-approval`, {
                                                  method: 'POST',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                  },
                                                  body: JSON.stringify({
                                                    certificateName: certName,
                                                    certificateContent: certContent,
                                                  }),
                                                });

                                                if (!response.ok) {
                                                  let errorData: any = {};
                                                  try {
                                                    const responseText = await response.text();
                                                    if (responseText) {
                                                      try {
                                                        errorData = JSON.parse(responseText);
                                                      } catch {
                                                        errorData = { error: responseText };
                                                      }
                                                    }
                                                  } catch (parseError) {
                                                    console.error('Failed to parse error response:', parseError);
                                                    errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                                                  }
                                                  console.error('Grant approval error:', errorData);
                                                  const errorMessage = errorData.error || errorData.details || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                                                  throw new Error(errorMessage);
                                                }

                                                const result = await response.json();
                                                toast.success(result.message || 'Certificate and impact score sent! Waiting for participant confirmation.');
                                                fetchEventDetails();
                                              } catch (error) {
                                                const errorMessage = error instanceof Error ? error.message : 'Failed to grant approval';
                                                toast.error(errorMessage);
                                                console.error('Error granting approval:', error);
                                              }
                                            }
                                          });
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Grant Approval
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleCard(participation.id)}
                                      className="text-gray-600 dark:text-gray-400"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <ChevronUp className="w-4 h-4 mr-1" />
                                          Collapse
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-4 h-4 mr-1" />
                                          Expand
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                <div className="space-y-3">
                                  {/* First Name */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">First Name:</span> {getParticipantFirstName(participation)}
                                    </p>
                                  </div>

                                  {/* Last Name */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Last Name:</span> {getParticipantLastName(participation)}
                                    </p>
                                  </div>

                                  {/* Age */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Age:</span> {calculateAge(participation.user.dateOfBirth) || '-'}
                                    </p>
                                  </div>

                                  {/* Hours */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Hours:</span> {participation.hours || 0}
                                    </p>
                                  </div>

                                  {/* Impact Score */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Impact Score:</span> {participation.user.impactScore.toFixed(1)}
                                    </p>
                                  </div>

                                  {/* Check-In Time */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Check-In Time:</span> {participation.verifiedAt ? new Date(participation.verifiedAt).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : '-'}
                                    </p>
                                  </div>

                                  {/* Joined Date */}
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Joined Date:</span> {new Date(participation.joinedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                )}
                              </CardContent>
                            </Card>
                            );
                              })}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No participants verified yet</p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'participant-management' && (
                    <>
                      {event.participations && event.participations.filter(p => p.status === 'CONFIRMED' || p.status === 'ATTENDED' || p.status === 'VERIFIED').length > 0 ? (
                        <>
                          <div className="flex items-center justify-end mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAllParticipants(!showAllParticipants)}
                              className="text-gray-600 dark:text-gray-400"
                            >
                              {showAllParticipants ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-1" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  Show All
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="space-y-4">
                            {event.participations
                              .filter(p => p.status === 'CONFIRMED' || p.status === 'ATTENDED' || p.status === 'VERIFIED')
                              .slice(0, showAllParticipants ? undefined : 2)
                              .map((participation, index) => {
                                const isExpanded = expandedCards.has(participation.id);
                                return (
                                <Card key={participation.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="font-medium">{getParticipantName(participation)}</h4>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleCard(participation.id)}
                                          className="text-gray-600 dark:text-gray-400"
                                        >
                                          {isExpanded ? (
                                            <>
                                              <ChevronUp className="w-4 h-4 mr-1" />
                                              Collapse
                                            </>
                                          ) : (
                                            <>
                                              <ChevronDown className="w-4 h-4 mr-1" />
                                              Expand
                                            </>
                                          )}
                                        </Button>
                                        {participation.status !== 'VERIFIED' && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              showConfirm({
                                                title: 'Delete Participant',
                                                message: `Are you sure you want to remove ${participation.user.name} from this event? This action cannot be undone.`,
                                                confirmText: 'Delete',
                                                cancelText: 'Cancel',
                                                type: 'warning',
                                                onConfirm: async () => {
                                                  try {
                                                    const response = await fetch(`/api/events/${eventId}/participants/${participation.id}`, {
                                                      method: 'DELETE',
                                                    });

                                                    if (!response.ok) {
                                                      const errorData = await response.json().catch(() => ({ error: 'Failed to delete participant' }));
                                                      throw new Error(errorData.error || 'Failed to delete participant');
                                                    }

                                                    toast.success('Participant removed successfully');
                                                    fetchEventDetails();
                                                  } catch (error) {
                                                    const errorMessage = error instanceof Error ? error.message : 'Failed to delete participant';
                                                    toast.error(errorMessage);
                                                    console.error('Error deleting participant:', error);
                                                  }
                                                }
                                              });
                                            }}
                                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                            title="Delete Participant"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {isExpanded && (
                                    <div className="space-y-3">
                                      {/* First Name */}
                                      <div>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          <span className="font-medium text-gray-600 dark:text-gray-400">First Name:</span> {getParticipantFirstName(participation)}
                                        </p>
                                      </div>

                                      {/* Last Name */}
                                      <div>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          <span className="font-medium text-gray-600 dark:text-gray-400">Last Name:</span> {getParticipantLastName(participation)}
                                        </p>
                                      </div>

                                      {/* Age */}
                                      <div>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          <span className="font-medium text-gray-600 dark:text-gray-400">Age:</span> {calculateAge(participation.user.dateOfBirth) || '-'}
                                        </p>
                                      </div>

                                      {/* Hours */}
                                      <div>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          <span className="font-medium text-gray-600 dark:text-gray-400">Hours:</span> {participation.hours || 0}
                                        </p>
                                      </div>

                                      {/* Impact Score */}
                                      <div>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          <span className="font-medium text-gray-600 dark:text-gray-400">Impact Score:</span> {participation.user.impactScore.toFixed(1)}
                                        </p>
                                      </div>

                                      {/* Joined Date */}
                                      <div>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          <span className="font-medium text-gray-600 dark:text-gray-400">Joined Date:</span> {new Date(participation.joinedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                    )}
                                  </CardContent>
                                </Card>
                                );
                              })}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No approved participants to manage</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}
