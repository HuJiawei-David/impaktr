// home/ubuntu/impaktrweb/src/components/profile/CertificatesGrid.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  ExternalLink, 
  Award, 
  Calendar, 
  Trophy,
  Users,
  FileText,
  Eye,
  Linkedin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { formatDate, formatTimeAgo, getSDGColor } from '@/lib/utils';

interface Certificate {
  id: string;
  type: 'badge' | 'achievement' | 'event' | 'rank';
  title: string;
  description: string;
  certificateUrl: string;
  shareUrl: string;
  issuedAt: string;
  expiresAt?: string;
  linkedInShared: boolean;
  badgeId?: string;
  achievementId?: string;
  eventId?: string;
  participationId?: string;
  metadata?: {
    sdgNumber?: number;
    tier?: string;
    eventTitle?: string;
    hoursContributed?: number;
    organizer?: string;
    rankTitle?: string;
    impaktrScore?: number;
  };
}

interface CertificatesGridProps {
  userId: string;
}

export function CertificatesGrid({ userId }: CertificatesGridProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, [userId]);

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/certificates`);
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (certificate: Certificate) => {
    try {
      const response = await fetch(certificate.certificateUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certificate.title.replace(/\s+/g, '_')}_Certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  const handleShare = async (certificate: Certificate) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: certificate.title,
          text: `Check out my ${certificate.title} from Impaktr!`,
          url: certificate.shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(certificate.shareUrl);
      // Show success toast
    }
  };

  const handleLinkedInShare = async (certificate: Certificate) => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificate.shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    
    // Mark as shared on LinkedIn
    try {
      await fetch(`/api/certificates/${certificate.id}/linkedin-shared`, {
        method: 'POST'
      });
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === certificate.id 
            ? { ...cert, linkedInShared: true }
            : cert
        )
      );
    } catch (error) {
      console.error('Error updating LinkedIn share status:', error);
    }
  };

  const getCertificateIcon = (type: string) => {
    switch (type) {
      case 'badge': return <Award className="w-5 h-5" />;
      case 'achievement': return <Trophy className="w-5 h-5" />;
      case 'event': return <Calendar className="w-5 h-5" />;
      case 'rank': return <Users className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const filterCertificates = (certificates: Certificate[], tab: string) => {
    switch (tab) {
      case 'badges':
        return certificates.filter(cert => cert.type === 'badge');
      case 'events':
        return certificates.filter(cert => cert.type === 'event');
      case 'achievements':
        return certificates.filter(cert => cert.type === 'achievement');
      case 'ranks':
        return certificates.filter(cert => cert.type === 'rank');
      default:
        return certificates;
    }
  };

  const filteredCertificates = filterCertificates(certificates, activeTab);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-20 bg-muted rounded"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-muted rounded w-20"></div>
                    <div className="h-8 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Certificates & Achievements</h2>
          <p className="text-muted-foreground">
            Your verified impact certificates ready to share
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {certificates.length} Total
        </Badge>
      </div>

      {/* Certificate Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({certificates.length})
          </TabsTrigger>
          <TabsTrigger value="badges">
            Badges ({certificates.filter(c => c.type === 'badge').length})
          </TabsTrigger>
          <TabsTrigger value="events">
            Events ({certificates.filter(c => c.type === 'event').length})
          </TabsTrigger>
          <TabsTrigger value="achievements">
            Milestones ({certificates.filter(c => c.type === 'achievement').length})
          </TabsTrigger>
          <TabsTrigger value="ranks">
            Ranks ({certificates.filter(c => c.type === 'rank').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {filteredCertificates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all' 
                    ? 'Complete verified activities to earn your first certificates'
                    : `No ${activeTab} certificates earned yet`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertificates.map((certificate) => (
                <Card key={certificate.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${
                          certificate.type === 'badge' ? 'bg-green-100 text-green-600' :
                          certificate.type === 'event' ? 'bg-blue-100 text-blue-600' :
                          certificate.type === 'achievement' ? 'bg-purple-100 text-purple-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {getCertificateIcon(certificate.type)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-sm line-clamp-2">
                            {certificate.title}
                          </CardTitle>
                        </div>
                      </div>
                      
                      {certificate.linkedInShared && (
                        <Badge variant="outline" className="text-xs">
                          <Linkedin className="w-3 h-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Certificate Preview */}
                    <div className="relative mb-4 p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg border-2 border-dashed border-primary-200">
                      <div className="text-center space-y-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          Certificate of {certificate.type}
                        </div>
                        
                        {certificate.metadata?.sdgNumber && (
                          <div 
                            className="inline-flex items-center px-2 py-1 rounded text-white text-xs font-bold"
                            style={{ backgroundColor: getSDGColor(certificate.metadata.sdgNumber) }}
                          >
                            SDG {certificate.metadata.sdgNumber}
                          </div>
                        )}

                        <div className="text-sm font-semibold line-clamp-2">
                          {certificate.metadata?.eventTitle || 
                           certificate.metadata?.rankTitle || 
                           certificate.title}
                        </div>

                        {certificate.metadata?.hoursContributed && (
                          <div className="text-xs text-muted-foreground">
                            {certificate.metadata.hoursContributed} hours contributed
                          </div>
                        )}

                        {certificate.metadata?.organizer && (
                          <div className="text-xs text-muted-foreground">
                            by {certificate.metadata.organizer}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Issued {formatDate(certificate.issuedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Certificate Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {certificate.description}
                    </p>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{certificate.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                              <iframe
                                src={certificate.certificateUrl}
                                className="w-full h-full rounded-lg"
                                title={certificate.title}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-muted-foreground">
                                Issued on {formatDate(certificate.issuedAt)}
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShare(certificate)}
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleDownload(certificate)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkedInShare(certificate)}
                      >
                        <Linkedin className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleDownload(certificate)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Certificate Metadata */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Issued {formatTimeAgo(certificate.issuedAt)}</span>
                        {certificate.expiresAt && (
                          <span>Expires {formatDate(certificate.expiresAt)}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate New Certificate */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Generate New Certificate</h3>
              <p className="text-sm text-muted-foreground">
                Create certificates for your recent achievements and activities
              </p>
            </div>
            <Button onClick={() => window.location.href = '/certificates/generate'}>
              <Award className="w-4 h-4 mr-2" />
              Generate Certificate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}