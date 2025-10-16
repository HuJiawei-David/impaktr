import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const applyToOpportunitySchema = z.object({
  message: z.string().max(500).optional(),
  resumeUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: opportunityId } = await params;
    const body = await request.json();
    const validatedData = applyToOpportunitySchema.parse(body);

    // Check if opportunity exists and is open
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { organization: true }
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    if (opportunity.status !== 'OPEN') {
      return NextResponse.json({ error: 'Opportunity is no longer accepting applications' }, { status: 400 });
    }

    if (opportunity.spotsFilled >= opportunity.spots) {
      return NextResponse.json({ error: 'Opportunity is full' }, { status: 400 });
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        opportunityId_userId: {
          opportunityId,
          userId: session.user.id
        }
      }
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this opportunity' }, { status: 400 });
    }

    const application = await prisma.application.create({
      data: {
        opportunityId,
        userId: session.user.id,
        message: validatedData.message,
        resumeUrl: validatedData.resumeUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        opportunity: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
              }
            }
          }
        }
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
        message: `${application.user.name} applied to "${opportunity.title}"`,
        data: {
          opportunityId,
          applicationId: application.id,
          applicantId: session.user.id,
        }
      }))
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error applying to opportunity:', error);
    return NextResponse.json({ error: 'Failed to apply to opportunity' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: opportunityId } = await params;

    // Check if user is admin of the organization that owns this opportunity
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: { in: ['admin', 'owner'] },
                status: 'active'
              }
            }
          }
        }
      }
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    if (opportunity.organization.members.length === 0) {
      return NextResponse.json({ error: 'Unauthorized to view applications' }, { status: 403 });
    }

    const applications = await prisma.application.findMany({
      where: { opportunityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            city: true,
            country: true,
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
