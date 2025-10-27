import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, metrics } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json({ error: 'Metrics data required' }, { status: 400 });
    }

    // Verify user has access to the organization
    const userMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId,
        status: 'active'
      }
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'Access denied to organization' }, { status: 403 });
    }

    // Validate metrics data
    const validationErrors = [];
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      
      if (!metric.category || !['environmental', 'social', 'governance'].includes(metric.category)) {
        validationErrors.push({
          field: `metrics[${i}].category`,
          message: 'Invalid category. Must be environmental, social, or governance'
        });
      }
      
      if (!metric.metricName || typeof metric.metricName !== 'string' || metric.metricName.trim() === '') {
        validationErrors.push({
          field: `metrics[${i}].metricName`,
          message: 'Metric name is required'
        });
      }
      
      if (!metric.value || typeof metric.value !== 'number' || metric.value <= 0) {
        validationErrors.push({
          field: `metrics[${i}].value`,
          message: 'Value must be a positive number'
        });
      }
      
      if (!metric.unit || typeof metric.unit !== 'string' || metric.unit.trim() === '') {
        validationErrors.push({
          field: `metrics[${i}].unit`,
          message: 'Unit is required'
        });
      }
      
      if (!metric.period || typeof metric.period !== 'string' || metric.period.trim() === '') {
        validationErrors.push({
          field: `metrics[${i}].period`,
          message: 'Period is required'
        });
      }
      
      if (!metric.reportedAt || typeof metric.reportedAt !== 'string') {
        validationErrors.push({
          field: `metrics[${i}].reportedAt`,
          message: 'Reported date is required'
        });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Validation errors found',
        errors: validationErrors
      }, { status: 400 });
    }

    // Create metrics in database
    const createdMetrics = await prisma.eSGMetric.createMany({
      data: metrics.map(metric => ({
        organizationId: organizationId,
        category: metric.category,
        metricName: metric.metricName.trim(),
        value: metric.value,
        unit: metric.unit.trim(),
        period: metric.period.trim(),
        reportedAt: new Date(metric.reportedAt),
        notes: metric.notes?.trim() || null,
        verifiedAt: null,
        verifiedBy: null
      })),
      skipDuplicates: true
    });

    // Update organization's last report date
    await prisma.organization.update({
      where: { id: organizationId },
      data: { lastReportDate: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdMetrics.count} ESG metrics`,
      data: {
        count: createdMetrics.count,
        organizationId: organizationId
      }
    });

  } catch (error) {
    console.error('Error creating ESG metrics:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const category = searchParams.get('category');
    const period = searchParams.get('period');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Verify user has access to the organization
    const userMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId,
        status: 'active'
      }
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'Access denied to organization' }, { status: 403 });
    }

    // Build where clause
    const where: any = { organizationId };
    
    if (category && ['environmental', 'social', 'governance'].includes(category)) {
      where.category = category;
    }
    
    if (period) {
      where.period = period;
    }

    // Get metrics
    const metrics = await prisma.eSGMetric.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { metricName: 'asc' },
        { reportedAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching ESG metrics:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
