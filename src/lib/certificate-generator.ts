// home/ubuntu/impaktrweb/src/lib/certificate-generator.ts

import puppeteer from 'puppeteer';
import { getSDGName, getSDGColor, formatDate } from './utils';

export interface CertificateData {
  recipientName: string;
  recipientEmail: string;
  issueDate: Date;
  type: string;
  eventTitle?: string;
  eventDate?: Date;
  hoursContributed?: number;
  organizer?: string;
  sdgTags?: number[];
  verificationMethod?: string;
  badgeName?: string;
  sdgNumber?: number;
  tier?: string;
  earnedDate?: Date;
  rankTitle?: string;
  impaktrScore?: number;
  achievementDate?: Date;
  achievementName?: string;
  achievementDescription?: string;
  achievementData?: any;
  certificateId?: string; // Unique certificate ID
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set page size to A4
    await page.setViewport({ width: 1200, height: 1600 });

    const html = generateCertificateHTML(data);
    
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF - ensure single page
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
      pageRanges: '1',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function generateCertificateHTML(data: CertificateData): string {
  const primaryColor = data.sdgNumber ? getSDGColor(data.sdgNumber) : '#0ea5e9';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Impaktr Certificate</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        @page {
          size: A4 landscape;
          margin: 0;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          page-break-inside: avoid;
          page-break-after: avoid;
          page-break-before: avoid;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 15px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #1a202c;
          height: 100vh;
          overflow: hidden;
          max-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .certificate {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
          max-width: 1000px;
          margin: 0 auto;
          page-break-inside: avoid;
          page-break-after: avoid;
          page-break-before: avoid;
          height: fit-content;
          max-height: calc(100vh - 30px);
          display: flex;
          flex-direction: column;
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, ${primaryColor} 0%, #3b82f6 50%, #6366f1 100%);
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }
        
        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 20px;
        }
        
        .brand-name {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .certificate-title {
          font-size: 16px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 20px;
        }
        
        .main-content {
          text-align: center;
          margin: 25px 0;
          page-break-inside: avoid;
        }
        
        .recipient-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .recipient-name {
          font-size: 42px;
          font-weight: 700;
          color: #1a202c;
          margin: 15px 0;
          border-bottom: 3px solid ${primaryColor};
          display: inline-block;
          padding-bottom: 8px;
        }
        
        .achievement-text {
          font-size: 20px;
          color: #4a5568;
          line-height: 1.5;
          margin: 20px 0;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
          page-break-inside: avoid;
        }
        
        .detail-item {
          text-align: center;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
        }
        
        .detail-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        
        .detail-value {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }
        
        .sdg-badges {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        
        .sdg-badge {
          padding: 6px 12px;
          border-radius: 20px;
          color: white;
          font-weight: 600;
          font-size: 12px;
        }
        
        .footer {
          margin-top: 25px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          border-top: 2px solid #e2e8f0;
          padding-top: 15px;
          page-break-inside: avoid;
        }
        
        .signature-section {
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #1a202c;
          margin: 20px auto 8px;
          width: 200px;
        }
        
        .signature-title {
          font-size: 13px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .verification-info {
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          padding: 15px;
          margin: 20px 0;
        }
        
        .verification-title {
          color: #0ea5e9;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .qr-placeholder {
          width: 80px;
          height: 80px;
          background: #e2e8f0;
          border-radius: 8px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">I</div>
            <div class="brand-name">Impaktr</div>
          </div>
          <div class="certificate-title">Certificate of ${data.type}</div>
        </div>

        <div class="main-content">
          <div class="recipient-section">
            <div style="font-size: 20px; color: #64748b; margin-bottom: 10px;">
              This certificate is proudly presented to
            </div>
            <div class="recipient-name">${data.recipientName}</div>
          </div>

          <div class="achievement-text">
            ${getCertificateText(data)}
          </div>

          ${data.sdgTags && data.sdgTags.length > 0 ? `
            <div class="sdg-badges">
              ${data.sdgTags.map(sdg => `
                <div class="sdg-badge" style="background-color: ${getSDGColor(sdg)}">
                  SDG ${sdg}: ${getSDGName(sdg)}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="details-grid">
            ${generateDetailsGrid(data)}
          </div>

          <div class="verification-info">
            <div class="verification-title">Verified Impact Recognition</div>
            <div style="font-size: 14px; color: #475569;">
              This certificate represents verified social impact contributions and is part of the global Impaktr Score™ system.
              ${data.verificationMethod ? `Verified via ${data.verificationMethod}.` : ''}
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="signature-section">
            <div class="signature-line"></div>
            <div class="signature-title">Impaktr Platform</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
              Global Standard for Social Impact
            </div>
          </div>
          
          <div class="signature-section">
            <div style="text-align: center;">
              <div class="qr-placeholder">QR Code</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
                Verify at impaktr.com/verify
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 5px; font-family: monospace;">
                Certificate ID: ${data.certificateId ? formatCertificateId(data.certificateId) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #94a3b8;">
          Generated on ${formatDate(data.issueDate)} • Powered by Impaktr.com
        </div>
      </div>
    </body>
    </html>
  `;
}

function getCertificateText(data: CertificateData): string {
  switch (data.type) {
    case 'Event Participation':
      return `
        for outstanding participation in <strong>${data.eventTitle}</strong>
        ${data.hoursContributed ? `, contributing <strong>${data.hoursContributed} verified hours</strong>` : ''}
        of volunteer service and making a positive impact in the community.
      `;
    
    case 'SDG Badge Achievement':
      return `
        for exceptional commitment to <strong>${getSDGName(data.sdgNumber!)}</strong>
        and earning the <strong>${data.badgeName}</strong> badge, demonstrating 
        sustained dedication to creating positive social impact.
      `;
    
    case 'Rank Achievement':
      return `
        for achieving the prestigious rank of <strong>${data.rankTitle}</strong>
        with an Impaktr Score™ of <strong>${data.impaktrScore}</strong>, 
        demonstrating exceptional commitment to social impact and community service.
      `;
    
    case 'Milestone Achievement':
      return `
        for achieving the <strong>${data.achievementName}</strong> milestone.
        ${data.achievementDescription}
      `;
    
    default:
      return 'for outstanding contributions to social impact and community service.';
  }
}

function generateDetailsGrid(data: CertificateData): string {
  const details = [];

  if (data.eventDate) {
    details.push(`
      <div class="detail-item">
        <div class="detail-label">Event Date</div>
        <div class="detail-value">${formatDate(data.eventDate)}</div>
      </div>
    `);
  }

  if (data.hoursContributed) {
    details.push(`
      <div class="detail-item">
        <div class="detail-label">Hours Contributed</div>
        <div class="detail-value">${data.hoursContributed} hours</div>
      </div>
    `);
  }

  if (data.organizer) {
    details.push(`
      <div class="detail-item">
        <div class="detail-label">Organized By</div>
        <div class="detail-value">${data.organizer}</div>
      </div>
    `);
  }

  if (data.earnedDate || data.achievementDate) {
    details.push(`
      <div class="detail-item">
        <div class="detail-label">Achievement Date</div>
        <div class="detail-value">${formatDate(data.earnedDate || data.achievementDate!)}</div>
      </div>
    `);
  }

  details.push(`
    <div class="detail-item">
      <div class="detail-label">Certificate Issued</div>
      <div class="detail-value">${formatDate(data.issueDate)}</div>
    </div>
  `);

  return details.join('');
}

function generateCertificateId(): string {
  return `IMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

// Format certificate ID for better readability
function formatCertificateId(certificateId: string): string {
  // If it's a cuid (starts with 'c'), format it nicely
  if (certificateId.startsWith('c') && certificateId.length > 12) {
    // Format as: C-XXXX-XXXX-XXXX (first 12 chars)
    const parts = [
      certificateId.substring(0, 1).toUpperCase(),
      certificateId.substring(1, 5).toUpperCase(),
      certificateId.substring(5, 9).toUpperCase(),
      certificateId.substring(9, 13).toUpperCase()
    ];
    return parts.join('-');
  }
  // For other formats, return as-is but ensure uppercase
  return certificateId.toUpperCase();
}

// Participant Certificate PDF Generator - matches preview exactly
export interface ParticipantCertificateData {
  certificateTitle: string;
  certificateContent?: string;
  firstName: string;
  lastName: string;
  issuedBy: string;
  hours: number;
  impactScore: number;
  joinDate: Date | string;
  issuedDate: Date | string;
  certificateId?: string; // Unique certificate ID
}

export async function generateParticipantCertificatePDF(data: ParticipantCertificateData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // A4 landscape: 297mm x 210mm (approximately 1123px x 794px at 96 DPI)
    await page.setViewport({ width: 1123, height: 794 });

    const html = generateParticipantCertificateHTML(data);
    
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF in landscape A4 format - ensure single page with no pagination
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true, // Use CSS page size settings
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      // Remove pageRanges to allow all content, but use CSS to prevent pagination
      displayHeaderFooter: false
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function generateParticipantCertificateHTML(data: ParticipantCertificateData): string {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const description = data.certificateContent || 'This certificate is awarded to recognize your participation and contribution to this event.';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificate</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          break-inside: avoid !important;
          break-after: avoid !important;
          break-before: avoid !important;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          background: #f9fafb;
          color: #111827;
          padding: 0;
          width: 100%;
          height: 100%;
          min-height: 100%;
          max-height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .certificate-container {
          background: white;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 100%;
          margin: 0;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          break-inside: avoid !important;
          break-after: avoid !important;
          break-before: avoid !important;
          height: 100%;
          max-height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .certificate-header {
          border-bottom: 2px solid #111827;
          padding-bottom: 12px;
          margin-bottom: 16px;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          flex-shrink: 0;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .title-section h2 {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
          line-height: 1.2;
        }
        
        .title-section p {
          font-size: 13px;
          color: #4b5563;
          line-height: 1.3;
        }
        
        .award-icon {
          width: 70px;
          height: 70px;
          border: 2px solid #111827;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .award-icon svg {
          width: 35px;
          height: 35px;
          stroke: #111827;
          fill: none;
        }
        
        .certificate-body {
          margin: 16px 0;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        
        .description {
          margin-bottom: 16px;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          flex-shrink: 0;
        }
        
        .description p {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          margin: 0;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          border-top: 1px solid #d1d5db;
          border-bottom: 1px solid #d1d5db;
          padding: 12px 0;
          margin: 16px 0;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          flex-shrink: 0;
        }
        
        .info-item {
          margin-bottom: 6px;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .info-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          word-break: break-word;
        }
        
        .issued-date {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #d1d5db;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          flex-shrink: 0;
        }
        
        .issued-date .info-label {
          margin-bottom: 3px;
        }
        
        .certificate-footer {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #d1d5db;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          flex-shrink: 0;
        }
        
        .footer-text {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <!-- Certificate Header - matches preview exactly -->
        <div class="certificate-header">
          <div class="header-content">
            <div class="title-section">
              <h2>${data.certificateTitle}</h2>
              <p>Certificate of Achievement</p>
            </div>
            <div class="award-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11L2 9l7-1-2-7 2 7 7 1-4.523 3.89z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Certificate Body - matches preview exactly -->
        <div class="certificate-body">
          <!-- Description -->
          <div class="description">
            <p>${description}</p>
          </div>

          <!-- Information Grid - 2 columns matching preview layout exactly -->
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">First Name</div>
              <div class="info-value">${data.firstName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Last Name</div>
              <div class="info-value">${data.lastName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Issued by</div>
              <div class="info-value">${data.issuedBy || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Hours</div>
              <div class="info-value">${data.hours || 0}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Impact Score</div>
              <div class="info-value">${typeof data.impactScore === 'number' ? data.impactScore.toFixed(0) : (data.impactScore || '0')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Join Date</div>
              <div class="info-value">${data.joinDate ? formatDate(data.joinDate) : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Certificate ID</div>
              <div class="info-value" style="font-family: monospace; font-weight: 600; color: #0ea5e9;">${data.certificateId ? formatCertificateId(data.certificateId) : 'N/A'}</div>
            </div>
          </div>

          <!-- Issued Date - matches preview exactly -->
          <div class="issued-date">
            <div class="info-label">Issued Date</div>
            <div class="info-value">${formatDate(data.issuedDate)}</div>
          </div>
        </div>

        <!-- Footer - matches preview exactly -->
        <div class="certificate-footer">
          <p class="footer-text">This is a verified certificate issued by Impaktr Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Organization Certificate Templates
export async function generateOrganizationCertificate(organizationData: {
  organizationName: string;
  recipientName: string;
  eventTitle: string;
  hoursContributed: number;
  eventDate: Date;
  organizationLogo?: string;
  sdgTags: number[];
  verificationMethod: string;
  certificateId?: string; // Unique certificate ID
}): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Organization Certificate</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          @page {
            size: A4 landscape;
            margin: 0;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            page-break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 15px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: #1a202c;
            height: 100vh;
            overflow: hidden;
            max-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .certificate {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            position: relative;
            overflow: hidden;
            max-width: 1000px;
            margin: 0 auto;
            page-break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
            height: fit-content;
            max-height: calc(100vh - 30px);
            display: flex;
            flex-direction: column;
          }
          
          .header {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            margin-bottom: 25px;
          }
          
          .org-logo {
            width: 70px;
            height: 70px;
            background: #f1f5f9;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: 700;
            color: #64748b;
          }
          
          .center-content {
            text-align: center;
          }
          
          .impaktr-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: flex-end;
          }
          
          .branded-certificate {
            background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 25px;
          }
          
          .recipient-name {
            font-size: 38px;
            font-weight: 700;
            color: #1a202c;
            margin: 20px 0;
            border-bottom: 3px solid #0ea5e9;
            display: inline-block;
            padding-bottom: 8px;
          }
          
          .achievement-text {
            font-size: 18px;
            color: #4a5568;
            line-height: 1.6;
            margin: 25px 0;
          }
          
          .stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          
          .stat-box {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
          }
          
          .stat-number {
            font-size: 28px;
            font-weight: 700;
            color: #0ea5e9;
            margin-bottom: 5px;
          }
          
          .stat-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="org-logo">
              ${organizationData.organizationName.charAt(0)}
            </div>
            
            <div class="center-content">
              <div class="branded-certificate">Certificate of Appreciation</div>
              <div style="color: #64748b; font-size: 16px;">
                In Partnership with Impaktr Global Impact Platform
              </div>
            </div>
            
            <div class="impaktr-logo">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0ea5e9, #3b82f6); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">I</div>
              <div style="font-weight: 700; color: #0ea5e9;">Impaktr</div>
            </div>
          </div>

          <div style="text-align: center;">
            <div style="font-size: 18px; color: #64748b; margin-bottom: 15px;">
              This certificate is proudly presented to
            </div>
            <div class="recipient-name">${organizationData.recipientName}</div>
            
            <div class="achievement-text">
              for exceptional volunteer service in <strong>${organizationData.eventTitle}</strong>,
              contributing <strong>${organizationData.hoursContributed} verified hours</strong>
              and demonstrating outstanding commitment to positive social impact.
            </div>

            <div class="stats-row">
              <div class="stat-box">
                <div class="stat-number">${organizationData.hoursContributed}</div>
                <div class="stat-label">Verified Hours</div>
              </div>
              
              <div class="stat-box">
                <div class="stat-number">${formatDate(organizationData.eventDate)}</div>
                <div class="stat-label">Event Date</div>
              </div>
              
              <div class="stat-box">
                <div class="stat-number">${organizationData.sdgTags.length}</div>
                <div class="stat-label">SDGs Supported</div>
              </div>
              
              <div class="stat-box">
                <div class="stat-number">Verified</div>
                <div class="stat-label">${organizationData.verificationMethod}</div>
              </div>
            </div>

            ${organizationData.sdgTags.length > 0 ? `
              <div style="margin: 25px 0;">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 12px;">
                  Contributing to UN Sustainable Development Goals:
                </div>
                <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                  ${organizationData.sdgTags.map(sdg => `
                    <div style="padding: 6px 12px; border-radius: 20px; background: ${getSDGColor(sdg)}; color: white; font-weight: 600; font-size: 12px;">
                      SDG ${sdg}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div style="margin: 25px 0; padding: 20px; background: #f0f9ff; border-radius: 12px; border: 2px solid #0ea5e9;">
              <div style="color: #0ea5e9; font-weight: 600; margin-bottom: 8px; font-size: 14px;">
                Verified Impact Recognition
              </div>
              <div style="color: #475569; font-size: 13px; line-height: 1.5;">
                This certificate is issued by ${organizationData.organizationName} in partnership with Impaktr,
                the global platform for verified social impact measurement. All impact hours have been
                verified through ${organizationData.verificationMethod} and contribute to the recipient's
                official Impaktr Score™.
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 30px;">
              <div style="text-align: center;">
                <div style="border-top: 2px solid #1a202c; margin: 20px auto 10px; width: 200px;"></div>
                <div style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                  ${organizationData.organizationName}
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">
                  Authorized Issuer
                </div>
              </div>
              
              <div style="text-align: center;">
                <div style="border-top: 2px solid #1a202c; margin: 20px auto 10px; width: 200px;"></div>
                <div style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                  Impaktr Platform
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">
                  Impact Verification Authority
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #94a3b8; font-family: monospace; font-weight: 600;">
                Certificate ID: ${organizationData.certificateId ? formatCertificateId(organizationData.certificateId) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
      pageRanges: '1',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

 