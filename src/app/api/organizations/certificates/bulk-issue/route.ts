// home/ubuntu/impaktrweb/src/app/api/organization/certificates/bulk-issue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateCertificatePDF } from '@/lib/certificate-generator';
import { uploadToS3 } from '@/lib/aws';
import { sendEmail } from '@/lib/email';
import { OrganizationMember, Organization, User, Participation, Event } from '@prisma/client';

// Type for organization membership with organization data
type MembershipWithOrganization = OrganizationMember & {
  organization: Organization;
};

// Type for recipient data with user, participation, and event
interface RecipientData {
  user: User;
  participation?: Participation;
  event?: Event;
}

const bulkIssueSchema = z.object({
  templateId: z.string().optional(),
  eventId: z.string().optional(),
  participationIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  certificateType: z.enum(['participation', 'completion', 'achievement', 'custom']),
  title: z.string(),
  description: z.string(),
  customData: z.object({
    eventTitle: z.string().optional(),
    completionDate: z.string().optional(),
    skillsAcquired: z.array(z.string()).optional(),
    hoursCompleted: z.number().optional(),
    performanceRating: z.string().optional(),
    additionalNotes: z.string().optional(),
  }).optional(),
  sendEmail: z.boolean().default(true),
  expiryDate: z.string().transform((str) => new Date(str)).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkIssueSchema.parse(body);

    // Find the user in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has organization admin permissions
    const adminMembership = user.organizationMemberships.find((m: MembershipWithOrganization) => 
      m.role === 'admin' || m.role === 'owner'
    );

    if (!adminMembership) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Organization admin access required.' 
      }, { status: 403 });
    }

    const organization = adminMembership.organization;

    // Get recipients based on provided IDs
    let recipients: RecipientData[] = [];

    if (validatedData.participationIds && validatedData.participationIds.length > 0) {
      // Get users from participation IDs
      const participations = await prisma.participation.findMany({
        where: {
          id: { in: validatedData.participationIds },
          status: 'VERIFIED'
        },
        include: {
          user: true,
          event: true
        }
      });

      recipients = participations.map(p => ({
        user: p.user,
        participation: p,
        event: p.event
      }));
    } else if (validatedData.userIds && validatedData.userIds.length > 0) {
      // Get users directly
      const users = await prisma.user.findMany({
        where: { id: { in: validatedData.userIds } },
        include: { }
      });

      recipients = users.map(user => ({ user }));
    } else if (validatedData.eventId) {
      // Get all verified participants from an event
      const participations = await prisma.participation.findMany({
        where: {
          eventId: validatedData.eventId,
          status: 'VERIFIED'
        },
        include: {
          user: true,
          event: true
        }
      });

      recipients = participations.map(p => ({
        user: p.user,
        participation: p,
        event: p.event
      }));
    }

    if (recipients.length === 0) {
      return NextResponse.json({ 
        error: 'No valid recipients found' 
      }, { status: 400 });
    }

    const issuedCertificates = [];
    const errors = [];

    // Process each recipient
    for (const recipient of recipients) {
      try {
        const { user: recipientUser, participation, event } = recipient;
        
        // Create certificate record first to get unique ID
        const certificate = await prisma.certificate.create({
          data: {
            userId: recipientUser.id,
            type: validatedData.certificateType,
            title: validatedData.title,
            description: validatedData.description,
            eventId: event?.id,
            templateId: validatedData.templateId,
            issuedAt: new Date()
          }
        });

        // Prepare certificate data with certificate ID
        const certificateData = {
          recipientName: recipientUser.name || recipientUser.email,
          recipientEmail: recipientUser.email,
          organizationName: organization.name,
          organizationLogo: organization.logo,
          issueDate: new Date(),
          certificateId: certificate.id,
          type: validatedData.certificateType,
          title: validatedData.title,
          description: validatedData.description,
          ...validatedData.customData,
          // Add participation/event specific data if available
          ...(event && {
            eventTitle: event.title,
            eventDate: event.startDate,
            sdgTags: event.sdg ? [parseInt(event.sdg)] : undefined
          }),
          ...(participation && {
            hoursContributed: participation.hours || 0
          })
        };

        // Generate PDF certificate
        const pdfBuffer = await generateCertificatePDF(certificateData);
        
        // Upload to S3
        const s3Key = `certificates/${organization.id}/${recipientUser.id}/${certificate.id}.pdf`;
        const certificateUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');

        // Update certificate record with PDF URL
        const updatedCertificate = await prisma.certificate.update({
          where: { id: certificate.id },
          data: { certificateUrl }
        });

        // Generate shareable URL
        const shareUrl = `${process.env.NEXTAUTH_URL}/certificates/verify/${certificate.id}`;

        issuedCertificates.push({
          certificateId: certificate.id,
          recipient: recipientUser.email,
          downloadUrl: certificateUrl
        });

        // Send email notification if requested
        if (validatedData.sendEmail) {
          try {
            await sendEmail({
              to: recipientUser.email,
              subject: `🏆 Your ${validatedData.title} Certificate from ${organization.name}`,
              html: `
                <h2>Congratulations ${certificateData.recipientName}!</h2>
                <p>You have been awarded a <strong>${validatedData.title}</strong> certificate from <strong>${organization.name}</strong>.</p>
                ${validatedData.description ? `<p><em>${validatedData.description}</em></p>` : ''}
                <p><a href="${certificateUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Certificate</a></p>
                <p><a href="${shareUrl}" style="color: #007bff;">Share Your Achievement</a></p>
                <p>Best regards,<br/>${organization.name}</p>
              `
            });
          } catch (emailError) {
            console.error('Failed to send certificate email:', emailError);
            // Don't fail the entire operation for email issues
          }
        }

      } catch (error) {
        console.error(`Error issuing certificate for user ${recipient.user.id}:`, error);
        errors.push({
          userId: recipient.user.id,
          email: recipient.user.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log bulk issuance for audit trail
    console.log(`Bulk certificate issuance completed:`, {
      organizationId: organization.id,
      organizationName: organization.name,
      issuedBy: user.email,
      certificatesIssued: issuedCertificates.length,
      errors: errors.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully issued ${issuedCertificates.length} certificates`,
      issuedCertificates,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalRecipients: recipients.length,
        successfullyIssued: issuedCertificates.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error in bulk certificate issuance:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during bulk certificate issuance' },
      { status: 500 }
    );
  }
}