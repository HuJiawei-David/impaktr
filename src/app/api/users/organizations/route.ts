import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with organization memberships
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
                type: true,
                description: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all accessible organizations (direct + department)
    const { getAccessibleOrganizations } = await import('@/lib/organization-permissions');
    const accessibleOrgs = await getAccessibleOrganizations(user.id);

    // Fetch full organization details for each
    const orgDetails = await Promise.all(
      accessibleOrgs.map(async (org) => {
        const fullOrg = await prisma.organization.findUnique({
          where: { id: org.id },
          select: {
            id: true,
            name: true,
            logo: true,
            type: true,
            description: true,
          }
        });
        
        return {
          id: org.id,
          name: org.name,
          logo: fullOrg?.logo,
          type: fullOrg?.type,
          description: fullOrg?.description,
          role: org.role || 'admin',
          accessType: org.type, // 'direct' or 'department'
          departmentAccountId: org.departmentAccountId,
        };
      })
    );
    
    const adminOrganizations = orgDetails;

    return NextResponse.json({
      organizations: adminOrganizations,
      total: adminOrganizations.length,
    });

  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
