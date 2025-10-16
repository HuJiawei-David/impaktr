// home/ubuntu/impaktrweb/src/components/certificates/CertificatePreview.tsx

'use client';

import React, { useState, useRef } from 'react';
import { 
  Download, 
  Share2, 
  Eye, 
  EyeOff,
  Linkedin,
  Twitter,
  Facebook,
  Copy,
  Award,
  Calendar,
  MapPin,
  Clock,
  Users,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { formatDate, getSDGColor, getSDGName } from '@/lib/utils';

interface CertificateData {
  id: string;
  type: 'participation' | 'badge' | 'rank' | 'milestone';
  title: string;
  description: string;
  recipientName: string;
  recipientEmail: string;
  issueDate: string;
  certificateUrl?: string;
  shareUrl?: string;
  linkedInShared: boolean;
  
  // Event-specific data
  eventTitle?: string;
  eventDate?: string;
  hoursContributed?: number;
  organizer?: string;
  sdgTags?: number[];
  verificationMethod?: string;
  
  // Badge-specific data
  badgeName?: string;
  sdgNumber?: number;
  tier?: string;
  earnedDate?: string;
  
  // Rank-specific data
  rankTitle?: string;
  impaktrScore?: number;
  
  // Achievement-specific data
  achievementName?: string;
  achievementDescription?: string;
  achievementData?: any;
}

interface CertificatePreviewProps {
  certificate: CertificateData;
  showActions?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CertificatePreview({ 
  certificate, 
  showActions = true, 
  size = 'md' 
}: CertificatePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (certificate.certificateUrl) {
      // Download existing PDF
      const link = document.createElement('a');
      link.href = certificate.certificateUrl;
      link.download = `${certificate.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate new certificate
      setIsDownloading(true);
      try {
        const response = await fetch('/api/certificates/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            certificateId: certificate.id,
            type: certificate.type
          })
        });

        if (response.ok) {
          const data = await response.json();
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = `${certificate.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Certificate downloaded successfully!');
        } else {
          throw new Error('Failed to generate certificate');
        }
      } catch (error) {
        toast.error('Failed to download certificate');
        console.error('Download error:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleShare = async (platform?: string) => {
    const shareData = {
      title: certificate.title,
      text: `I just earned: ${certificate.title}`,
      url: certificate.shareUrl || window.location.href,
    };

    if (platform) {
      const encodedUrl = encodeURIComponent(shareData.url);
      const encodedText = encodeURIComponent(shareData.text);
      
      const shareUrls = {
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      };

      if (shareUrls[platform as keyof typeof shareUrls]) {
        window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
      }
    } else if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareData.url);
      toast.success('Link copied to clipboard!');
    }
  };

  const getCertificateIcon = () => {
    switch (certificate.type) {
      case 'participation': return <Calendar className="w-6 h-6" />;
      case 'badge': return <Award className="w-6 h-6" />;
      case 'rank': return <CheckCircle className="w-6 h-6" />;
      case 'milestone': return <Award className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  const getCertificateColor = () => {
    switch (certificate.type) {
      case 'participation': return 'from-blue-500 to-blue-600';
      case 'badge': return certificate.sdgNumber ? `from-[${getSDGColor(certificate.sdgNumber)}] to-[${getSDGColor(certificate.sdgNumber)}dd]` : 'from-green-500 to-green-600';
      case 'rank': return 'from-purple-500 to-purple-600';
      case 'milestone': return 'from-orange-500 to-orange-600';
      default: return 'from-primary-500 to-primary-600';
    }
  };

  const sizeClasses = {
    sm: 'w-64 h-40',
    md: 'w-80 h-52', 
    lg: 'w-96 h-64'
  };

  const CertificateContent = ({ isPreview = false }) => (
    <div 
      ref={certificateRef}
      className={`
        relative border-2 border-dashed border-gray-300 bg-white text-gray-900 overflow-hidden
        ${isPreview ? 'w-full aspect-[4/3]' : sizeClasses[size]}
      `}
      style={{
        backgroundImage: `
          linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
          linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
      }}
    >
      {/* Header with gradient */}
      <div className={`h-20 bg-gradient-to-r ${getCertificateColor()} flex items-center justify-center relative`}>
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)'
          }} />
        </div>
        <div className="flex items-center space-x-3 text-white z-10">
          {getCertificateIcon()}
          <div className="text-center">
            <div className="font-bold text-lg">Impaktr</div>
            <div className="text-xs opacity-90">Certificate of {certificate.type.charAt(0).toUpperCase() + certificate.type.slice(1)}</div>
          </div>
        </div>
      </div>

      {/* Certificate Body */}
      <div className="p-4 space-y-3">
        {/* Certificate Title */}
        <div className="text-center">
          <h3 className={`font-bold ${isPreview ? 'text-lg' : 'text-sm'} text-gray-800 line-clamp-2`}>
            {certificate.title}
          </h3>
        </div>

        {/* Recipient */}
        <div className="text-center border-b border-gray-200 pb-2">
          <div className={`text-xs text-gray-600 ${isPreview ? 'mb-1' : ''}`}>Awarded to</div>
          <div className={`font-semibold ${isPreview ? 'text-base' : 'text-sm'} text-gray-800`}>
            {certificate.recipientName}
          </div>
        </div>

        {/* Certificate Details */}
        <div className="space-y-2 text-xs">
          {/* Event Details */}
          {certificate.type === 'participation' && (
            <>
              {certificate.eventTitle && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-600 truncate">{certificate.eventTitle}</span>
                </div>
              )}
              {certificate.hoursContributed && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-600">{certificate.hoursContributed} hours contributed</span>
                </div>
              )}
              {certificate.organizer && (
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-600 truncate">by {certificate.organizer}</span>
                </div>
              )}
            </>
          )}

          {/* Badge Details */}
          {certificate.type === 'badge' && certificate.sdgNumber && (
            <div className="flex items-center justify-center space-x-2">
              <Badge 
                variant="sdg" 
                sdgNumber={certificate.sdgNumber}
                className="text-xs"
              >
                SDG {certificate.sdgNumber}
              </Badge>
              {certificate.tier && (
                <Badge variant="secondary" className="text-xs">
                  {certificate.tier}
                </Badge>
              )}
            </div>
          )}

          {/* Rank Details */}
          {certificate.type === 'rank' && (
            <div className="text-center">
              <div className="font-semibold text-gray-700">{certificate.rankTitle}</div>
              {certificate.impaktrScore && (
                <div className="text-gray-600">Score: {certificate.impaktrScore}</div>
              )}
            </div>
          )}

          {/* SDG Tags */}
          {certificate.sdgTags && certificate.sdgTags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {certificate.sdgTags.slice(0, 3).map((sdgNumber) => (
                <Badge key={sdgNumber} variant="sdg" sdgNumber={sdgNumber} className="text-2xs">
                  {sdgNumber}
                </Badge>
              ))}
              {certificate.sdgTags.length > 3 && (
                <Badge variant="secondary" className="text-2xs">
                  +{certificate.sdgTags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Issue Date */}
        <div className="text-center pt-2 border-t border-gray-200">
          <div className="text-2xs text-gray-500">
            Issued on {formatDate(certificate.issueDate)}
          </div>
        </div>

        {/* Verification Note */}
        <div className="text-center">
          <div className="text-2xs text-gray-400 flex items-center justify-center space-x-1">
            <CheckCircle className="w-2 h-2" />
            <span>Verified by Impaktr</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-gray-300"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-gray-300"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-gray-300"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-gray-300"></div>
    </div>
  );

  return (
    <div className="relative group">
      <CertificateContent />
      
      {/* Action Buttons Overlay */}
      {showActions && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            {/* Preview Button */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="shadow-lg">
                  <Eye className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>{certificate.title}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center p-6">
                  <CertificateContent isPreview />
                </div>
                <div className="flex justify-center space-x-4 pb-4">
                  <Button 
                    onClick={handleDownload} 
                    disabled={isDownloading}
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleShare('linkedin')}
                    >
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleShare('twitter')}
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleShare()}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Download Button */}
            <Button 
              size="sm" 
              onClick={handleDownload} 
              disabled={isDownloading}
              className="shadow-lg"
            >
              <Download className="w-4 h-4" />
            </Button>

            {/* Share Button */}
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => handleShare()}
              className="shadow-lg"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Certificate Type Badge */}
      <div className="absolute -top-2 -right-2 z-10">
        <Badge variant="secondary" className="text-xs shadow-sm">
          {certificate.type.charAt(0).toUpperCase() + certificate.type.slice(1)}
        </Badge>
      </div>

      {/* LinkedIn Shared Indicator */}
      {certificate.linkedInShared && (
        <div className="absolute -top-2 -left-2 z-10">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs shadow-sm">
            <Linkedin className="w-3 h-3 mr-1" />
            Shared
          </Badge>
        </div>
      )}
    </div>
  );
}