// home/ubuntu/impaktrweb/src/app/api/organization/certificates/bulk-issue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateCertificatePDF } from '@/lib/certificate-generator';
import { uploadToS3 } from '@/lib/aws';
import { sendEmail } from '@/lib/email';

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
        profile: true,
        memberships: {
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
    const adminMembership = user.memberships.find(m => 
      m.role === 'admin' || m.role === 'owner'
    );

    if (!adminMembership) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Organization admin access required.' 
      }, { status: 403 });
    }

    const organization = adminMembership.organization;

    // Get recipients based on provided IDs
    let recipients: any[] = [];

    if (validatedData.participationIds && validatedData.participationIds.length > 0) {
      // Get users from participation IDs
      const participations = await prisma.participation.findMany({
        where: {
          id: { in: validatedData.participationIds },
          status: 'VERIFIED'
        },
        include: {
          user: {
            include: { profile: true }
          },
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
        include: { profile: true }
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
          user: {
            include: { profile: true }
          },
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
        
        // Prepare certificate data
        const certificateData = {
          recipientName: recipientUser.profile?.displayName || 
                         `${recipientUser.profile?.firstName} ${recipientUser.profile?.lastName}`.trim() ||
                         recipientUser.email,
          recipientEmail: recipientUser.email,
          organizationName: organization.name,
          organizationLogo: user.profile?.logo,
          issueDate: new Date(),
          certificateId: `CERT-${organization.id.slice(-6)}-${Date.now()}-${recipientUser.id.slice(-4)}`,
          type: validatedData.certificateType,
          title: validatedData.title,
          description: validatedData.description,
          ...validatedData.customData,
          // Add participation/event specific data if available
          ...(event && {
            eventTitle: event.title,
            eventDate: event.startDate,
            sdgTags: event.sdgTags
          }),
          ...(participation && {
            hoursCompleted: participation.hoursActual || participation.hoursCommitted,
            completionDate: participation.verifiedAt || participation.updatedAt
          })
        };

        // Generate PDF certificate
        const pdfBuffer = await generateCertificatePDF(certificateData);
        
        // Upload to S3
        const s3Key = `certificates/${organization.id}/${recipientUser.id}/${certificateData.certificateId}.pdf`;
        const certificateUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');

        // Generate shareable URL
        const shareUrl = `${process.env.NEXTAUTH_URL}/certificates/verify/${certificateData.certificateId}`;

        // Create certificate record
        const certificate = await prisma.certificate.create({
          data: {
            userId: recipientUser.id,
            type: validatedData.certificateType,
            title: validatedData.title,
            description: validatedData.description,
            eventId: event?.id,
            participationId: participation?.id,
            certificateUrl,
            shareUrl,
            templateId: validatedData.templateId,
            issuedAt: new Date(),
            expiresAt: validatedData.expiryDate,
            // Add organization reference (assuming you have this field)
            // organizationId: organization.id,
            // Add certificate metadata
            // certificateId: certificateData.certificateId,
          }
        });

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