'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  CheckCircle,
  User,
  Mail,
  Clock,
  Award,
  TrendingUp,
  Loader2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'react-hot-toast';

interface Participation {
  id: string;
  userId: string;
  status: string;
  joinedAt: string;
  verifiedAt?: string;
  hours?: number;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    impactScore: number;
  };
}

interface Event {
  id: string;
  title: string;
  status: string;
  participations: Participation[];
}

export default function EventCompletePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingParticipants, setPendingParticipants] = useState<Participation[]>([]);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [eventImpactScore, setEventImpactScore] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organization/events/${eventId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }

      const data = await response.json();
      setEvent(data.event);

      // Filter pending participants (those who need approval)
      // Only show ATTENDED participants (attended but not yet granted approval)
      // PENDING and CONFIRMED are not yet checked in, so they shouldn't appear here
      // VERIFIED participants have already been granted approval, so they shouldn't appear here
      const pending = data.event.participations.filter((p: Participation) => 
        p.status === 'ATTENDED'
      );
      setPendingParticipants(pending);

      // Check if event is already completed
      if (data.event.status === 'COMPLETED') {
        setIsCompleted(true);
        fetchImpactScore();
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchImpactScore = async () => {
    try {
      const response = await fetch(`/api/organization/events/${eventId}/impact-score`);
      if (response.ok) {
        const data = await response.json();
        setEventImpactScore(data.totalImpactScore);
      }
    } catch (err) {
      console.error('Error fetching impact score:', err);
    }
  };

  const handleGrantApproval = async (participationId: string) => {
    try {
      setApprovingIds(prev => new Set(prev).add(participationId));

      const response = await fetch(
        `/api/organization/events/${eventId}/participants/${participationId}/grant-approval`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to grant approval');
      }

      const result = await response.json();
      toast.success(result.message || 'Approval granted successfully!');

      // Refresh event data
      await fetchEventDetails();

      // Check if all approvals are done and auto-complete if so
      setTimeout(async () => {
        const updatedResponse = await fetch(`/api/organization/events/${eventId}`);
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          const stillPending = updatedData.event.participations.filter((p: Participation) => 
            p.status === 'ATTENDED'
          );
          
          // If no more pending and not already completed, auto-complete
          if (stillPending.length === 0 && updatedData.event.status !== 'COMPLETED') {
            await handleCompleteEvent();
          }
        }
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to grant approval';
      toast.error(errorMessage);
      console.error('Error granting approval:', error);
    } finally {
      setApprovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(participationId);
        return newSet;
      });
    }
  };

  const handleCompleteEvent = async () => {
    try {
      setIsCompleting(true);

      const response = await fetch(`/api/organization/events/${eventId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to complete event';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `${errorMessage}: ${response.statusText || response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Check if still requires approval
      if (data.requiresApproval) {
        toast.error(data.message || 'Please grant approval to all participants first');
        await fetchEventDetails();
        return;
      }

      // Event completed successfully
      setIsCompleted(true);
      toast.success('Event completed successfully!');
      
      // Fetch impact score
      await fetchImpactScore();
      
      // Refresh event data
      await fetchEventDetails();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete event';
      toast.error(errorMessage);
      console.error('Error completing event:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleBatchGrantApproval = async () => {
    const pendingIds = pendingParticipants.map(p => p.id);
    
    for (const participationId of pendingIds) {
      try {
        setApprovingIds(prev => new Set(prev).add(participationId));

        const response = await fetch(
          `/api/organization/events/${eventId}/participants/${participationId}/grant-approval`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to grant approval');
        }

        const result = await response.json();
        
        // Small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error granting approval to ${participationId}:`, error);
        toast.error(`Failed to grant approval to one participant`);
        // Continue with other approvals even if one fails
      } finally {
        setApprovingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(participationId);
          return newSet;
        });
      }
    }

    // Refresh event data after all approvals
    await fetchEventDetails();
    toast.success('All approvals processed!');

    // Check if all approvals are done and auto-complete if so
    setTimeout(async () => {
      const updatedResponse = await fetch(`/api/organization/events/${eventId}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        const stillPending = updatedData.event.participations.filter((p: Participation) => 
          p.status === 'ATTENDED'
        );
        
        // If no more pending and not already completed, auto-complete
        if (stillPending.length === 0 && updatedData.event.status !== 'COMPLETED') {
          await handleCompleteEvent();
        }
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Event
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Event not found'}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Calculate progress based only on participants who have checked in (ATTENDED or VERIFIED)
  const attendedParticipants = event.participations.filter((p: Participation) => 
    p.status === 'ATTENDED' || p.status === 'VERIFIED'
  );
  const verifiedCount = event.participations.filter((p: Participation) => 
    p.status === 'VERIFIED'
  ).length;
  const totalAttended = attendedParticipants.length;
  
  const allApproved = pendingParticipants.length === 0 && totalAttended > 0;
  const progressPercentage = totalAttended > 0
    ? (verifiedCount / totalAttended) * 100
    : 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/organization/events/${eventId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Complete Event: {event.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Grant approval to all participants to complete the event
              </p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Completion Progress</span>
              <Badge variant={allApproved ? "default" : "secondary"}>
                {verifiedCount} / {totalAttended} Approved
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {allApproved 
                ? 'All participants have been approved. You can now complete the event.'
                : `${pendingParticipants.length} participant(s) still need approval.`
              }
            </p>
          </CardContent>
        </Card>

        {/* Event Completed View */}
        {isCompleted && (
          <Card className="mb-8 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="w-6 h-6 mr-2" />
                Event Completed Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventImpactScore !== null && (
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90 mb-1">Total Event Impact Score</p>
                        <p className="text-4xl font-bold">{eventImpactScore.toFixed(1)}</p>
                        <p className="text-sm opacity-75 mt-2">Points generated from this event</p>
                      </div>
                      <TrendingUp className="w-16 h-16 opacity-75" />
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push(`/organization/events/${eventId}`)}
                    className="flex-1"
                  >
                    View Event Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/organization/events')}
                  >
                    Back to Events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Participants List */}
        {!isCompleted && (
          <>
            {pendingParticipants.length > 0 && (
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Pending Approvals ({pendingParticipants.length})
                </h2>
                <Button
                  onClick={handleBatchGrantApproval}
                  disabled={approvingIds.size > 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {approvingIds.size > 0 ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Granting Approvals...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Grant All Approvals
                    </>
                  )}
                </Button>
              </div>
            )}

            {pendingParticipants.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    All Participants Approved
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    All participants have been granted approval. You can now complete the event.
                  </p>
                  <Button
                    onClick={handleCompleteEvent}
                    disabled={isCompleting}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isCompleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Completing Event...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4 mr-2" />
                        Complete Event
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingParticipants.map((participation) => (
                  <Card key={participation.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={participation.user.image} />
                            <AvatarFallback>
                              {participation.user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {participation.user.name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {participation.user.email}
                            </p>
                            {participation.hours && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {participation.hours} hours
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="secondary">
                            {participation.status}
                          </Badge>
                          <Button
                            onClick={() => handleGrantApproval(participation.id)}
                            disabled={approvingIds.has(participation.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {approvingIds.has(participation.id) ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Granting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Grant Approval
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

