// /home/ubuntu/impaktrweb/src/lib/email.ts

interface EmailContent {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Email service for sending emails
 * This is a placeholder implementation that logs emails to console
 * In production, you would integrate with services like:
 * - SendGrid
 * - AWS SES
 * - Postmark
 * - Resend
 * - Nodemailer with SMTP
 */
export async function sendEmail(content: EmailContent): Promise<boolean> {
  try {
    // For development/testing - log email to console
    console.log('\n=== EMAIL SENT ===');
    console.log(`To: ${content.to}`);
    console.log(`Subject: ${content.subject}`);
    console.log(`From: ${content.from || 'noreply@impaktr.com'}`);
    console.log('--- HTML Content ---');
    console.log(content.html);
    console.log('=== END EMAIL ===\n');

    // TODO: Replace with actual email service implementation
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: content.to,
      from: content.from || 'noreply@impaktr.com',
      subject: content.subject,
      html: content.html,
    };
    
    await sgMail.send(msg);
    */

    // Example with AWS SES:
    /*
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({
      apiVersion: '2010-12-01',
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const params = {
      Destination: {
        ToAddresses: [content.to],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: content.html,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: content.subject,
        },
      },
      Source: content.from || 'noreply@impaktr.com',
    };

    await ses.sendEmail(params).promise();
    */

    // Example with Resend:
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: content.from || 'noreply@impaktr.com',
      to: content.to,
      subject: content.subject,
      html: content.html,
    });
    */

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send organization invitation email
 */
export async function sendOrganizationInvitation({
  to,
  organizationName,
  inviterName,
  role,
  invitationUrl,
  message
}: {
  to: string;
  organizationName: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
  message?: string;
}) {
  const emailContent = {
    to,
    subject: `Invitation to join ${organizationName} on Impaktr`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">
            You're Invited to Join ${organizationName}
          </h1>
        </div>
        
        <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="font-size: 18px; color: #2c3e50; margin-bottom: 20px;">Hello!</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Impaktr as a <strong>${role}</strong>.
          </p>
          
          ${message ? `
            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 25px 0; font-style: italic;">
              "${message}"
            </div>
          ` : ''}
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 6px; margin: 25px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">What is Impaktr?</h3>
            <p style="margin-bottom: 15px;">Impaktr is the world's first platform for measuring and verifying social impact. By joining ${organizationName}, you'll be able to:</p>
            <ul style="color: #555; padding-left: 20px;">
              <li>Participate in verified volunteering events</li>
              <li>Track your personal impact score and hours</li>
              <li>Earn UN SDG badges and certificates</li>
              <li>Contribute to your organization's collective impact</li>
              <li>Share verified achievements on LinkedIn</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${invitationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 35px; 
                      text-decoration: none; 
                      border-radius: 50px; 
                      font-weight: 600; 
                      font-size: 16px; 
                      display: inline-block; 
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Accept Invitation & Join Now
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              ⏰ <strong>This invitation expires in 7 days.</strong> Accept it soon to start making measurable impact!
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Questions? Reply to this email or contact the Impaktr support team.
          </p>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">
            Best regards,<br>
            The Impaktr Team
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${invitationUrl}</p>
          <p style="margin-top: 20px;">
            © 2024 Impaktr. Making social impact measurable.
          </p>
        </div>
      </div>
    `
  };

  return sendEmail(emailContent);
}
