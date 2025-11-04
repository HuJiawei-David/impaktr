import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasOrganizationAccess } from '@/lib/organization-permissions';

const grantAccessSchema = z.object({
  departmentAccountId: z.string().min(1),
  individualUserId: z.string().min(1),
  permissions: z.array(z.string()).default(['CREATE_EVENTS', 'POST_OPPORTUNITIES']),
});

const revokeAccessSchema = z.object({
  departmentAccountId: z.string().min(1),
  individualUserId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { departmentAccountId, individualUserId, permissions } = grantAccessSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify department account exists and get organization
    const departmentAccount = await prisma.user.findUnique({
      where: { id: departmentAccountId },
      include: {
        organizationMemberships: true
      }
    });

    const isDepartment = departmentAccount?.userType === ('DEPARTMENT' as const);
    if (!departmentAccount || !isDepartment) {
      return NextResponse.json({ error: 'Department account not found' }, { status: 404 });
    }

    const orgMembership = departmentAccount.organizationMemberships[0];
    if (!orgMembership) {
      return NextResponse.json({ error: 'Department not linked to organization' }, { status: 400 });
    }

    // Check if user has permission (must be owner/admin)
    const hasAccess = await hasOrganizationAccess(user.id, orgMembership.organizationId, 'owner');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Only organization owners/admins can grant department access' }, { status: 403 });
    }

    // Verify individual user exists
    const individualUser = await prisma.user.findUnique({
      where: { id: individualUserId }
    });

    if (!individualUser) {
      return NextResponse.json({ error: 'Individual user not found' }, { status: 404 });
    }

    if (individualUser.userType !== 'INDIVIDUAL') {
      return NextResponse.json({ error: 'Can only grant access to individual users' }, { status: 400 });
    }

    // Check if access already exists
    const existingAccess = await prisma.departmentAccess.findUnique({
      where: {
        departmentAccountId_individualUserId: {
          departmentAccountId,
          individualUserId
        }
      }
    });

    if (existingAccess) {
      if (existingAccess.revokedAt) {
        // Reactivate access
        const updated = await prisma.departmentAccess.update({
          where: { id: existingAccess.id },
          data: {
            revokedAt: null,
            permissions: permissions,
            grantedBy: user.id,
            grantedAt: new Date()
          },
          include: {
            individualUser: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            departmentAccount: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        return NextResponse.json({
          access: {
            id: updated.id,
            departmentAccount: updated.departmentAccount,
            individualUser: updated.individualUser,
            permissions: updated.permissions,
            grantedAt: updated.grantedAt
          },
          message: 'Department access reactivated'
        });
      } else {
        return NextResponse.json({ error: 'Access already granted' }, { status: 400 });
      }
    }

    // Create new access
    const access = await prisma.departmentAccess.create({
      data: {
        departmentAccountId,
        individualUserId,
        grantedBy: user.id,
        permissions: permissions
      },
      include: {
        individualUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        departmentAccount: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      access: {
        id: access.id,
        departmentAccount: access.departmentAccount,
        individualUser: access.individualUser,
        permissions: access.permissions,
        grantedAt: access.grantedAt
      },
      message: 'Department access granted successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error granting department access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const departmentAccountId = url.searchParams.get('departmentAccountId');
    const individualUserId = url.searchParams.get('individualUserId');

    if (!departmentAccountId || !individualUserId) {
      return NextResponse.json({ error: 'Department account ID and individual user ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get access record
    const access = await prisma.departmentAccess.findUnique({
      where: {
        departmentAccountId_individualUserId: {
          departmentAccountId,
          individualUserId
        }
      },
      include: {
        departmentAccount: {
          include: {
            organizationMemberships: true
          }
        }
      }
    });

    if (!access) {
      return NextResponse.json({ error: 'Access not found' }, { status: 404 });
    }

    // Check permissions - owner/admin of org OR the individual user themselves
    const orgMembership = access.departmentAccount.organizationMemberships[0];
    if (!orgMembership) {
      return NextResponse.json({ error: 'Department not linked to organization' }, { status: 400 });
    }

    const isOrgOwner = await hasOrganizationAccess(user.id, orgMembership.organizationId, 'owner');
    const isSelf = user.id === individualUserId;

    if (!isOrgOwner && !isSelf) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Soft delete (revoke)
    await prisma.departmentAccess.update({
      where: { id: access.id },
      data: {
        revokedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Department access revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking department access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const departmentAccountId = url.searchParams.get('departmentAccountId');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (departmentAccountId) {
      // Get all accesses for a specific department account
      const departmentAccount = await prisma.user.findUnique({
        where: { id: departmentAccountId },
        include: {
          organizationMemberships: true
        }
      });

      const isDepartment = departmentAccount?.userType === ('DEPARTMENT' as const);
    if (!departmentAccount || !isDepartment) {
        return NextResponse.json({ error: 'Department account not found' }, { status: 404 });
      }

      const orgMembership = departmentAccount.organizationMemberships[0];
      if (!orgMembership) {
        return NextResponse.json({ error: 'Department not linked to organization' }, { status: 400 });
      }

      const hasAccess = await hasOrganizationAccess(user.id, orgMembership.organizationId, 'owner');
      if (!hasAccess) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      const accesses = await prisma.departmentAccess.findMany({
        where: {
          departmentAccountId,
          revokedAt: null
        },
        include: {
          individualUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          grantor: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          grantedAt: 'desc'
        }
      });

      return NextResponse.json({
        accesses: accesses.map(a => ({
          id: a.id,
          individualUser: a.individualUser,
          permissions: a.permissions as string[],
          grantedAt: a.grantedAt.toISOString(),
          grantedBy: a.grantor ? { name: a.grantor.name } : { name: 'Unknown' }
        }))
      });
    } else {
      // Get all department accesses for the current user
      const accesses = await prisma.departmentAccess.findMany({
        where: {
          individualUserId: user.id,
          revokedAt: null
        },
        include: {
          departmentAccount: {
            include: {
              organizationMemberships: {
                include: {
                  organization: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          grantedAt: 'desc'
        }
      });

      return NextResponse.json({
        accesses: accesses.map(a => ({
          id: a.id,
          departmentAccount: {
            id: a.departmentAccount.id,
            name: a.departmentAccount.name
          },
          organization: a.departmentAccount.organizationMemberships[0]?.organization,
          permissions: a.permissions,
          grantedAt: a.grantedAt
        }))
      });
    }

  } catch (error) {
    console.error('Error fetching department accesses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

