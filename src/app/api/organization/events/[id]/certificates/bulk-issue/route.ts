// home/ubuntu/impaktrweb/src/app/api/organization/events/[id]/certificates/bulk-issue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateCertificatePDF } from '@/lib/certificate-generator';
import { uploadToS3 } from '@/lib/aws';
import { sendEmail } from '@/lib/email';
import { OrganizationMember, User, Participation, Event } from '@prisma/client';

const bulkIssueSchema = z.object({
  templateId: z.string().optional(),
  customMessage: z.string().optional(),
  includeQRCode: z.boolean().default(true),
  sendEmail: z.boolean().default(true),
  participantIds: z.array(z.string()).optional(), // If not provided, issues to all verified participants
  certificateData: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    skillsRecognized: z.array(z.string()).default([]),
    additionalNotes: z.string().optional(),
  }).optional(),
  organizationBranding: z.object({
    logo: z.string().optional(),
    signature: z.string().optional(),
    signatoryName: z.string().optional(),
    signatoryTitle: z.string().optional(),
  }).optional(),
});

interface CertificateGenerationJob {
  participantId: string;
  participantName: string;
  participantEmail: string;
  hoursContributed: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  certificateUrl?: string;
  error?: string;
}

interface CertificateResult {
  certificateId: string;
  participantId: string;
  participantName: string;
  certificateUrl: string;
}

interface ErrorResult {
  participantId: string;
  participantName: string;
  error: string;
}

interface BulkConfig {
  templateId?: string;
  customMessage?: string;
  includeQRCode: boolean;
  sendEmail: boolean;
  organizationBranding?: {
    logo?: string;
    signature?: string;
    signatoryName?: string;
    signatoryTitle?: string;
  };
}

interface Issuer {
  id: string;
  name: string | null;
  email: string;
}

interface BulkJobResults {
  eventId: string;
  totalJobs: number;
  successful: number;
  failed: number;
  certificates: CertificateResult[];
  errors: ErrorResult[];
  completedAt: Date;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = bulkIssueSchema.parse(body);

    // Get user and verify permissions
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

    // Get event and verify organization ownership
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions - must be event creator or organization admin/owner
    const isCreator = event.organizerId === user.id;
    // Get user's organization memberships separately
    const userMemberships = await prisma.organizationMember.findMany({
      where: { userId: user.id }
    });
    const isOrgAdmin = event.organizationId && userMemberships.some(
      (membership: OrganizationMember) => membership.organizationId === event.organizationId && ['admin', 'owner'].includes(membership.role)
    );

    if (!isCreator && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to issue certificates' },
        { status: 403 }
      );
    }

    // Validate event is completed
    if (event.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Certificates can only be issued for completed events' },
        { status: 400 }
      );
    }

    // Get participations separately since event doesn't include them
    const participations = await prisma.participation.findMany({
      where: {
        eventId: id,
        status: 'VERIFIED'
      },
      include: {
        user: true
      }
    });

    if (participations.length === 0) {
      return NextResponse.json(
        { error: 'No verified participants found for certificate generation' },
        { status: 400 }
      );
    }

    // Create certificate generation jobs
    const jobs: CertificateGenerationJob[] = participations.map((participation) => ({
      participantId: participation.userId,
      participantName: participation.user.name || participation.user.email || 'Unknown Participant',
      participantEmail: participation.user.email || '',
      hoursContributed: participation.hours || 0,
      status: 'pending'
    }));

    // Start bulk generation process
    const bulkJobId = `bulk_${event.id}_${Date.now()}`;
    const results = await processBulkCertificateGeneration(
      bulkJobId,
      event,
      jobs,
      validatedData,
      user
    );

    return NextResponse.json({
      bulkJobId,
      totalCertificates: jobs.length,
      successful: results.successful,
      failed: results.failed,
      certificates: results.certificates,
      errors: results.errors,
      message: `Bulk certificate generation initiated for ${jobs.length} participants`
    }, { status: 202 }); // 202 Accepted - processing async

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in bulk certificate generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const bulkJobId = url.searchParams.get('jobId');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get event and verify permissions
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        },
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isCreator = event.organizerId === user.id;
    // Get user's organization memberships separately
    const userMemberships2 = await prisma.organizationMember.findMany({
      where: { userId: user.id }
    });
    const isOrgAdmin = event.organizationId && userMemberships2.some(
      (membership: OrganizationMember) => membership.organizationId === event.organizationId && ['admin', 'owner'].includes(membership.role)
    );

    if (!isCreator && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (bulkJobId) {
      // Get specific bulk job status
      const jobStatus = await getBulkJobStatus(bulkJobId);
      return NextResponse.json(jobStatus);
    }

    // Get all certificates issued for this event
    const certificates = await prisma.certificate.findMany({
      where: {
        eventId: id,
        type: 'event'
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });

    const eligibleParticipants = await prisma.participation.findMany({
      where: {
        eventId: id,
        status: 'VERIFIED'
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        status: event.status
      },
      certificates: certificates.map(cert => ({
        id: cert.id,
        participant: {
          id: cert.userId,
          name: 'Unknown User', // We need to get user details separately
          email: 'unknown@example.com'
        },
        issuedAt: cert.issuedAt,
        certificateUrl: cert.certificateUrl,
        // shareUrl and linkedInShared fields don't exist in Certificate model
      })),
      eligibleParticipants: eligibleParticipants.map(p => ({
        id: p.user.id,
        name: p.user.name || p.user.email,
        email: p.user.email,
        hoursContributed: p.hours || 0,
        hasCertificate: certificates.some(c => c.userId === p.user.id)
      })),
      stats: {
        totalEligible: eligibleParticipants.length,
        certificatesIssued: certificates.length,
        pendingCertificates: eligibleParticipants.length - certificates.length
      }
    });

  } catch (error) {
    console.error('Error fetching certificate status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to process bulk certificate generation
async function processBulkCertificateGeneration(
  bulkJobId: string,
  event: Event & { participations?: Participation[]; organization?: { name: string | null } | null },
  jobs: CertificateGenerationJob[],
  config: BulkConfig,
  issuer: Issuer
) {
  const results = {
    successful: 0,
    failed: 0,
    certificates: [] as CertificateResult[],
    errors: [] as ErrorResult[]
  };

  // Process certificates in batches to avoid overwhelming the system
  const batchSize = 5;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (job) => {
      try {
        job.status = 'generating';

        // Check if certificate already exists
        const existingCert = await prisma.certificate.findFirst({
          where: {
            userId: job.participantId,
            eventId: event.id,
            type: 'event'
          }
        });

        if (existingCert) {
          console.log(`Certificate already exists for participant ${job.participantId}`);
          return {
            success: true,
            certificate: existingCert,
            participant: job
          };
        }

        // Generate certificate data
        const certificateData = {
          type: 'event_participation',
          recipientName: job.participantName,
          recipientEmail: job.participantEmail,
          eventTitle: event.title,
          eventDate: event.startDate,
          completionDate: event.endDate || event.startDate,
          hoursContributed: job.hoursContributed,
          organizationName: event.organization?.name || 'Organization',
          sdg: event.sdg,
          customMessage: config.customMessage,
          includeQRCode: config.includeQRCode,
          branding: config.organizationBranding,
          issueDate: new Date(),
          certificateId: `CERT-${event.id}-${job.participantId}-${Date.now()}`,
          verificationUrl: `${process.env.NEXTAUTH_URL}/verify/${event.id}/${job.participantId}`
        };

        // Generate PDF
        const pdfBuffer = await generateCertificatePDF(certificateData);
        
        // Upload to S3
        const s3Key = `certificates/${event.id}/${job.participantId}/${Date.now()}.pdf`;
        const certificateUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');

        // Create certificate record
        const certificate = await prisma.certificate.create({
          data: {
            userId: job.participantId,
            type: 'event',
            title: `${event.title} - Participation Certificate`,
            description: `Certificate of participation in "${event.title}"`,
            eventId: event.id,
            certificateUrl,
            // shareUrl field doesn't exist in Certificate model
            issuedAt: new Date()
          }
        });

        // Send email if requested
        if (config.sendEmail) {
          // TODO: Implement certificate email when email service is ready
          // await sendCertificateEmail({
          //   to: job.participantEmail,
          //   participantName: job.participantName,
          //   eventTitle: event.title,
          //   organizationName: event.organization?.name || 'Organization',
          //   certificateUrl,
          //   customMessage: config.customMessage
          // });
        }

        job.status = 'completed';
        job.certificateUrl = certificateUrl;

        return {
          success: true,
          certificate,
          participant: job
        };

      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        
        console.error(`Error generating certificate for participant ${job.participantId}:`, error);
        
        return {
          success: false,
          error: job.error,
          participant: job
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success && result.value.certificate) {
          results.successful++;
          results.certificates.push({
            certificateId: result.value.certificate.id,
            participantId: result.value.participant.participantId,
            participantName: result.value.participant.participantName,
            certificateUrl: result.value.certificate.certificateUrl || ''
          });
        } else {
          results.failed++;
          results.errors.push({
            participantId: result.value.participant.participantId,
            participantName: result.value.participant.participantName,
            error: result.value.error || 'Unknown error'
          });
        }
      } else {
        results.failed++;
        results.errors.push({
          participantId: 'unknown',
          participantName: 'unknown',
          error: result.reason?.message || 'Promise rejected'
        });
      }
    });

    // Add delay between batches to prevent overwhelming the system
    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Store bulk job results (you might want to use Redis or database for this)
  await storeBulkJobResults(bulkJobId, {
    eventId: event.id,
    totalJobs: jobs.length,
    successful: results.successful,
    failed: results.failed,
    certificates: results.certificates,
    errors: results.errors,
    completedAt: new Date()
  });

  return results;
}

async function getBulkJobStatus(bulkJobId: string) {
  // Retrieve bulk job status (implement based on your storage choice)
  // This is a mock implementation
  return {
    jobId: bulkJobId,
    status: 'completed',
    progress: 100,
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0
  };
}

interface BulkJobResults {
  eventId: string;
  totalJobs: number;
  successful: number;
  failed: number;
  certificates: CertificateResult[];
  errors: ErrorResult[];
  completedAt: Date;
}

async function storeBulkJobResults(bulkJobId: string, results: BulkJobResults) {
  // Store bulk job results for later retrieval
  // You could use Redis, database, or file system
  console.log(`Storing bulk job results for ${bulkJobId}:`, results);
}