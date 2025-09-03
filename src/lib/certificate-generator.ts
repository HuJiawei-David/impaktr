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

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
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
        
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 40px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #1a202c;
        }
        
        .certificate {
          background: white;
          border-radius: 20px;
          padding: 60px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
          max-width: 1000px;
          margin: 0 auto;
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
          margin-bottom: 50px;
        }
        
        .logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
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
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .certificate-title {
          font-size: 18px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 30px;
        }
        
        .main-content {
          text-align: center;
          margin: 60px 0;
        }
        
        .recipient-section {
          margin-bottom: 40px;
        }
        
        .recipient-name {
          font-size: 48px;
          font-weight: 700;
          color: #1a202c;
          margin: 20px 0;
          border-bottom: 3px solid ${primaryColor};
          display: inline-block;
          padding-bottom: 10px;
        }
        
        .achievement-text {
          font-size: 24px;
          color: #4a5568;
          line-height: 1.6;
          margin: 30px 0;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 30px;
          margin: 50px 0;
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
          gap: 10px;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        
        .sdg-badge {
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        
        .footer {
          margin-top: 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          border-top: 2px solid #e2e8f0;
          padding-top: 30px;
        }
        
        .signature-section {
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #1a202c;
          margin: 30px auto 10px;
          width: 200px;
        }
        
        .signature-title {
          font-size: 14px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .verification-info {
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          padding: 20px;
          margin: 30px 0;
        }
        
        .verification-title {
          color: #0ea5e9;
          font-weight: 600;
          margin-bottom: 10px;
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
              <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">
                Certificate ID: ${generateCertificateId()}
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
          
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: #1a202c;
          }
          
          .certificate {
            background: white;
            border-radius: 20px;
            padding: 60px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            position: relative;
            overflow: hidden;
            max-width: 1000px;
            margin: 0 auto;
          }
          
          .header {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            margin-bottom: 40px;
          }
          
          .org-logo {
            width: 80px;
            height: 80px;
            background: #f1f5f9;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
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
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 40px;
          }
          
          .recipient-name {
            font-size: 42px;
            font-weight: 700;
            color: #1a202c;
            margin: 30px 0;
            border-bottom: 3px solid #0ea5e9;
            display: inline-block;
            padding-bottom: 10px;
          }
          
          .achievement-text {
            font-size: 20px;
            color: #4a5568;
            line-height: 1.8;
            margin: 40px 0;
          }
          
          .stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 30px;
            margin: 50px 0;
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
              <div style="margin: 40px 0;">
                <div style="font-size: 16px; color: #64748b; margin-bottom: 15px;">
                  Contributing to UN Sustainable Development Goals:
                </div>
                <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                  ${organizationData.sdgTags.map(sdg => `
                    <div style="padding: 8px 16px; border-radius: 20px; background: ${getSDGColor(sdg)}; color: white; font-weight: 600; font-size: 14px;">
                      SDG ${sdg}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div style="margin: 50px 0; padding: 30px; background: #f0f9ff; border-radius: 12px; border: 2px solid #0ea5e9;">
              <div style="color: #0ea5e9; font-weight: 600; margin-bottom: 10px;">
                Verified Impact Recognition
              </div>
              <div style="color: #475569; font-size: 14px;">
                This certificate is issued by ${organizationData.organizationName} in partnership with Impaktr,
                the global platform for verified social impact measurement. All impact hours have been
                verified through ${organizationData.verificationMethod} and contribute to the recipient's
                official Impaktr Score™.
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 60px; border-top: 2px solid #e2e8f0; padding-top: 40px;">
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
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

 