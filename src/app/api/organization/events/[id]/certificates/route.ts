// home/ubuntu/impaktrweb/src/app/api/organization/certificates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Types for certificate data
interface CertificateData {
  recipientName: string;
  recipientEmail: string;
  eventTitle?: string;
  eventDate?: Date;
  hoursContributed?: number;
  organizationName: string;
  templateData: Record<string, unknown>;
  certificateNumber?: string;
  issueDate?: Date;
  expirationDate?: Date | null;
}

const issueCertificateSchema = z.object({
  templateId: z.string(),
  recipientId: z.string(),
  participationId: z.string().optional(),
  eventId: z.string().optional(),
  customData: z.record(z.any()).optional(),
  expirationDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const querySchema = z.object({
  page: z.string().transform(str => parseInt(str)).default('1'),
  limit: z.string().transform(str => parseInt(str)).default('20'),
  status: z.enum(['active', 'revoked', 'expired', 'all']).default('all'),
  templateId: z.string().optional(),
  recipientId: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { page, limit, status, templateId, recipientId, search } = querySchema.parse(params);

    // Check if user is organization admin
    const organization = await prisma.organization.findFirst({
      where: {
        members: {
          some: {
            userId: session.user.id,
            role: { in: ['admin', 'owner'] }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization access required' }, { status: 403 });
    }

    // Get organization templates
    const templates = await prisma.certificateTemplate.findMany({
      where: { organizationId: organization.id },
      select: { id: true }
    });
    const templateIds = templates.map(t => t.id);

    const skip = (page - 1) * limit;
    const where: Prisma.CertificateWhereInput = {
      templateId: {
        in: templateIds
      }
    };

    // Apply filters
    if (status !== 'all') {
      if (status === 'expired') {
        where.issuedAt = { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }; // Note: expiresAt field not available
        where.revokedAt = null;
      } else if (status === 'revoked') {
        where.revokedAt = { not: null };
      } else if (status === 'active') {
        where.revokedAt = null;
        where.OR = [
          { expiresAt: null } as Prisma.CertificateWhereInput,
          { expiresAt: { gt: new Date() } } as Prisma.CertificateWhereInput
        ];
      }
    }

    if (templateId) {
      where.templateId = templateId;
    }

    if (recipientId) {
      where.userId = recipientId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } } as Prisma.CertificateWhereInput
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        // include: {
        //   user: true,
        //   // template field doesn't exist in Certificate model
        //   // participation field doesn't exist in Certificate model
        // },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({
      certificates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = issueCertificateSchema.parse(body);

    // Check if user is organization admin
    const organization = await prisma.organization.findFirst({
      where: {
        members: {
          some: {
            userId: session.user.id,
            role: { in: ['admin', 'owner'] }
          }
        }
      },
      include: {
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization access required' }, { status: 403 });
    }

    // Verify template belongs to organization
    const template = await prisma.certificateTemplate.findFirst({
      where: {
        id: validatedData.templateId,
        organizationId: organization.id,
        // isActive field doesn't exist in CertificateTemplate model
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: validatedData.recipientId },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Check if certificate already exists for this template and recipient
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        templateId: validatedData.templateId,
        userId: validatedData.recipientId,
        // participationId field doesn't exist in Certificate model
        revokedAt: null
      }
    });

    if (existingCertificate) {
      return NextResponse.json(
        { error: 'Certificate already exists for this recipient' },
        { status: 400 }
      );
    }

    // Generate certificate number
    const certificateNumber = `CERT-${organization.name.substring(0, 3).toUpperCase()}-${Date.now()}`;

    // Create certificate data
    const certificateData = {
      recipientName: recipient.name || recipient.email,
      recipientEmail: recipient.email,
      organizationName: organization.name,
      organizationLogo: organization.logo,
        templateData: template.template as Record<string, unknown>, // design field doesn't exist, using template instead
      customData: validatedData.customData || {},
      certificateNumber,
      issueDate: new Date(),
      expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null
    };

    // Generate certificate URL (this would integrate with your certificate generation service)
    const certificateUrl = await generateCertificatePDF(certificateData);
    const shareUrl = `${process.env.NEXTAUTH_URL}/certificates/view/${certificateNumber}`;

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        userId: validatedData.recipientId,
        templateId: validatedData.templateId,
        // participationId field doesn't exist in Certificate model
        eventId: validatedData.eventId,
        type: template.type,
        title: template.name,
        description: template.description || `Certificate issued using ${template.name} template`,
        certificateUrl,
        // shareUrl field doesn't exist in Certificate model
        // certificateNumber field doesn't exist in Certificate model
        // customData field doesn't exist in Certificate model
        // notes field doesn't exist in Certificate model
        issuedAt: new Date(),
        // expiresAt field doesn't exist in Certificate model
      },
      // include: {
      //   user: {
      //     include: {
      //     }
      //   },
      //   template: true
      // }
    });

    // Send notification to recipient (implement your notification service)
    // await sendCertificateNotification(recipient.email, certificate);

    // Update template usage count
    await prisma.certificateTemplate.update({
      where: { id: validatedData.templateId },
      data: {
        // usageCount field doesn't exist in CertificateTemplate model
      }
    });

    return NextResponse.json({ certificate }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate certificate PDF (implement based on your needs)
async function generateCertificatePDF(data: CertificateData): Promise<string> {
  // This would integrate with your PDF generation service
  // Return URL to generated certificate
  return `https://your-s3-bucket.com/certificates/${data.certificateNumber}.pdf`;
}