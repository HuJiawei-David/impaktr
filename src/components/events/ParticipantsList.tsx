// home/ubuntu/impaktrweb/src/components/events/ParticipantsList.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  Search, 
  MoreHorizontal,
  CheckCircle,
  Clock,
  Award,
  Star,
  MessageSquare,
  UserCheck,
  UserX,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Tabs removed - using pill buttons instead
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatTimeAgo, getInitials, formatHours } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useConfirmDialog } from '@/components/ui/simple-confirm-dialog';

interface Participant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    profile: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      avatar?: string;
      occupation?: string;
      organization?: string;
      location?: {
        city: string;
        country: string;
      };
    };
    impaktrScore: number;
    currentRank: string;
  };
  hoursCommitted: number;
  hoursActual?: number;
  status: 'PENDING' | 'REGISTERED' | 'CONFIRMED' | 'ATTENDED' | 'VERIFIED' | 'REJECTED' | 'CANCELLED';
  notes?: string;
  proofImages: string[];
  qualityRating?: number;
  skillMultiplier: number;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifications: Array<{
    id: string;
    type: string;
    status: string;
    verifier?: {
      name: string;
      image?: string;
    };
    createdAt: string;
    rating?: number;
    comments?: string;
  }>;
}

interface ParticipantsListProps {
  eventId: string;
  isOrganizer?: boolean;
  canManageParticipants?: boolean;
}

export function ParticipantsList({ 
  eventId, 
  isOrganizer = false, 
  canManageParticipants = false 
}: ParticipantsListProps) {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventInfo, setEventInfo] = useState<{ endDate?: string | null; status?: string } | null>(null);
  
  // Confirm dialog
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  const [sortBy, setSortBy] = useState<string>('joinedDate');
  const [activeTab, setActiveTab] = useState('registration-approval');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationRating, setVerificationRating] = useState(5);

  const fetchParticipants = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants);
        if (data.event) {
          setEventInfo(data.event);
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Failed to load participants');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const filterAndSortParticipants = useCallback(() => {
    let filtered = [...participants];

    // Check if event has ended
    const eventHasEnded = () => {
      if (!eventInfo) return false;
      if (eventInfo.status === 'COMPLETED') return true;
      if (eventInfo.endDate) {
        const now = new Date();
        const endDate = new Date(eventInfo.endDate);
        return endDate < now;
      }
      return false;
    };

    // Filter by tab - New structure: Registration Approval vs Post-Event Verification vs Participant Management
    switch (activeTab) {
      case 'registration-approval':
        // Show only PENDING and REGISTERED (waiting for approval)
        // CONFIRMED users are actual participants and should not appear here
        filtered = filtered.filter(p => p.status === 'PENDING' || p.status === 'REGISTERED');
        break;
      case 'post-event-verification':
        // Only show ATTENDED and VERIFIED participants (who have checked in)
        // Participants who didn't check in (CONFIRMED) should not appear here
        // Admin needs to verify participation before granting VERIFIED status
        filtered = filtered.filter(p => p.status === 'ATTENDED' || p.status === 'VERIFIED');
        break;
      case 'participant-management':
        // Show all participants except REJECTED and CANCELLED for management
        filtered = filtered.filter(p => p.status !== 'REJECTED' && p.status !== 'CANCELLED');
        break;
      case 'rejected':
        filtered = filtered.filter(p => p.status === 'REJECTED');
        break;
      default:
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user.profile?.organization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter removed - using tab-based filtering only

    // Sort participants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.user.name.localeCompare(b.user.name);
        case 'score':
          return b.user.impaktrScore - a.user.impaktrScore;
        case 'hours':
          return (b.hoursActual || b.hoursCommitted) - (a.hoursActual || a.hoursCommitted);
        case 'joinedDate':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'verifiedDate':
          if (!a.verifiedAt && !b.verifiedAt) return 0;
          if (!a.verifiedAt) return 1;
          if (!b.verifiedAt) return -1;
          return new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredParticipants(filtered);
  }, [participants, searchTerm, sortBy, activeTab, eventInfo]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useEffect(() => {
    filterAndSortParticipants();
  }, [filterAndSortParticipants]);

  const handleApproveParticipant = async (participantId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants/${participantId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Registration approved successfully');
        fetchParticipants();
      } else {
        throw new Error('Failed to approve participant');
      }
    } catch (error) {
      console.error('Error approving participant:', error);
      toast.error('Failed to approve participant');
    }
  };

  const handleRejectParticipant = async (participantId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants/${participantId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Registration rejected');
        fetchParticipants();
      } else {
        throw new Error('Failed to reject participant');
      }
    } catch (error) {
      console.error('Error rejecting participant:', error);
      toast.error('Failed to reject participant');
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;
    
    // Prevent deletion of VERIFIED participants
    if (participant.status === 'VERIFIED') {
      toast.error('Cannot delete verified participation. It may have affected user impact scores.');
      return;
    }
    
    showConfirm({
      title: 'Remove Participant',
      message: `Are you sure you want to remove ${participant.user.name} from this event? This action cannot be undone.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/events/${eventId}/participants/${participantId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            toast.success('Participant removed successfully');
            fetchParticipants();
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Failed to remove participant' }));
            throw new Error(errorData.error || 'Failed to remove participant');
          }
        } catch (error) {
          console.error('Error removing participant:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to remove participant';
          toast.error(errorMessage);
        }
      }
    });
  };

  const handleSendMessage = async (participantId: string, message: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants/${participantId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        toast.success('Message sent');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const exportParticipantsList = () => {
    const csvContent = [
      ['Name', 'Email', 'Status', 'Hours Committed', 'Hours Actual', 'Score', 'Joined Date', 'Verified Date'],
      ...filteredParticipants.map(p => [
        p.user.name,
        p.user.email,
        p.status,
        p.hoursCommitted,
        p.hoursActual || '',
        p.user.impaktrScore,
        new Date(p.createdAt).toLocaleDateString(),
        p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants-${eventId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
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

  const getStatusCounts = () => {
    // Check if event has ended
    const eventHasEnded = () => {
      if (!eventInfo) return false;
      if (eventInfo.status === 'COMPLETED') return true;
      if (eventInfo.endDate) {
        const now = new Date();
        const endDate = new Date(eventInfo.endDate);
        return endDate < now;
      }
      return false;
    };

    // For Post-Event Verification, only count ATTENDED and VERIFIED participants (who have checked in)
    const postEventVerificationCount = participants.filter(p => p.status === 'ATTENDED' || p.status === 'VERIFIED').length;

    return {
      registrationApproval: participants.filter(p => p.status === 'PENDING' || p.status === 'REGISTERED').length,
      participantManagement: participants.filter(p => p.status !== 'REJECTED' && p.status !== 'CANCELLED').length,
      postEventVerification: postEventVerificationCount,
      rejected: participants.filter(p => p.status === 'REJECTED').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Participants ({participants.length})
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {canManageParticipants && (
                <Button variant="outline" size="sm" onClick={exportParticipantsList}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search participants by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter - Removed: Only using Registration Approval and Post-Event Verification tabs */}

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="joinedDate">Joined Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="score">Impact Score</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="verifiedDate">Verified Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pills Navigation - New Structure */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('registration-approval')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
              activeTab === 'registration-approval' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
            }`}
          >
            Registration Approval ({statusCounts.registrationApproval})
          </button>
          {canManageParticipants && (
            <button
              onClick={() => setActiveTab('participant-management')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
                activeTab === 'participant-management' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
              }`}
            >
              Participant Management ({statusCounts.participantManagement})
            </button>
          )}
          <button
            onClick={() => setActiveTab('post-event-verification')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
              activeTab === 'post-event-verification' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
            }`}
          >
            Post-Event Verification ({statusCounts.postEventVerification})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 px-5 py-2.5 ${
              activeTab === 'rejected' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
            }`}
          >
            Rejected ({statusCounts.rejected})
          </button>
        </div>
      </div>

      <div className="space-y-4 mt-6">
          {filteredParticipants.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No participants found</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? `No participants match your search for "${searchTerm}"`
                    : `No ${activeTab === 'all' ? '' : activeTab} participants yet`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredParticipants.map((participant) => (
                <Card key={participant.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Participant Info */}
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage 
                            src={participant.user.image || participant.user.profile?.avatar} 
                            alt={participant.user.name} 
                          />
                          <AvatarFallback>
                            {getInitials(participant.user.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{participant.user.name}</h3>
                            <Badge className={getStatusColor(participant.status)}>
                              {participant.status}
                            </Badge>
                            {participant.user.currentRank && (
                              <Badge variant="outline">
                                {participant.user.currentRank}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{participant.user.email}</span>
                            {participant.user.profile?.organization && (
                              <span>• {participant.user.profile.organization}</span>
                            )}
                            {participant.user.profile?.location && (
                              <span>• {participant.user.profile.location.city}, {participant.user.profile.location.country}</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>Committed: {formatHours(participant.hoursCommitted)}</span>
                            </div>
                            {participant.hoursActual && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span>Actual: {formatHours(participant.hoursActual)}</span>
                              </div>
                            )}
                            <div className="flex items-center">
                              <Award className="w-4 h-4 mr-1" />
                              <span>Score: {participant.user.impaktrScore.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-muted-foreground">
                          <div>Joined {formatTimeAgo(participant.createdAt)}</div>
                          {participant.verifiedAt && (
                            <div>
                              {participant.status === 'ATTENDED' || participant.status === 'VERIFIED' 
                                ? `Attendance marked ${formatTimeAgo(participant.verifiedAt)}`
                                : `Verified ${formatTimeAgo(participant.verifiedAt)}`
                              }
                            </div>
                          )}
                        </div>

                        {canManageParticipants && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(participant.status === 'PENDING' || participant.status === 'REGISTERED') && activeTab === 'registration-approval' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApproveParticipant(participant.id)}
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Approve Registration
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleRejectParticipant(participant.id)}
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Reject Registration
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              
                              {activeTab === 'participant-management' && participant.status !== 'VERIFIED' && (
                                <>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleRemoveParticipant(participant.id)}
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Delete Participant
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              
                              <DropdownMenuItem
                                onClick={() => handleSendMessage(participant.id, 'Hello! Thank you for participating in our event.')}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              
                              {activeTab !== 'participant-management' && participant.status !== 'VERIFIED' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleRemoveParticipant(participant.id)}
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Remove Participant
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    {/* Verification Details */}
                    {participant.verifications.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-medium">Verifications:</span>
                          {participant.verifications.map((verification, index) => (
                            <div key={index} className="flex items-center space-x-1">
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 px-3 py-1.5">
                                {verification.type}
                              </Badge>
                              {verification.rating && (
                                <div className="flex items-center">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="ml-1">{verification.rating}/5</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {participant.notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {participant.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>

      {/* Verification Dialog */}
      <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Participation</DialogTitle>
          </DialogHeader>
          
          {selectedParticipant && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage 
                    src={selectedParticipant.user.image || selectedParticipant.user.profile?.avatar} 
                    alt={selectedParticipant.user.name} 
                  />
                  <AvatarFallback>
                    {getInitials(selectedParticipant.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedParticipant.user.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Committed: {formatHours(selectedParticipant.hoursCommitted)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quality Rating (1-5)</label>
                <Select 
                  value={verificationRating.toString()} 
                  onValueChange={(value) => setVerificationRating(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                    <SelectItem value="4">4 - Good</SelectItem>
                    <SelectItem value="3">3 - Average</SelectItem>
                    <SelectItem value="2">2 - Below Average</SelectItem>
                    <SelectItem value="1">1 - Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about this participant's contribution..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsVerificationDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsVerificationDialogOpen(false);
                    toast.success('Verification saved');
                  }}
                >
                  Save Verification
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}