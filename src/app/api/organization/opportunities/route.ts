import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createOpportunitySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  requirements: z.array(z.string()).min(1),
  spots: z.number().int().min(1),
  deadline: z.string().datetime().optional(),
  location: z.string().optional(),
  isRemote: z.boolean().default(false),
  skills: z.array(z.string()).optional(),
  sdg: z.string().optional(),
});

const applyToOpportunitySchema = z.object({
  message: z.string().max(500).optional(),
  resumeUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createOpportunitySchema.parse(body);
    const { createdAsDepartmentId, organizationId: requestedOrgId } = body as any;

    let organizationId: string | undefined;

    // Check if creating as department account
    if (createdAsDepartmentId) {
      const { hasDepartmentAccess } = await import('@/lib/organization-permissions');
      const deptAccess = await hasDepartmentAccess(session.user.id, createdAsDepartmentId);
      
      if (!deptAccess) {
        return NextResponse.json(
          { error: 'No access to this department account' },
          { status: 403 }
        );
      }

      organizationId = deptAccess.organizationId;
    } else {
      // Standard check: direct membership or use requested org
      const { hasOrganizationAccess, getAccessibleOrganizations } = await import('@/lib/organization-permissions');
      
      if (requestedOrgId) {
        const hasAccess = await hasOrganizationAccess(session.user.id, requestedOrgId);
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Only organization admins can create opportunities' },
            { status: 403 }
          );
        }
        organizationId = requestedOrgId;
      } else {
        // Get first accessible organization
        const accessibleOrgs = await getAccessibleOrganizations(session.user.id);
        if (accessibleOrgs.length === 0) {
          return NextResponse.json(
            { error: 'Only organization admins can create opportunities' },
            { status: 403 }
          );
        }
        organizationId = accessibleOrgs[0].id;
      }
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        organizationId,
        title: validatedData.title,
        description: validatedData.description,
        requirements: validatedData.requirements,
        spots: validatedData.spots,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        location: validatedData.location,
        isRemote: validatedData.isRemote,
        skills: validatedData.skills || [],
        sdg: validatedData.sdg,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            tier: true,
          }
        },
        _count: {
          select: {
            applications: true,
          }
        }
      }
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const status = url.searchParams.get('status') || 'OPEN';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const opportunities = await prisma.opportunity.findMany({
      where: {
        organizationId: organizationId ? { equals: organizationId } : undefined,
        status: status as any,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            tier: true,
          }
        },
        applications: {
          select: { id: true, status: true, userId: true }
        },
        _count: {
          select: {
            applications: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const formattedOpportunities = opportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      requirements: opp.requirements,
      spots: opp.spots,
      spotsFilled: opp.spotsFilled,
      deadline: opp.deadline,
      location: opp.location,
      isRemote: opp.isRemote,
      skills: opp.skills,
      sdg: opp.sdg,
      status: opp.status,
      createdAt: opp.createdAt,
      organization: {
        id: opp.organization.id,
        name: opp.organization.name,
        logo: opp.organization.logo,
        tier: opp.organization.tier,
      },
      stats: {
        totalApplications: opp._count.applications,
        spotsRemaining: opp.spots - opp.spotsFilled,
        appliedCount: opp.applications.filter(app => app.status === 'PENDING').length,
        acceptedCount: opp.applications.filter(app => app.status === 'APPROVED').length,
        rejectedCount: opp.applications.filter(app => app.status === 'REJECTED').length,
      },
      hasApplied: opp.applications.some(app => app.userId === session.user.id),
      applicationStatus: opp.applications.find(app => app.userId === session.user.id)?.status || null,
    }));

    return NextResponse.json({ opportunities: formattedOpportunities });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

