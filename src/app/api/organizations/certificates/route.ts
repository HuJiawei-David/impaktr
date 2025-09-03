// home/ubuntu/impaktrweb/src/app/api/organizations/certificates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';
import { generateOrganizationCertificate } from '@/lib/certificate-generator';
import { uploadToS3 } from '@/lib/aws';
import { z } from 'zod';

const createOrgCertificateSchema = z.object({
  participantId: z.string(),
  eventId: z.string(),
  templateType: z.enum(['standard', 'premium', 'custom']).default('standard'),
  customMessage: z.string().optional(),
  additionalData: z.object({}).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { participantId, eventId, customMessage } = createOrgCertificateSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify that the user has permission to issue certificates for this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: { include: { profile: true } },
        organization: {
          include: {
            members: {
              where: { userId: user.id }
            },
            owner: { include: { profile: true } }
          }
        },
        participations: {
          where: { 
            userId: participantId,
            status: 'VERIFIED'
          },
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check permissions
    const isEventCreator = event.creatorId === user.id;
    const hasOrgPermission = event.organization?.members.some(
      member => member.role === 'admin' || member.role === 'owner'
    );

    if (!isEventCreator && !hasOrgPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to issue certificates for this event' },
        { status: 403 }
      );
    }

    const participation = event.participations[0];
    if (!participation) {
      return NextResponse.json(
        { error: 'Verified participation not found' },
        { status: 404 }
      );
    }

    // Prepare certificate data
    const certificateData = {
      organizationName: event.organization?.name || (event.creator.profile?.organizationName || 'Independent Organizer'),
      recipientName: participation.user.profile?.displayName || 
                     `${participation.user.profile?.firstName} ${participation.user.profile?.lastName}`.trim(),
      eventTitle: event.title,
      hoursContributed: participation.hoursActual || participation.hoursCommitted,
      eventDate: event.startDate,
      organizationLogo: event.organization?.owner?.profile?.logo ?? undefined,
      sdgTags: event.sdgTags,
      verificationMethod: String(event.verificationType)
    };

    // Generate certificate PDF
    const pdfBuffer = await generateOrganizationCertificate(certificateData);

    // Upload to S3
    const s3Key = `certificates/organizations/${event.organizationId || event.creatorId}/${Date.now()}-${participantId}.pdf`;
    const certificateUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        userId: participantId,
        type: 'organization_issued',
        title: `${event.title} - Certificate of Appreciation`,
        description:
          `Certificate issued by ${certificateData.organizationName} for participation in ${event.title}` +
          (customMessage && customMessage.trim().length > 0 ? `\n\nNote: ${customMessage.trim()}` : ''),
        eventId,
        participationId: participation.id,
        certificateUrl,
        issuedAt: new Date()
      }
    });

    return NextResponse.json({ certificate, downloadUrl: certificateUrl }, { status: 201 });
  } catch (error) {
    console.error('Error issuing organization certificate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}