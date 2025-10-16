'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Building2, 
  Mail, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  message?: string;
  expiresAt: string;
  isExpired: boolean;
  organization: {
    id: string;
    name: string;
    type: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitationDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/organization/accept-invite?token=${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invitation details');
      }

      const data = await response.json();
      setInvitation(data.invitation);
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to load invitation');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setIsLoading(false);
      return;
    }

    fetchInvitationDetails();
  }, [token, fetchInvitationDetails]);

  const handleAcceptInvitation = async () => {
    if (!session?.user || !token) {
      router.push(`/signup?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    setIsAccepting(true);

    try {
      const response = await fetch('/api/organization/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      toast.success(data.message || 'Successfully joined organization!');
      
      // Redirect to organization dashboard
      router.push('/organization');

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectInvitation = async () => {
    // TODO: Implement rejection functionality
    toast.error('Rejection functionality not implemented yet');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'This invitation link is invalid or has expired.'}
            </p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpiredOrInvalid = invitation.isExpired || invitation.status !== 'PENDING';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Organization Invitation</h1>
            <p className="text-muted-foreground">
              You&apos;ve been invited to join an organization on Impaktr
            </p>
          </div>

          {/* Invitation Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Invitation Details</span>
                <Badge variant={
                  invitation.status === 'PENDING' && !invitation.isExpired ? 'default' :
                  invitation.status === 'ACCEPTED' ? 'success' :
                  'destructive'
                }>
                  {invitation.isExpired ? 'Expired' : invitation.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Organization Info */}
              <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
                <Building2 className="w-8 h-8 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{invitation.organization.name}</h3>
                  <p className="text-muted-foreground capitalize">{invitation.organization.type.toLowerCase()}</p>
                </div>
              </div>

              {/* Invitation Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Invited Email</div>
                    <div className="text-sm text-muted-foreground">{invitation.email}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Role</div>
                    <div className="text-sm text-muted-foreground capitalize">{invitation.role}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Invited By</div>
                    <div className="text-sm text-muted-foreground">{invitation.invitedBy.name}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Expires</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Message */}
              {invitation.message && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded">
                  <h4 className="font-medium mb-2">Personal Message</h4>
                  <p className="text-sm italic">&quot;{invitation.message}&quot;</p>
                </div>
              )}

              {/* Status Alerts */}
              {isExpiredOrInvalid && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {invitation.isExpired 
                      ? 'This invitation has expired. Please contact the organization for a new invitation.'
                      : `This invitation has already been ${invitation.status.toLowerCase()}.`
                    }
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Mismatch Warning */}
              {session?.user?.email && session.user.email !== invitation.email && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This invitation was sent to {invitation.email}, but you&apos;re signed in as {session.user.email}. 
                    Please sign in with the correct email address to accept this invitation.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {!session?.user ? (
                  <Link href={`/signup?callbackUrl=${encodeURIComponent(window.location.href)}`} className="flex-1">
                    <Button className="w-full" size="lg">
                      Sign Up to Accept Invitation
                    </Button>
                  </Link>
                ) : session.user.email !== invitation.email ? (
                  <Link href={`/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`} className="flex-1">
                    <Button className="w-full" size="lg">
                      Sign In with Correct Email
                    </Button>
                  </Link>
                ) : !isExpiredOrInvalid ? (
                  <>
                    <Button 
                      onClick={handleAcceptInvitation} 
                      disabled={isAccepting}
                      className="flex-1"
                      size="lg"
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Invitation
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleRejectInvitation}
                      variant="outline"
                      disabled={isAccepting}
                      size="lg"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </>
                ) : (
                  <div className="flex-1 text-center">
                    <p className="text-muted-foreground">This invitation is no longer valid.</p>
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                <p>
                  Questions about this invitation? Contact{' '}
                  <a href={`mailto:${invitation.invitedBy.email}`} className="text-primary hover:underline">
                    {invitation.invitedBy.name}
                  </a>{' '}
                  or the Impaktr support team.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <Link href="/">
              <Button variant="ghost">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
