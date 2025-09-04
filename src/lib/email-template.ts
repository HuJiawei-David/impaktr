// home/ubuntu/impaktrweb/src/lib/email-templates.ts

import { getSDGName, getSDGColor, formatDate } from './utils';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailTemplateData {
  recipientName: string;
  recipientEmail: string;
  [key: string]: any;
}

// Base email wrapper template
const getBaseTemplate = (content: string, title: string = 'Impaktr Notification') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9, #3b82f6, #6366f1);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .tagline {
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #374151;
    }
    .main-content {
      color: #4b5563;
      margin-bottom: 30px;
    }
    .highlight-box {
      background: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 20px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #0ea5e9, #3b82f6);
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #0ea5e9;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }
    .sdg-badge {
      display: inline-block;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin: 2px;
    }
    .footer {
      background: #f8fafc;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-link {
      display: inline-block;
      margin: 0 10px;
      color: #6b7280;
      text-decoration: none;
    }
    .unsubscribe {
      margin-top: 20px;
      font-size: 12px;
    }
    .unsubscribe a {
      color: #6b7280;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 10px;
      }
      .content {
        padding: 20px;
      }
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">🌍 Impaktr</div>
      <div class="tagline">Global Standard for Verified Social Impact</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>
        <strong>Impaktr</strong><br>
        Making social good measurable, verifiable, and professionally valuable.
      </p>
      
      <div class="social-links">
        <a href="https://impaktr.com" class="social-link">Website</a>
        <a href="https://twitter.com/impaktrcom" class="social-link">Twitter</a>
        <a href="https://linkedin.com/company/impaktr" class="social-link">LinkedIn</a>
      </div>
      
      <div class="unsubscribe">
        <p>
          You're receiving this email because you have an account with Impaktr.<br>
          <a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="https://impaktr.com/privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Welcome Email Template
export const getWelcomeEmailTemplate = (data: EmailTemplateData & {
  profileType: string;
  onboardingUrl: string;
}): EmailTemplate => {
  const content = `
    <div class="greeting">Welcome to Impaktr, ${data.recipientName}! 🎉</div>
    
    <div class="main-content">
      <p>We're thrilled to have you join our global community of impact makers! As a <strong>${data.profileType}</strong>, you're now part of a movement that's making social good measurable and verifiable.</p>
      
      <div class="highlight-box">
        <h3>🚀 What's Next?</h3>
        <p>Complete your profile setup to start your verified impact journey and unlock all platform features.</p>
        <a href="${data.onboardingUrl}" class="button">Complete Your Profile</a>
      </div>
      
      <h3>Here's what you can do with Impaktr:</h3>
      <ul>
        <li>📊 <strong>Track Your Impact Score™</strong> - Get verified scores for your social contributions</li>
        <li>🏆 <strong>Earn SDG Badges</strong> - Collect achievements across all 17 UN Sustainable Development Goals</li>
        <li>📜 <strong>Get Certificates</strong> - Share verified credentials on LinkedIn and your resume</li>
        <li>🌍 <strong>Global Leaderboards</strong> - See how your impact compares worldwide</li>
        <li>🤝 <strong>Connect & Collaborate</strong> - Find like-minded impact makers in your area</li>
      </ul>
      
      <p>Questions? Reply to this email or visit our <a href="https://help.impaktr.com">Help Center</a>.</p>
      
      <p>Welcome aboard!<br>
      <strong>The Impaktr Team</strong></p>
    </div>
  `;

  return {
    subject: `Welcome to Impaktr, ${data.recipientName}! 🌍`,
    html: getBaseTemplate(content, 'Welcome to Impaktr'),
    text: `Welcome to Impaktr, ${data.recipientName}!\n\nWe're thrilled to have you join our global community of impact makers! Complete your profile setup at: ${data.onboardingUrl}\n\nBest regards,\nThe Impaktr Team`
  };
};

// Badge Earned Email Template
export const getBadgeEarnedEmailTemplate = (data: EmailTemplateData & {
  badgeName: string;
  sdgNumber: number;
  tier: string;
  certificateUrl: string;
  profileUrl: string;
}): EmailTemplate => {
  const sdgColor = getSDGColor(data.sdgNumber);
  
  const content = `
    <div class="greeting">Congratulations, ${data.recipientName}! 🏆</div>
    
    <div class="main-content">
      <div class="highlight-box">
        <h2>🎉 You've earned a new badge!</h2>
        <div style="text-align: center; margin: 20px 0;">
          <div class="sdg-badge" style="background-color: ${sdgColor}; font-size: 16px; padding: 12px 20px;">
            ${data.badgeName}
          </div>
        </div>
        <p style="text-align: center; font-size: 18px; margin: 20px 0;">
          <strong>${getSDGName(data.sdgNumber)} - ${data.tier}</strong>
        </p>
      </div>
      
      <p>Your dedication to <strong>${getSDGName(data.sdgNumber)}</strong> has been recognized! This badge reflects your verified contributions and commitment to making a positive impact.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.certificateUrl}" class="button">📜 Download Certificate</a>
        <a href="${data.profileUrl}" class="button" style="margin-left: 10px;">👀 View Profile</a>
      </div>
      
      <div class="highlight-box">
        <h3>💡 Share Your Achievement</h3>
        <p>Add this verified credential to your LinkedIn profile and resume to showcase your social impact contributions to employers and partners.</p>
      </div>
      
      <p>Keep up the amazing work! Your next badge milestone is just around the corner.</p>
      
      <p>Celebrating your impact,<br>
      <strong>The Impaktr Team</strong></p>
    </div>
  `;

  return {
    subject: `🏆 Badge Earned: ${data.badgeName}!`,
    html: getBaseTemplate(content, 'New Badge Earned'),
    text: `Congratulations ${data.recipientName}! You've earned the ${data.badgeName} badge for ${getSDGName(data.sdgNumber)}. Download your certificate: ${data.certificateUrl}`
  };
};

// Event Reminder Email Template
export const getEventReminderEmailTemplate = (data: EmailTemplateData & {
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventUrl: string;
  organizerName: string;
  isVirtual: boolean;
}): EmailTemplate => {
  const content = `
    <div class="greeting">Hi ${data.recipientName},</div>
    
    <div class="main-content">
      <div class="highlight-box">
        <h2>📅 Event Reminder</h2>
        <h3 style="margin: 10px 0; color: #0ea5e9;">${data.eventTitle}</h3>
        <p><strong>📅 Date:</strong> ${formatDate(data.eventDate)}</p>
        <p><strong>📍 Location:</strong> ${data.isVirtual ? '💻 Virtual Event' : data.eventLocation}</p>
        <p><strong>👤 Organizer:</strong> ${data.organizerName}</p>
      </div>
      
      <p>This is a friendly reminder about your upcoming volunteering event. We're excited to see you make an impact!</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.eventUrl}" class="button">View Event Details</a>
      </div>
      
      <div class="highlight-box">
        <h3>📋 What to Bring:</h3>
        <ul>
          <li>✅ Your enthusiasm and positive attitude</li>
          <li>✅ Comfortable clothing appropriate for the activity</li>
          <li>✅ Water bottle and snacks if needed</li>
          ${data.isVirtual ? '<li>✅ Stable internet connection and camera</li>' : '<li>✅ Any specific items mentioned in the event details</li>'}
        </ul>
      </div>
      
      <p>Remember to check in when you arrive to ensure your participation is tracked for your Impaktr Score™!</p>
      
      <p>See you there!<br>
      <strong>The Impaktr Team</strong></p>
    </div>
  `;

  return {
    subject: `⏰ Reminder: ${data.eventTitle} - Tomorrow`,
    html: getBaseTemplate(content, 'Event Reminder'),
    text: `Hi ${data.recipientName}, this is a reminder about ${data.eventTitle} on ${formatDate(data.eventDate)} at ${data.eventLocation}. View details: ${data.eventUrl}`
  };
};

// Verification Request Email Template
export const getVerificationRequestEmailTemplate = (data: EmailTemplateData & {
  requesterName: string;
  eventTitle: string;
  eventDate: string;
  hoursToVerify: number;
  verificationUrl: string;
}): EmailTemplate => {
  const content = `
    <div class="greeting">Hi ${data.recipientName},</div>
    
    <div class="main-content">
      <p><strong>${data.requesterName}</strong> has requested that you verify their participation in a volunteer event.</p>
      
      <div class="highlight-box">
        <h3>📋 Verification Details</h3>
        <p><strong>Event:</strong> ${data.eventTitle}</p>
        <p><strong>Date:</strong> ${formatDate(data.eventDate)}</p>
        <p><strong>Hours to Verify:</strong> ${data.hoursToVerify} hours</p>
        <p><strong>Participant:</strong> ${data.requesterName}</p>
      </div>
      
      <p>Peer verification helps maintain the integrity of the Impaktr platform and ensures that impact hours are accurate and trustworthy.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.verificationUrl}" class="button">✅ Verify Participation</a>
      </div>
      
      <p><strong>Please only verify if you can confirm that ${data.requesterName} actively participated in this event for the stated duration.</strong></p>
      
      <p>Thank you for helping maintain our community's trust and integrity!</p>
      
      <p>Best regards,<br>
      <strong>The Impaktr Team</strong></p>
    </div>
  `;

  return {
    subject: `🔍 Verification Request from ${data.requesterName}`,
    html: getBaseTemplate(content, 'Verification Request'),
    text: `Hi ${data.recipientName}, ${data.requesterName} has requested verification for ${data.eventTitle} (${data.hoursToVerify} hours). Verify at: ${data.verificationUrl}`
  };
};

// Monthly Impact Report Email Template
export const getMonthlyReportEmailTemplate = (data: EmailTemplateData & {
  month: string;
  year: number;
  totalHours: number;
  eventsJoined: number;
  badgesEarned: number;
  currentScore: number;
  currentRank: string;
  topSDG: { number: number; hours: number };
  globalRanking: number;
  countryRanking: number;
  reportUrl: string;
}): EmailTemplate => {
  const content = `
    <div class="greeting">Hi ${data.recipientName},</div>
    
    <div class="main-content">
      <p>Here's your impact summary for <strong>${data.month} ${data.year}</strong>! 📊</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${data.totalHours}</div>
          <div class="stat-label">Hours This Month</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.eventsJoined}</div>
          <div class="stat-label">Events Joined</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.badgesEarned}</div>
          <div class="stat-label">New Badges</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.currentScore}</div>
          <div class="stat-label">Impaktr Score™</div>
        </div>
      </div>
      
      <div class="highlight-box">
        <h3>🏆 Your Current Status</h3>
        <p><strong>Rank:</strong> ${data.currentRank}</p>
        <p><strong>Global Ranking:</strong> #${data.globalRanking.toLocaleString()}</p>
        <p><strong>Country Ranking:</strong> #${data.countryRanking.toLocaleString()}</p>
        <p><strong>Top SDG Focus:</strong> ${getSDGName(data.topSDG.number)} (${data.topSDG.hours} hours)</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.reportUrl}" class="button">📈 View Full Report</a>
      </div>
      
      <div class="highlight-box">
        <h3>💡 Keep Building Impact</h3>
        <p>You're making a real difference! Consider sharing your achievements on LinkedIn to inspire others and showcase your commitment to social impact.</p>
      </div>
      
      <p>Thank you for being an amazing member of the Impaktr community!</p>
      
      <p>Keep making an impact,<br>
      <strong>The Impaktr Team</strong></p>
    </div>
  `;

  return {
    subject: `📊 Your ${data.month} Impact Report - ${data.totalHours} Hours of Impact!`,
    html: getBaseTemplate(content, 'Monthly Impact Report'),
    text: `Hi ${data.recipientName}, your ${data.month} impact report is ready! Total hours: ${data.totalHours}, Events: ${data.eventsJoined}, New badges: ${data.badgesEarned}. View full report: ${data.reportUrl}`
  };
};

// Organization Certificate Issued Email Template
export const getCertificateIssuedEmailTemplate = (data: EmailTemplateData & {
  eventTitle: string;
  organizationName: string;
  organizationLogo?: string;
  hoursContributed: number;
  certificateUrl: string;
  linkedInShareUrl: string;
}): EmailTemplate => {
  const content = `
    <div class="greeting">Congratulations, ${data.recipientName}! 🎉</div>
    
    <div class="main-content">
      <div class="highlight-box">
        <div style="text-align: center;">
          ${data.organizationLogo ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="height: 60px; margin-bottom: 15px;">` : ''}
          <h2>📜 Certificate of Participation</h2>
          <h3 style="color: #0ea5e9; margin: 10px 0;">${data.eventTitle}</h3>
          <p><strong>Hours Contributed:</strong> ${data.hoursContributed}</p>
          <p><strong>Issued by:</strong> ${data.organizationName}</p>
        </div>
      </div>
      
      <p>We're pleased to issue your verified certificate of participation! This digital certificate serves as proof of your valuable contribution and can be shared on professional networks.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.certificateUrl}" class="button">📥 Download Certificate</a>
        <a href="${data.linkedInShareUrl}" class="button" style="margin-left: 10px;">📢 Share on LinkedIn</a>
      </div>
      
      <div class="highlight-box">
        <h3>🌟 Make It Count</h3>
        <ul>
          <li>Add this certificate to your LinkedIn profile</li>
          <li>Include it in your resume or CV</li>
          <li>Share it with potential employers</li>
          <li>Use it for university applications</li>
        </ul>
      </div>
      
      <p>Your verified contribution has been added to your Impaktr Score™ and will help you climb the global impact leaderboards!</p>
      
      <p>Thank you for making a difference!</p>
      
      <p>With appreciation,<br>
      <strong>${data.organizationName}</strong><br>
      <em>via Impaktr</em></p>
    </div>
  `;

  return {
    subject: `📜 Your ${data.eventTitle} Certificate is Ready!`,
    html: getBaseTemplate(content, 'Certificate Issued'),
    text: `Congratulations ${data.recipientName}! Your certificate for ${data.eventTitle} (${data.hoursContributed} hours) has been issued by ${data.organizationName}. Download it here: ${data.certificateUrl}`
  };
};

// Password Reset Email Template (for NextAuth)
export const getPasswordResetEmailTemplate = (data: EmailTemplateData & {
  resetUrl: string;
  expiresIn: string;
}): EmailTemplate => {
  const content = `
    <div class="greeting">Hi ${data.recipientName},</div>
    
    <div class="main-content">
      <p>We received a request to reset your Impaktr account password.</p>
      
      <div class="highlight-box">
        <h3>🔒 Reset Your Password</h3>
        <p>Click the button below to create a new password. This link will expire in ${data.expiresIn}.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${data.resetUrl}" class="button">Reset Password</a>
        </div>
      </div>
      
      <p><strong>Didn't request this?</strong> No worries! Your password is still secure. You can safely ignore this email.</p>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0; color: #92400e;"><strong>Security Tip:</strong> For your account security, never share this link with anyone.</p>
      </div>
      
      <p>If you're having trouble with the button above, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${data.resetUrl}</p>
      
      <p>Best regards,<br>
      <strong>The Impaktr Team</strong></p>
    </div>
  `;

  return {
    subject: '🔒 Reset Your Impaktr Password',
    html: getBaseTemplate(content, 'Password Reset'),
    text: `Hi ${data.recipientName}, we received a request to reset your Impaktr password. Reset it here: ${data.resetUrl} (expires in ${data.expiresIn}). If you didn't request this, you can safely ignore this email.`
  };
};

// Magic Link Email Template (for NextAuth)
export const getMagicLinkEmailTemplate = (data: EmailTemplateData & {
  loginUrl: string;
  expiresIn: string;
}): EmailTemplate => {
  const content = `
    <div class="greeting">Hi ${data.recipientName},</div>
    
    <div class="main-content">
      <p>Click the button below to sign in to your Impaktr account. No password needed!</p>
      
      <div class="highlight-box">
        <h3>🔗 Sign in to Impaktr</h3>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${data.loginUrl}" class="button">Sign In to Impaktr</a>
        </div>
        <p style="text-align: center; font-size: 14px; color: #6b7280;">This link will expire in ${data.expiresIn}</p>
      </div>
      
      <p><strong>Didn't request this?</strong> You can safely ignore this email.</p>
      
      <p>If you're having trouble with the button above, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${data.loginUrl}</p>
      
      <p>Welcome back!<br>
      <strong>The Impaktr Team</strong></p>
    </div>
  `;

  return {
    subject: '🔗 Sign in to Impaktr',
    html: getBaseTemplate(content, 'Sign in to Impaktr'),
    text: `Hi ${data.recipientName}, click here to sign in to Impaktr: ${data.loginUrl} (expires in ${data.expiresIn}). If you didn't request this, you can safely ignore this email.`
  };
};

// Email verification template (for NextAuth)
export const getEmailVerificationTemplate = (data: EmailTemplateData & {
  verificationUrl: string;
  expiresIn: string;
}): EmailTemplate => {
  const content = `
    <div class="greeting">Hi ${data.recipientName},</div>
    
    <div class="main-content">
      <p>Welcome to Impaktr! Please verify your email address to complete your account setup.</p>
      
      <div class="highlight-box">
        <h3>✅ Verify Your Email</h3>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
        </div>
        <p style="text-align: center; font-size: 14px; color: #6b7280;">This link will expire in ${data.expiresIn}</p>
      </div>
      
      <p>Once verified, you'll be able to:</p>
      <ul>
        <li>🏆 Start earning your Impaktr Score™</li>
        <li>🎯 Join volunteering events</li>
        <li>📜 Receive verified certificates</li>
        <li>🌍 Appear on global leaderboards</li>
      </ul>
      
      <p>If you're having trouble with the button above, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${data.verificationUrl}</p>
      
      <p>Excited to have you on board!<br>
      <strong>The Impaktr Team</strong></p>
    </div>
  `;

  return {
    subject: '✅ Verify your Impaktr email address',
    html: getBaseTemplate(content, 'Verify Email'),
    text: `Hi ${data.recipientName}, please verify your Impaktr email address: ${data.verificationUrl} (expires in ${data.expiresIn})`
  };
};

// Export all template functions
export const emailTemplates = {
  welcome: getWelcomeEmailTemplate,
  badgeEarned: getBadgeEarnedEmailTemplate,
  eventReminder: getEventReminderEmailTemplate,
  verificationRequest: getVerificationRequestEmailTemplate,
  monthlyReport: getMonthlyReportEmailTemplate,
  certificateIssued: getCertificateIssuedEmailTemplate,
  passwordReset: getPasswordResetEmailTemplate,
  magicLink: getMagicLinkEmailTemplate,
  emailVerification: getEmailVerificationTemplate,
};

export type EmailTemplateType = keyof typeof emailTemplates;