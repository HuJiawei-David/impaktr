import { prisma } from './prisma';

/**
 * Check if a user has access to an organization (via direct membership or department access)
 * @param userId - The individual user's ID
 * @param organizationId - The organization ID
 * @param requiredRole - Minimum required role (default: 'admin')
 * @returns boolean indicating if user has access
 */
export async function hasOrganizationAccess(
  userId: string,
  organizationId: string,
  requiredRole: 'admin' | 'owner' = 'admin'
): Promise<boolean> {
  // Check 1: Direct membership
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
      status: 'active',
      role: requiredRole === 'owner' ? 'owner' : { in: ['admin', 'owner'] }
    }
  });

  if (membership) return true;

  // Check 2: Department access
  const departmentAccess = await prisma.departmentAccess.findFirst({
    where: {
      individualUserId: userId,
      revokedAt: null,
      departmentAccount: {
        organizationMemberships: {
          some: {
            organizationId,
            status: 'active'
          }
        },
        userType: 'DEPARTMENT' as any
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

  if (departmentAccess) {
    // Check permissions JSON contains required permissions
    const permissions = departmentAccess.permissions as string[] | null;
    if (permissions) {
      // If ADMIN_ACCESS is granted, allow all operations
      if (permissions.includes('ADMIN_ACCESS')) return true;
      // Otherwise check specific permissions
      if (requiredRole === 'admin') {
        return permissions.includes('CREATE_EVENTS') || permissions.includes('POST_OPPORTUNITIES');
      }
    } else {
      // Default permissions if none specified
      return true;
    }
  }

  return false;
}

/**
 * Get all organizations a user can access (via direct membership or department access)
 * @param userId - The individual user's ID
 * @returns Array of accessible organizations with metadata
 */
export async function getAccessibleOrganizations(userId: string): Promise<Array<{
  id: string;
  name: string;
  type: 'direct' | 'department';
  role?: string;
  departmentAccountId?: string;
  departmentAccountName?: string;
}>> {
  // Get direct memberships
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      status: 'active',
      role: { in: ['admin', 'owner'] }
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Get department accesses
  const departmentAccesses = await prisma.departmentAccess.findMany({
    where: {
      individualUserId: userId,
      revokedAt: null
    },
    include: {
      departmentAccount: {
        include: {
          organizationMemberships: {
            where: {
              status: 'active'
            },
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
    }
  });

  const directOrgs = memberships.map(m => ({
    id: m.organization.id,
    name: m.organization.name,
    type: 'direct' as const,
    role: m.role
  }));

  const deptOrgs = departmentAccesses.flatMap(da =>
    da.departmentAccount.organizationMemberships.map(om => ({
      id: om.organization.id,
      name: om.organization.name,
      type: 'department' as const,
      departmentAccountId: da.departmentAccountId,
      departmentAccountName: da.departmentAccount.name || undefined
    }))
  );

  // Combine and deduplicate by organization ID
  const allOrgs = [...directOrgs, ...deptOrgs];
  const uniqueOrgs = new Map<string, typeof allOrgs[0]>();
  
  for (const org of allOrgs) {
    const existing = uniqueOrgs.get(org.id);
    // Prefer direct membership over department access
    if (!existing || existing.type === 'department') {
      uniqueOrgs.set(org.id, org);
    }
  }

  return Array.from(uniqueOrgs.values());
}

/**
 * Get department accounts for a user (accounts they have access to)
 * @param userId - The individual user's ID
 * @returns Array of department accounts with access info
 */
export async function getUserDepartmentAccesses(userId: string): Promise<Array<{
  id: string;
  departmentAccountId: string;
  departmentAccountName: string;
  organizationId: string;
  organizationName: string;
  permissions: string[];
  grantedAt: Date;
}>> {
  const accesses = await prisma.departmentAccess.findMany({
    where: {
      individualUserId: userId,
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
    }
  });

  return accesses.flatMap(access => {
    const permissions = (access.permissions as string[] | null) || [];
    
    return access.departmentAccount.organizationMemberships.map(om => ({
      id: access.id,
      departmentAccountId: access.departmentAccountId,
      departmentAccountName: access.departmentAccount.name || 'Department Account',
      organizationId: om.organization.id,
      organizationName: om.organization.name,
      permissions,
      grantedAt: access.grantedAt
    }));
  });
}

/**
 * Check if a user has access to a specific department account
 * @param userId - The individual user's ID
 * @param departmentAccountId - The department account's ID
 * @returns DepartmentAccess record if access exists, null otherwise
 */
export async function hasDepartmentAccess(
  userId: string,
  departmentAccountId: string
): Promise<{
  id: string;
  permissions: string[];
  organizationId: string;
} | null> {
  const access = await prisma.departmentAccess.findFirst({
    where: {
      individualUserId: userId,
      departmentAccountId,
      revokedAt: null
    },
    include: {
      departmentAccount: {
        include: {
          organizationMemberships: {
            include: {
              organization: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!access) return null;

  const organizationId = access.departmentAccount.organizationMemberships[0]?.organization.id;
  if (!organizationId) return null;

  return {
    id: access.id,
    permissions: (access.permissions as string[] | null) || [],
    organizationId
  };
}

