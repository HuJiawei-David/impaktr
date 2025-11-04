'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Award,
  Download,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

export default function ParticipantCertificatePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  const params = useParams();
  const participationId = params.participationId as string;

  const [participation, setParticipation] = useState<any | null>(null);
  const [certificate, setCertificate] = useState<any | null>(null);
  const [certificateConfig, setCertificateConfig] = useState<{ certificateName: string; certificateContent: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user && participationId) {
      fetchParticipationData();
    }
  }, [isLoading, user, participationId, router]);

  const fetchParticipationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch participation data
      const response = await fetch(`/api/profile/participations/${participationId}`);
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch participation data');
      }

      const data = await response.json();
      const participationData = data.participation;
      
      if (!participationData) {
        throw new Error('Participation not found');
      }

      setParticipation(participationData);

      // Check if certificate exists (from admin grant approval)
      if (participationData.certificate) {
        const cert = participationData.certificate;
        const event = participationData.event;
        const userData = participationData.user;
        
        // Parse metadata from certificate
        const metadata = cert.metadata as any || {};
        
        // Prepare certificate data for CertificatePreview component
        const certificateData = {
          id: cert.id,
          type: 'participation' as const,
          title: cert.title || event?.title || 'Certificate',
          description: cert.description || '',
          recipientName: userData?.name || userData?.email || '',
          recipientEmail: userData?.email || '',
          issueDate: cert.issuedAt ? new Date(cert.issuedAt).toISOString() : new Date().toISOString(),
          certificateUrl: cert.certificateUrl || undefined,
          shareUrl: cert.shareUrl || undefined,
          linkedInShared: false,
          eventTitle: metadata.eventTitle || event?.title,
          eventDate: metadata.eventDate || event?.startDate,
          hoursContributed: metadata.hours || participationData.hoursVerified || participationData.hours || 0,
          organizer: metadata.organizationName || event?.organization?.name,
          sdgTags: event?.sdg ? (typeof event.sdg === 'string' ? JSON.parse(event.sdg) : Array.isArray(event.sdg) ? event.sdg : [event.sdg]) : undefined,
        };
        
        setCertificate(certificateData);
      } else {
        // No certificate yet, fetch config for preview
        await fetchCertificateConfig(participationData.event?.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching participation data:', err);
      toast.error('Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateConfig = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/certificate-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.certificateConfig) {
          setCertificateConfig({
            certificateName: data.certificateConfig.certificateName || '',
            certificateContent: data.certificateConfig.certificateContent || ''
          });
        } else {
          // Use event title as default
          setCertificateConfig({
            certificateName: participation?.event?.title || '',
            certificateContent: ''
          });
        }
      } else {
        // If API fails, use event title as default
        setCertificateConfig({
          certificateName: participation?.event?.title || '',
          certificateContent: ''
        });
      }
    } catch (error) {
      console.error('Error fetching certificate config:', error);
      // Use event title as default
      setCertificateConfig({
        certificateName: participation?.event?.title || '',
        certificateContent: ''
      });
    }
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

  // Helper function to get first name from participation
  const getParticipantFirstName = (participation: any): string => {
    if (participation?.user?.firstName) {
      return participation.user.firstName;
    }
    if (participation?.user?.name) {
      const parts = participation.user.name.trim().split(/\s+/);
      if (parts.length > 1) {
        return parts.slice(0, -1).join(' ') || '-';
      }
      return parts[0] || '-';
    }
    return '-';
  };

  // Helper function to get last name from participation
  const getParticipantLastName = (participation: any): string => {
    if (participation?.user?.lastName) {
      return participation.user.lastName;
    }
    if (participation?.user?.name) {
      const parts = participation.user.name.trim().split(/\s+/);
      if (parts.length > 1) {
        return parts[parts.length - 1] || '-';
      }
    }
    return '-';
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !participation) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.push('/profile?tab=certificates')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </div>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Award className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                {error || 'Certificate not found'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {error || 'The certificate you are looking for does not exist or you do not have permission to view it.'}
              </p>
              <Button onClick={() => router.push('/profile?tab=certificates')}>
                Back to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push('/profile?tab=certificates')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </div>

        {/* Certificate Preview - Same layout as admin certificate preview */}
        <Card>
          <CardHeader>
            <CardTitle>Certificate Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              {certificate 
                ? 'Your certificate is ready. You can download or share it.'
                : 'Preview of your certificate. It will be generated when admin grants approval.'}
            </p>
          </CardHeader>
          <CardContent>
            {(certificate || certificateConfig) ? (
              // Show certificate preview using same layout as admin (with participant data)
              <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-8 shadow-lg">
                {/* Certificate Header */}
                <div className="border-b-2 border-gray-800 dark:border-gray-200 pb-4 mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {certificate?.title || certificateConfig?.certificateName || participation.event?.title || 'Certificate Name'}
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

                {/* Certificate Body - IELTS Style with Participant Data */}
                <div className="space-y-4">
                  {/* Description */}
                  {(certificate?.description || certificateConfig?.certificateContent) ? (
                    <div className="mb-6">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {certificate?.description || certificateConfig?.certificateContent}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        This certificate is awarded to recognize your participation and contribution to this event.
                      </p>
                    </div>
                  )}

                  {/* Information Grid with Participant Data */}
                  <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-300 dark:border-gray-600 py-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        First Name
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {getParticipantFirstName(participation)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Last Name
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {getParticipantLastName(participation)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Age
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {calculateAge(participation?.user?.dateOfBirth) || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Hours
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {participation.hoursVerified || participation.hoursCommitted || participation.hours || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Impact Score
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {participation?.user?.impactScore?.toFixed(0) || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Join Date
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {participation.joinedAt ? new Date(participation.joinedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'N/A'}
                      </p>
                    </div>
                    {certificate?.id && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Certificate ID
                        </p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white font-mono">
                          {certificate.id}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Issued Date */}
                  <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Issued Date
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {certificate?.issueDate 
                        ? new Date(certificate.issueDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    This is a verified certificate issued by Impaktr Platform
                  </p>
                </div>

                {/* Action Buttons */}
                {(certificate || certificateConfig) && (
                  <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600 flex justify-center space-x-4">
                    <Button
                      onClick={async () => {
                        if (certificate?.certificateUrl) {
                          // Download existing PDF
                          const link = document.createElement('a');
                          link.href = certificate.certificateUrl;
                          link.download = `${(certificate.title || participation?.event?.title || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success('Certificate downloaded!');
                        } else if (participation?.id) {
                          // Generate and download PDF
                          setIsDownloading(true);
                          try {
                            const response = await fetch('/api/certificates/generate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                type: 'participation',
                                participationId: participation.id
                              })
                            });

                            if (response.ok) {
                              const data = await response.json();
                              const downloadUrl = data.downloadUrl;
                              
                              if (downloadUrl) {
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = `${(participation?.event?.title || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast.success('Certificate downloaded successfully!');
                                
                                // Refresh certificate data if it was created
                                if (data.certificate) {
                                  await fetchParticipationData();
                                }
                              } else {
                                throw new Error('No download URL received');
                              }
                            } else {
                              const errorData = await response.json().catch(() => ({ error: 'Failed to generate certificate' }));
                              throw new Error(errorData.error || 'Failed to generate certificate');
                            }
                          } catch (error) {
                            console.error('Download error:', error);
                            toast.error(error instanceof Error ? error.message : 'Failed to download certificate');
                          } finally {
                            setIsDownloading(false);
                          }
                        }
                      }}
                      disabled={isDownloading || !participation?.id}
                      className="flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
                    </Button>
                    {certificate && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const shareUrl = certificate.shareUrl || window.location.href;
                          navigator.clipboard.writeText(shareUrl);
                          toast.success('Certificate link copied to clipboard!');
                        }}
                        className="flex items-center space-x-2"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <LoadingSpinner size="md" />
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading certificate preview...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

