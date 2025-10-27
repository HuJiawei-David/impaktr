/**
 * ESG Validation History API Endpoint
 * 
 * GET /api/organizations/esg-validation/history/[organizationId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const { organizationId } = await params;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify organization access
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        OR: [
          { members: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // Get validation history
    const validationHistory = await prisma.validationResult.findMany({
      where: { organizationId },
      orderBy: { validatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        validationScore: true,
        isValid: true,
        validatedAt: true,
        validatedBy: true
      }
    });

    return NextResponse.json({
      success: true,
      data: validationHistory
    });

  } catch (error) {
    console.error('Error fetching validation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation history' },
      { status: 500 }
    );
  }
}
