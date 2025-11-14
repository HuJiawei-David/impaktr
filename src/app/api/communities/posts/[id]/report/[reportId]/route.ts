import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const reviewReportSchema = z.object({
  action: z.enum(['dismiss', 'resolve']),
});

// PUT /api/communities/posts/[id]/report/[reportId] - Review a report (dismiss or resolve)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId } = await params;
    const body = await request.json();
    const { action } = reviewReportSchema.parse(body);

    // Get the report
    const report = await prisma.communityPostReport.findUnique({
      where: { id: reportId },
      include: {
        post: {
          include: {
            community: {
              include: {
                members: {
                  where: {
                    userId: session.user.id
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    const membership = report.post.community.members[0];
    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update report status
    const status = action === 'dismiss' ? 'DISMISSED' : 'RESOLVED';
    const updatedReport = await prisma.communityPostReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: session.user.id
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Report ${action}ed successfully`,
      report: updatedReport
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error reviewing report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

