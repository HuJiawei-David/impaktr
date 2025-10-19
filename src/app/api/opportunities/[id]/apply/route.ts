import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const applySchema = z.object({
  message: z.string().max(500).optional(),
  resumeUrl: z.string().url().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = applySchema.parse(body);

    // Check if opportunity exists and is open
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      select: { id: true, status: true, spots: true, spotsFilled: true, organizationId: true }
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    if (opportunity.status !== 'OPEN') {
      return NextResponse.json({ error: 'Opportunity is not open for applications' }, { status: 400 });
    }

    if (opportunity.spotsFilled >= opportunity.spots) {
      return NextResponse.json({ error: 'Opportunity is full' }, { status: 400 });
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        opportunityId_userId: {
          opportunityId: id,
          userId: session.user.id
        }
      }
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this opportunity' }, { status: 400 });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        opportunityId: id,
        userId: session.user.id,
        message: validatedData.message,
        resumeUrl: validatedData.resumeUrl,
        status: 'PENDING'
      }
    });

    // Notify organization admins
    const admins = await prisma.organizationMember.findMany({
      where: {
        organizationId: opportunity.organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      },
      include: { user: true }
    });

    // Create notifications for admins
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.userId,
        type: 'APPLICATION_UPDATE',
        title: 'New Application Received',
        message: `New application received for an opportunity`,
        data: {
          opportunityId: id,
          applicationId: application.id,
          applicantId: session.user.id,
        }
      }))
    });

    return NextResponse.json({ 
      message: 'Application submitted successfully',
      application 
    });
  } catch (error) {
    console.error('Error applying to opportunity:', error);
    return NextResponse.json({ error: 'Failed to apply to opportunity' }, { status: 500 });
  }
}
