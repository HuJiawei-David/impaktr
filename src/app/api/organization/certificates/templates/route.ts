// home/ubuntu/impaktrweb/src/app/api/organization/certificates/templates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  type: z.enum(['participation', 'completion', 'achievement', 'appreciation', 'custom']),
  category: z.string().optional(),
  design: z.object({
    layout: z.enum(['portrait', 'landscape']),
    theme: z.enum(['classic', 'modern', 'minimal', 'elegant', 'corporate']),
    primaryColor: z.string(),
    secondaryColor: z.string().optional(),
    backgroundColor: z.string(),
    textColor: z.string(),
    headerText: z.string(),
    bodyText: z.string(),
    footerText: z.string().optional(),
    logoPosition: z.enum(['top-left', 'top-center', 'top-right', 'center']),
    signaturePosition: z.enum(['bottom-left', 'bottom-center', 'bottom-right']),
    borderStyle: z.enum(['none', 'simple', 'decorative', 'modern']),
    fontFamily: z.enum(['serif', 'sans-serif', 'script', 'monospace']),
    fontSize: z.object({
      header: z.number().min(12).max(72),
      body: z.number().min(8).max(48),
      footer: z.number().min(8).max(24)
    }),
    customFields: z.array(z.object({
      name: z.string(),
      label: z.string(),
      type: z.enum(['text', 'date', 'number', 'boolean']),
      required: z.boolean().default(false),
      placeholder: z.string().optional()
    })).default([])
  }),
  autoIssue: z.object({
    enabled: z.boolean().default(false),
    trigger: z.enum(['event_completion', 'hours_milestone', 'badge_earned']).optional(),
    conditions: z.record(z.any()).optional()
  }).optional(),
  requiresApproval: z.boolean().default(false),
  validityPeriod: z.number().optional(), // days
  isActive: z.boolean().default(true),
});

const querySchema = z.object({
  page: z.string().transform(str => parseInt(str)).default('1'),
  limit: z.string().transform(str => parseInt(str)).default('20'),
  type: z.enum(['participation', 'completion', 'achievement', 'appreciation', 'custom', 'all']).default('all'),
  category: z.string().optional(),
  isActive: z.string().transform(str => str === 'true').optional(),
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
    const { page, limit, type, category, isActive, search } = querySchema.parse(params);

    // Get user's organization
    const organization = await prisma.organization.findFirst({
      where: {
        members: {
          some: {
            userId: session.user.id,
            role: { in: ['admin', 'owner', 'member'] }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization access required' }, { status: 403 });
    }

    const skip = (page - 1) * limit;
    const where: any = {
      organizationId: organization.id
    };

    // Apply filters
    if (type !== 'all') {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.certificateTemplate.findMany({
        where: { organizationId: organization.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              certificates: true
            }
          }
        }
      }),
      prisma.certificateTemplate.count({
        where: { organizationId: organization.id }
      })
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching certificate templates:', error);
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
    const validatedData = createTemplateSchema.parse(body);

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
      return NextResponse.json({ error: 'Organization admin access required' }, { status: 403 });
    }

    // Check template name uniqueness within organization
    const existingTemplate = await prisma.certificateTemplate.findFirst({
      where: {
        organizationId: organization.id,
        name: validatedData.name
      }
    });

    if (existingTemplate) {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 400 });
    }

    // Create certificate template
    const template = await prisma.certificateTemplate.create({
      data: {
        organizationId: organization.id,
        createdById: session.user.id,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        category: validatedData.category,
        design: validatedData.design,
        autoIssue: validatedData.autoIssue?.enabled || false,
        requiresApproval: validatedData.requiresApproval,
        validityPeriod: validatedData.validityPeriod,
        isActive: validatedData.isActive
      },
      include: {
        _count: {
          select: {
            certificates: true
          }
        }
      }
    });

    return NextResponse.json({ template }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating certificate template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}