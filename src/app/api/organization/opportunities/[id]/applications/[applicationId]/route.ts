import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateApplicationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'WITHDRAWN']),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; applicationId: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await params;
    const body = await request.json();
    const validatedData = updateApplicationSchema.parse(body);

    // Get the application and check permissions
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        opportunity: {
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
        },
        user: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if user is admin of the organization
    if (application.opportunity.organization.members.length === 0) {
      return NextResponse.json({ error: 'Unauthorized to update application' }, { status: 403 });
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: validatedData.status,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
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
          select: {
            id: true,
            title: true,
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

    // Update opportunity spots if approved
    if (validatedData.status === 'APPROVED') {
      await prisma.opportunity.update({
        where: { id: application.opportunityId },
        data: {
          spotsFilled: { increment: 1 }
        }
      });

      // Check if opportunity is now full
      const updatedOpportunity = await prisma.opportunity.findUnique({
        where: { id: application.opportunityId }
      });

      if (updatedOpportunity && updatedOpportunity.spotsFilled >= updatedOpportunity.spots) {
        await prisma.opportunity.update({
          where: { id: application.opportunityId },
          data: { status: 'FILLED' }
        });
      }
    }

    // Notify the applicant
    await prisma.notification.create({
      data: {
        userId: application.userId,
        type: 'APPLICATION_UPDATE',
        title: `Application ${validatedData.status.toLowerCase()}`,
        message: `Your application for "${application.opportunity.title}" has been ${validatedData.status.toLowerCase()}`,
        data: {
          opportunityId: application.opportunityId,
          applicationId: applicationId,
          status: validatedData.status,
        }
      }
    });

    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; applicationId: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await params;

    // Get the application and check if user owns it
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        opportunity: {
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
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if user is the applicant or an admin
    const isApplicant = application.userId === session.user.id;
    const isAdmin = application.opportunity.organization.members.length > 0;

    if (!isApplicant && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to delete application' }, { status: 403 });
    }

    // If approved application is being deleted, update spots
    if (application.status === 'APPROVED') {
      await prisma.opportunity.update({
        where: { id: application.opportunityId },
        data: {
          spotsFilled: { decrement: 1 },
          status: 'OPEN' // Reopen if it was filled
        }
      });
    }

    await prisma.application.delete({
      where: { id: applicationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
