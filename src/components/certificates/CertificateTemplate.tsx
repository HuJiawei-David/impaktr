// home/ubuntu/impaktrweb/src/components/certificates/CertificateTemplate.tsx

'use client';

import React from 'react';
import { Award, CheckCircle, Globe, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, getSDGColor, getSDGName } from '@/lib/utils';

export interface CertificateData {
  recipientName: string;
  recipientEmail: string;
  type: 'Event Participation' | 'SDG Badge Achievement' | 'Rank Achievement' | 'Milestone Achievement';
  issueDate: Date;
  
  // Event-specific data
  eventTitle?: string;
  eventDate?: string;
  hoursContributed?: number;
  organizer?: string;
  organizationLogo?: string;
  
  // Badge-specific data
  badgeName?: string;
  sdgNumber?: number;
  tier?: string;
  earnedDate?: Date;
  
  // Rank-specific data
  rankTitle?: string;
  impaktrScore?: number;
  
  // Achievement-specific data
  achievementName?: string;
  achievementDescription?: string;
  achievementData?: any;
  
  // General data
  sdgTags?: number[];
  verificationMethod?: string;
  certificateId?: string;
  qrCodeUrl?: string;
}

interface CertificateTemplateProps {
  data: CertificateData;
  template?: 'modern' | 'classic' | 'minimal';
  showWatermark?: boolean;
  forPrint?: boolean;
}

export function CertificateTemplate({ 
  data, 
  template = 'modern', 
  showWatermark = true,
  forPrint = false 
}: CertificateTemplateProps) {
  
  const getCertificateTitle = () => {
    switch (data.type) {
      case 'Event Participation':
        return 'Certificate of Participation';
      case 'SDG Badge Achievement':
        return 'SDG Achievement Certificate';
      case 'Rank Achievement':
        return 'Rank Achievement Certificate';
      case 'Milestone Achievement':
        return 'Milestone Achievement Certificate';
      default:
        return 'Certificate of Achievement';
    }
  };

  const getCertificateDescription = () => {
    switch (data.type) {
      case 'Event Participation':
        return `This is to certify that ${data.recipientName} has successfully participated in "${data.eventTitle}" and contributed ${data.hoursContributed} verified hours to this impactful initiative.`;
      
      case 'SDG Badge Achievement':
        return `This is to certify that ${data.recipientName} has successfully earned the ${data.badgeName} badge, demonstrating significant contributions to ${data.sdgNumber ? getSDGName(data.sdgNumber) : 'sustainable development'}.`;
      
      case 'Rank Achievement':
        return `This is to certify that ${data.recipientName} has achieved the rank of ${data.rankTitle} with an Impaktr Score™ of ${data.impaktrScore}, recognizing their outstanding commitment to social impact.`;
      
      case 'Milestone Achievement':
        return `This is to certify that ${data.recipientName} has achieved the milestone "${data.achievementName}", demonstrating exceptional dedication to creating positive social impact.`;
      
      default:
        return `This is to certify that ${data.recipientName} has made significant contributions to social impact initiatives.`;
    }
  };

  const renderModernTemplate = () => (
    <div className={`relative bg-white ${forPrint ? 'w-[297mm] h-[210mm]' : 'w-full aspect-[4/3] max-w-4xl mx-auto'} overflow-hidden shadow-2xl`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-transparent to-secondary-100" />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-8 border-b-2 border-primary/20">
        {/* Impaktr Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg brand-gradient flex items-center justify-center">
            <span className="text-white font-bold text-xl">I</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold brand-gradient-text">Impaktr</h1>
            <p className="text-sm text-muted-foreground">Global Impact Standard</p>
          </div>
        </div>

        {/* Organization Logo */}
        {data.organizationLogo && (
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
            <img 
              src={data.organizationLogo} 
              alt="Organization" 
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        )}

        {/* Certificate ID */}
        {data.certificateId && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Certificate ID</p>
            <p className="text-sm font-mono">{data.certificateId}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-8 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Certificate Title */}
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">
              {getCertificateTitle()}
            </h2>
            
            {/* SDG Badge or Achievement Icon */}
            <div className="flex justify-center mb-6">
              {data.type === 'SDG Badge Achievement' && data.sdgNumber ? (
                <div 
                  className="w-20 h-20 rounded-full flex flex-col items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: getSDGColor(data.sdgNumber) }}
                >
                  <div className="text-xs font-bold">SDG</div>
                  <div className="text-2xl font-bold">{data.sdgNumber}</div>
                </div>
              ) : data.type === 'Rank Achievement' ? (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                  <Award className="w-10 h-10 text-white" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Recipient Name */}
          <div className="py-4 border-y border-primary/20">
            <p className="text-lg text-muted-foreground mb-2">This is awarded to</p>
            <h3 className="text-5xl font-bold brand-gradient-text mb-2">
              {data.recipientName}
            </h3>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            {getCertificateDescription()}
          </p>

          {/* Event/Achievement Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
            {data.eventDate && (
              <div className="text-center">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Event Date</p>
                <p className="font-semibold">{formatDate(data.eventDate)}</p>
              </div>
            )}
            
            {data.hoursContributed && (
              <div className="text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">Hours Contributed</p>
                <p className="font-semibold">{data.hoursContributed} hours</p>
              </div>
            )}
            
            {data.verificationMethod && (
              <div className="text-center">
                <Award className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Verified By</p>
                <p className="font-semibold capitalize">{data.verificationMethod}</p>
              </div>
            )}
          </div>

          {/* SDG Tags */}
          {data.sdgTags && data.sdgTags.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Contributing to SDGs:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {data.sdgTags.map((sdgNumber) => (
                  <Badge
                    key={sdgNumber}
                    variant="sdg"
                    sdgNumber={sdgNumber}
                    className="text-white font-medium"
                  >
                    SDG {sdgNumber}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-t border-primary/20">
        <div className="flex items-center justify-between">
          {/* Issue Date */}
          <div>
            <p className="text-sm text-muted-foreground">Issued on</p>
            <p className="font-semibold">{formatDate(data.issueDate)}</p>
          </div>

          {/* Verification */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Blockchain Verified</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Verify at impaktr.com/verify
            </p>
          </div>

          {/* QR Code Placeholder */}
          {data.qrCodeUrl && (
            <div className="w-16 h-16 bg-muted rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">QR</span>
            </div>
          )}

          {/* Organizer Signature */}
          {data.organizer && (
            <div className="text-right">
              <div className="w-32 h-12 border-b border-muted-foreground/30 mb-2"></div>
              <p className="text-sm font-medium">{data.organizer}</p>
              <p className="text-xs text-muted-foreground">Event Organizer</p>
            </div>
          )}
        </div>
      </div>

      {/* Watermark */}
      {showWatermark && !forPrint && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-8xl font-bold text-primary/5 rotate-45 select-none">
            PREVIEW
          </div>
        </div>
      )}
    </div>
  );

  const renderClassicTemplate = () => (
    <div className={`relative bg-white ${forPrint ? 'w-[297mm] h-[210mm]' : 'w-full aspect-[4/3] max-w-4xl mx-auto'} overflow-hidden shadow-2xl border-8 border-double border-primary/30`}>
      {/* Ornamental Border */}
      <div className="absolute inset-4 border-2 border-primary/20 rounded-lg">
        <div className="absolute inset-2 border border-primary/10 rounded-lg"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-12 text-center h-full flex flex-col justify-between">
        {/* Header */}
        <div>
          <h1 className="text-6xl font-serif font-bold text-primary mb-2">
            Certificate
          </h1>
          <h2 className="text-2xl font-serif text-muted-foreground mb-8">
            of {data.type.replace('Achievement', 'Achievement')}
          </h2>
        </div>

        {/* Main Content */}
        <div className="space-y-8 flex-1 flex flex-col justify-center">
          <div className="space-y-4">
            <p className="text-xl font-serif">This is to certify that</p>
            <h3 className="text-5xl font-serif font-bold text-primary border-b-2 border-primary/20 pb-2 inline-block">
              {data.recipientName}
            </h3>
          </div>

          <p className="text-lg font-serif leading-relaxed max-w-2xl mx-auto text-gray-700">
            {getCertificateDescription()}
          </p>

          {/* Achievement Details */}
          {(data.eventTitle || data.badgeName || data.rankTitle) && (
            <div className="py-6">
              <div className="inline-block bg-primary/10 px-8 py-4 rounded-lg border border-primary/20">
                {data.eventTitle && (
                  <h4 className="text-2xl font-serif font-semibold text-primary">
                    {data.eventTitle}
                  </h4>
                )}
                {data.badgeName && (
                  <h4 className="text-2xl font-serif font-semibold text-primary">
                    {data.badgeName}
                  </h4>
                )}
                {data.rankTitle && (
                  <h4 className="text-2xl font-serif font-semibold text-primary">
                    {data.rankTitle} Rank
                  </h4>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end">
          <div className="text-left">
            <div className="w-40 h-16 border-b-2 border-primary/30 mb-2"></div>
            <p className="text-sm font-serif">Impaktr Platform</p>
            <p className="text-xs text-muted-foreground">Digital Signature</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-4 border-primary/20">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Official Seal</p>
          </div>

          <div className="text-right">
            <p className="text-sm font-serif mb-1">
              {formatDate(data.issueDate)}
            </p>
            <p className="text-xs text-muted-foreground">Date of Issue</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMinimalTemplate = () => (
    <div className={`relative bg-white ${forPrint ? 'w-[297mm] h-[210mm]' : 'w-full aspect-[4/3] max-w-4xl mx-auto'} overflow-hidden shadow-xl`}>
      {/* Simple Border */}
      <div className="absolute inset-8 border-l-4 border-primary"></div>

      {/* Content */}
      <div className="relative z-10 p-12 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-primary"></div>
            <span className="text-2xl font-bold">Impaktr</span>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Certificate #{data.certificateId?.slice(-8) || '00000000'}</p>
            <p>{formatDate(data.issueDate)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div>
            <h1 className="text-5xl font-light text-gray-800 mb-4">
              {getCertificateTitle()}
            </h1>
            <div className="w-24 h-1 bg-primary mb-8"></div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-primary">
              {data.recipientName}
            </h2>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
              {getCertificateDescription()}
            </p>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-3 gap-8 py-8 border-t border-b border-gray-200">
            {data.eventTitle && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Event</p>
                <p className="text-lg font-semibold">{data.eventTitle}</p>
              </div>
            )}
            
            {data.hoursContributed && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Hours</p>
                <p className="text-lg font-semibold">{data.hoursContributed}</p>
              </div>
            )}

            {data.impaktrScore && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Score</p>
                <p className="text-lg font-semibold">{data.impaktrScore}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-8">
          <p className="text-sm text-muted-foreground">
            Verified on the Impaktr platform
          </p>
          
          {data.organizer && (
            <div className="text-right">
              <p className="font-semibold">{data.organizer}</p>
              <p className="text-sm text-muted-foreground">Issuing Organization</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render based on template type
  switch (template) {
    case 'classic':
      return renderClassicTemplate();
    case 'minimal':
      return renderMinimalTemplate();
    default:
      return renderModernTemplate();
  }
}