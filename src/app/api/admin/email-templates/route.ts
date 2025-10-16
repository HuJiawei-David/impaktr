import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  type: z.enum(['WELCOME', 'EVENT_REMINDER', 'EVENT_CANCELLED', 'BADGE_EARNED', 'VERIFICATION_REQUEST', 'SUPPORT_RESPONSE', 'REFERRAL_INVITE', 'MONTHLY_REPORT', 'CUSTOM']),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const updateTemplateSchema = createTemplateSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') as 'WELCOME' | 'EVENT_REMINDER' | 'EVENT_CANCELLED' | 'BADGE_EARNED' | 'VERIFICATION_REQUEST' | 'SUPPORT_RESPONSE' | 'REFERRAL_INVITE' | 'MONTHLY_REPORT' | 'CUSTOM' | null;
    const isActive = url.searchParams.get('isActive') === 'true';

    let where: any = {};

    if (type) {
      where.type = type;
    }

    if (isActive !== null) {
      where.isActive = isActive;
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    const template = await prisma.emailTemplate.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating email template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    const template = await prisma.emailTemplate.update({
      where: { id: templateId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating email template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Check if template is being used
    const usageCount = await prisma.emailLog.count({
      where: { templateId }
    });

    if (usageCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete template that has been used',
        usageCount 
      }, { status: 400 });
    }

    await prisma.emailTemplate.delete({
      where: { id: templateId }
    });

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json({ error: 'Failed to delete email template' }, { status: 500 });
  }
}

