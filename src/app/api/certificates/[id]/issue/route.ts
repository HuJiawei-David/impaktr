import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { generateCertificatePDF } from '@/lib/certificate-generator';
import { uploadToS3 } from '@/lib/aws';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id: participationId } = params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the participation (we're using participation ID in the URL)
    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        user: true,
        event: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    // Check if user has admin access to the organization
    const hasAccess = user.organizationMemberships.some(
      (m) => m.organizationId === participation.event.organizationId && ['admin', 'owner'].includes(m.role)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if participation is verified
    if (participation.status !== 'VERIFIED') {
      return NextResponse.json({ error: 'Participation must be verified first' }, { status: 400 });
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        userId: participation.userId,
        eventId: participation.eventId
      }
    });

    if (existingCertificate) {
      return NextResponse.json({ error: 'Certificate already issued' }, { status: 400 });
    }

    // Create certificate record first to get unique ID
    const certificate = await prisma.certificate.create({
      data: {
        userId: participation.userId,
        eventId: participation.eventId,
        type: 'participation',
        title: `${participation.event.title} - Participation Certificate`,
        description: `Certificate of participation in "${participation.event.title}"`,
        issuedAt: new Date(),
        issuedBy: user.id
      }
    });

    // Prepare certificate data for PDF generation with certificate ID
    const certificateData = {
      recipientName: participation.user.name || participation.user.email,
      recipientEmail: participation.user.email,
      issueDate: new Date(),
      type: 'Event Participation' as const,
      eventTitle: participation.event.title,
      eventDate: participation.event.startDate,
      hoursContributed: participation.hours || 0,
      organizationName: participation.event.organization?.name || 'Organization',
      sdgTags: participation.event.sdg ? [parseInt(participation.event.sdg)] : undefined,
      certificateId: certificate.id
    };

    // Generate PDF certificate
    const pdfBuffer = await generateCertificatePDF(certificateData);
    
    // Upload to S3
    const s3Key = `certificates/${participation.userId}/${certificate.id}.pdf`;
    const certificateUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');

    // Update certificate record with PDF URL
    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificate.id },
      data: { certificateUrl }
    });

    return NextResponse.json({ 
      success: true,
      certificate: updatedCertificate,
      downloadUrl: certificateUrl
    });

  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

