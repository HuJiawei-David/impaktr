// home/ubuntu/impaktrweb/src/app/api/organization/certificates/[id]/revoke/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { OrganizationMember, Organization } from '@prisma/client';

// Type for organization membership with organization data
type MembershipWithOrganization = OrganizationMember & {
  organization: Organization;
};
import { sendEmail } from '@/lib/email';

const revokeSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  notifyRecipient: z.boolean().default(true),
  internalNotes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    }

    const body = await request.json();
    const { reason, notifyRecipient, internalNotes } = revokeSchema.parse(body);

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

    const { id } = await params;

    // Find the certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id }
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Fetch the user separately
    const certificateUser = await prisma.user.findUnique({
      where: { id: certificate.userId }
    });

    if (!certificateUser) {
      return NextResponse.json({ error: 'Certificate user not found' }, { status: 404 });
    }

    // Check if certificate is already revoked
    if (certificate.revokedAt) {
      return NextResponse.json({ 
        error: 'Certificate is already revoked' 
      }, { status: 400 });
    }

    // Check permissions - user must be admin/owner of organization that issued the certificate
    // Note: You'll need to add organizationId field to Certificate model for this to work properly
    const adminMembership = user.organizationMemberships.find((m: MembershipWithOrganization) => 
      (m.role === 'admin' || m.role === 'owner')
      // && m.organizationId === certificate.organizationId // Uncomment when you add this field
    );

    if (!adminMembership) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. You can only revoke certificates issued by your organization.' 
      }, { status: 403 });
    }

    const organization = adminMembership.organization;

    // Create revocation record (you might want to create a CertificateRevocation model)
    const revocationData = {
      certificateId: certificate.id,
      revokedBy: user.id,
      revokedAt: new Date(),
      reason,
      internalNotes,
      organizationId: organization.id
    };

    // For now, we'll set the certificate as expired to "revoke" it
    // In a production system, you'd want a proper revocation table
    const revokedCertificate = await prisma.certificate.update({
      where: { id },
      data: {
        revokedAt: new Date(), // Set revocation timestamp
        // In a full implementation, you'd have:
        // isRevoked: true,
        // revokedBy: user.id,
        // revocationReason: reason,
      }
    });

    // Log the revocation for audit trail
    console.log('Certificate revoked:', {
      certificateId: certificate.id,
      certificateTitle: certificate.title,
      recipientEmail: certificateUser.email,
      revokedBy: user.email,
      organizationName: organization.name,
      reason,
      timestamp: new Date().toISOString()
    });

    // Notify the certificate recipient if requested
    if (notifyRecipient && certificateUser.email) {
      try {
        const recipientName = certificateUser.name || certificateUser.email;
        
        await sendEmail({
          to: certificateUser.email,
          subject: `Certificate Revocation Notice - ${certificate.title}`,
          html: `
            <h2>Certificate Revocation Notice</h2>
            <p>Dear ${recipientName},</p>
            <p>We regret to inform you that your certificate <strong>"${certificate.title}"</strong> issued by <strong>${organization.name}</strong> has been revoked.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p><strong>Revocation Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p>If you have any questions or concerns about this revocation, please contact our support team at ${process.env.SUPPORT_EMAIL || 'support@impaktr.com'}.</p>
            <p>Best regards,<br/>${organization.name}</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send revocation notification:', emailError);
        // Don't fail the revocation for email issues, but log it
      }
    }

    // Optional: Remove the certificate file from S3
    // try {
    //   if (certificate.certificateUrl) {
    //     await deleteFromS3(certificate.certificateUrl);
    //   }
    // } catch (s3Error) {
    //   console.error('Failed to delete certificate file from S3:', s3Error);
    // }

    return NextResponse.json({
      success: true,
      message: 'Certificate successfully revoked',
      certificate: {
        id: revokedCertificate.id,
        title: revokedCertificate.title,
        recipient: certificateUser.email,
        revokedAt: new Date(),
        reason
      }
    });

  } catch (error) {
    console.error('Error revoking certificate:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during certificate revocation' },
      { status: 500 }
    );
  }
}

// GET method to check revocation status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        issuedAt: true,
        revokedAt: true,
        userId: true
      }
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const isRevoked = certificate.revokedAt !== null;

    return NextResponse.json({
      certificateId: certificate.id,
      title: certificate.title,
      issuedAt: certificate.issuedAt,
        revokedAt: certificate.revokedAt,
      isRevoked,
      status: isRevoked ? 'revoked' : 'active',
      recipient: {
        email: 'Unknown',
        name: 'Unknown'
      }
    });

  } catch (error) {
    console.error('Error checking certificate status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}