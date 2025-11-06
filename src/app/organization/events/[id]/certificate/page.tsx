'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Award,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface Participation {
  id: string;
  userId: string;
  status: string;
  joinedAt: string;
  hours?: number;
  user: {
    id: string;
    name: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    dateOfBirth?: string | null;
    impactScore: number;
  };
}

interface Event {
  id: string;
  title: string;
  participations?: Participation[];
}

export default function CertificateConfigurationPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateName, setCertificateName] = useState('');
  const [certificateDescription, setCertificateDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // This is a template design page, so we don't need sample participant data
  // The certificate preview shows empty placeholders that will be auto-filled
  // when admin grants approval to participants in Post-Event Verification

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user && eventId) {
      fetchEventDetails();
    }
  }, [isLoading, user, eventId, router]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organization/events/${eventId}`);
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.status === 403) {
        router.push('/organization/dashboard');
        return;
      }

      if (response.status === 404) {
        router.push('/organization/events');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }

      const data = await response.json();
      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateConfig = async () => {
    try {
      const response = await fetch(`/api/organization/events/${eventId}/certificate-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.certificateConfig) {
          setCertificateName(data.certificateConfig.certificateName || event?.title || '');
          setCertificateDescription(data.certificateConfig.certificateContent || '');
          return;
        }
      }
      // If no config found, use event title as default
      if (event) {
        setCertificateName(event.title);
      }
    } catch (err) {
      console.error('Error fetching certificate config:', err);
      if (event) {
        setCertificateName(event.title);
      }
    }
  };

  // Update certificate name when event loads
  useEffect(() => {
    if (event) {
      if (!certificateName) {
        setCertificateName(event.title);
      }
      fetchCertificateConfig();
    }
  }, [event]);

  const saveCertificateConfig = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/organization/events/${eventId}/certificate-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateName,
          certificateContent: certificateDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save certificate config' }));
        throw new Error(errorData.error || 'Failed to save certificate config');
      }

      toast.success('Certificate configuration saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save certificate config';
      toast.error(errorMessage);
      console.error('Error saving certificate config:', error);
    } finally {
      setSaving(false);
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


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/organization/events/${eventId}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Certificate Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure the certificate template for <span className="font-semibold">{event.title}</span>
          </p>
        </div>

        {/* Main Content - Left-Right Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Configuration Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Certificate Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Certificate Name */}
                <div className="space-y-2">
                  <Label htmlFor="certificate-name">
                    Certificate Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="certificate-name"
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    placeholder="Enter certificate name"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be displayed as the certificate title
                  </p>
                </div>

                {/* Certificate Description */}
                <div className="space-y-2">
                  <Label htmlFor="certificate-description">
                    Certificate Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="certificate-description"
                    value={certificateDescription}
                    onChange={(e) => setCertificateDescription(e.target.value)}
                    placeholder="Enter certificate description"
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    The description that will appear on the certificate
                  </p>
                </div>

                {/* Save Button */}
                <Button
                  onClick={saveCertificateConfig}
                  disabled={saving || !certificateName.trim() || !certificateDescription.trim()}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <span className="mr-2 inline-flex items-center">
                        <LoadingSpinner size="sm" />
                      </span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Certificate Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Preview how the certificate template will look. Fields will be auto-filled when you grant approval to participants.
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-8 shadow-lg">
                  {/* Certificate Header */}
                  <div className="border-b-2 border-gray-800 dark:border-gray-200 pb-4 mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {certificateName || 'Certificate Name'}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Certificate of Achievement
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="w-20 h-20 border-2 border-gray-800 dark:border-gray-200 rounded-full flex items-center justify-center">
                          <Award className="w-10 h-10 text-gray-800 dark:text-gray-200" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Body - IELTS Style with Placeholders */}
                  <div className="space-y-4">
                    {/* Description */}
                    {certificateDescription ? (
                      <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {certificateDescription}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <p className="text-gray-400 dark:text-gray-500 italic">
                          Certificate description will appear here...
                        </p>
                      </div>
                    )}

                    {/* Information Grid with Placeholders */}
                    <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-300 dark:border-gray-600 py-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          First Name
                        </p>
                        <p className="text-base font-semibold text-gray-400 dark:text-gray-500 italic">
                          [First Name]
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Last Name
                        </p>
                        <p className="text-base font-semibold text-gray-400 dark:text-gray-500 italic">
                          [Last Name]
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Issued by
                        </p>
                        <p className="text-base font-semibold text-gray-400 dark:text-gray-500 italic">
                          [Organization Name]
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Hours
                        </p>
                        <p className="text-base font-semibold text-gray-400 dark:text-gray-500 italic">
                          [Hours]
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Impact Score
                        </p>
                        <p className="text-base font-semibold text-gray-400 dark:text-gray-500 italic">
                          [Impact Score]
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Join Date
                        </p>
                        <p className="text-base font-semibold text-gray-400 dark:text-gray-500 italic">
                          [Join Date]
                        </p>
                      </div>
                    </div>

                    {/* Issued Date */}
                    <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Issued Date
                        </p>
                        <p className="text-base font-semibold text-gray-400 dark:text-gray-500 italic">
                          [Issued Date]
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      This is a verified certificate issued by Impaktr Platform
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

