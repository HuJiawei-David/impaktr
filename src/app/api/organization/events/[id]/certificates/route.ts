// home/ubuntu/impaktrweb/src/app/api/organization/certificates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

    const skip = (page - 1) * limit;
    const where: any = {
      template: {
        organizationId: organization.id
      }
    };

    // Apply filters
    if (status !== 'all') {
      if (status === 'expired') {
        where.expiresAt = { lt: new Date() };
        where.revokedAt = null;
      } else if (status === 'revoked') {
        where.revokedAt = { not: null };
      } else if (status === 'active') {
        where.revokedAt = null;
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
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
        { user: { profile: { displayName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          participation: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
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
        owner: {
          include: {
            profile: true
          }
        }
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
        isActive: true
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: validatedData.recipientId },
      include: { profile: true }
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Check if certificate already exists for this template and recipient
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        templateId: validatedData.templateId,
        userId: validatedData.recipientId,
        participationId: validatedData.participationId,
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
      recipientName: recipient.profile?.displayName || `${recipient.profile?.firstName} ${recipient.profile?.lastName}`.trim(),
      recipientEmail: recipient.email,
      organizationName: organization.name,
      organizationLogo: organization.owner?.profile?.logo,
      templateData: template.design,
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
        participationId: validatedData.participationId,
        eventId: validatedData.eventId,
        type: template.type,
        title: template.name,
        description: template.description || `Certificate issued using ${template.name} template`,
        certificateUrl,
        shareUrl,
        certificateNumber,
        customData: validatedData.customData,
        notes: validatedData.notes,
        issuedAt: new Date(),
        expiresAt: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null,
      },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        template: true
      }
    });

    // Send notification to recipient (implement your notification service)
    // await sendCertificateNotification(recipient.email, certificate);

    // Update template usage count
    await prisma.certificateTemplate.update({
      where: { id: validatedData.templateId },
      data: {
        usageCount: {
          increment: 1
        }
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
async function generateCertificatePDF(data: any): Promise<string> {
  // This would integrate with your PDF generation service
  // Return URL to generated certificate
  return `https://your-s3-bucket.com/certificates/${data.certificateNumber}.pdf`;
}