/**
 * ESG Validation Record Delete API Endpoint
 * 
 * DELETE /api/organizations/esg-validation/[validationId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ validationId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { validationId } = await params;

    if (!validationId) {
      return NextResponse.json(
        { error: 'Validation ID is required' },
        { status: 400 }
      );
    }

    // Get validation record to verify it exists
    const validationRecord = await prisma.validationResult.findFirst({
      where: { id: validationId }
    });

    if (!validationRecord) {
      return NextResponse.json(
        { error: 'Validation record not found' },
        { status: 404 }
      );
    }

    // Verify organization access
    const organization = await prisma.organization.findFirst({
      where: {
        id: validationRecord.organizationId,
        members: { some: { userId: session.user.id } }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete the validation record
    await prisma.validationResult.delete({
      where: { id: validationId }
    });

    return NextResponse.json({
      success: true,
      message: 'Validation record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting validation record:', error);
    return NextResponse.json(
      { error: 'Failed to delete validation record' },
      { status: 500 }
    );
  }
}
