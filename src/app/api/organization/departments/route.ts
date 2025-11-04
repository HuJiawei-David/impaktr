import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasOrganizationAccess } from '@/lib/organization-permissions';
import bcrypt from 'bcryptjs';

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Valid email is required'),
});

const updateDepartmentSchema = z.object({
  departmentId: z.string().min(1),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this organization
    const hasAccess = await hasOrganizationAccess(user.id, organizationId, 'owner');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all department accounts for this organization
    const departments = await prisma.user.findMany({
      where: {
        userType: 'DEPARTMENT' as any,
        organizationMemberships: {
          some: {
            organizationId,
            status: 'active'
          }
        }
      },
      include: {
        organizationMemberships: {
          where: {
            organizationId
          }
        },
        departmentAccountsOwned: {
          where: {
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
            }
          }
        }
      }
    });

    return NextResponse.json({
      departments: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        email: dept.email,
        createdAt: dept.createdAt.toISOString(),
        activeAccesses: dept.departmentAccountsOwned.length
      }))
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, organizationId, email } = createDepartmentSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is owner/admin of the organization
    const hasAccess = await hasOrganizationAccess(user.id, organizationId, 'owner');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Only organization owners can create department accounts' }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Generate a random password (will be reset by owner/admin later)
    const randomPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Create department account
    const departmentAccount = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userType: 'DEPARTMENT' as any,
        isPublic: false,
        showEmail: false,
        showProgress: false,
        allowMessages: false
      }
    });

    // Add department account as member of organization
    await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: departmentAccount.id,
        role: 'admin',
        status: 'active'
      }
    });

    return NextResponse.json({
      department: {
        id: departmentAccount.id,
        name: departmentAccount.name,
        email: departmentAccount.email,
        createdAt: departmentAccount.createdAt
      },
      message: 'Department account created successfully. Password will need to be set by an administrator.'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating department account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateDepartmentSchema.parse(body);
    const { departmentId, ...updateData } = parsed;

    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get department account and check organization
    const department = await prisma.user.findUnique({
      where: { id: body.departmentId },
      include: {
        organizationMemberships: true
      }
    });

    const isDepartment = department?.userType === ('DEPARTMENT' as const);
    if (!department || !isDepartment) {
      return NextResponse.json({ error: 'Department account not found' }, { status: 404 });
    }

    // Check if user is owner of the organization
    const orgMembership = department.organizationMemberships[0];
    if (!orgMembership) {
      return NextResponse.json({ error: 'Department not linked to organization' }, { status: 400 });
    }

    const hasAccess = await hasOrganizationAccess(user.id, orgMembership.organizationId, 'owner');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update department account
    const updated = await prisma.user.update({
      where: { id: departmentId },
      data: updateData
    });

    return NextResponse.json({
      department: {
        id: updated.id,
        name: updated.name,
        email: updated.email
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating department account:', error);
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
    const departmentId = url.searchParams.get('departmentId');

    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get department account and check organization
    const department = await prisma.user.findUnique({
      where: { id: departmentId },
      include: {
        organizationMemberships: true
      }
    });

    const isDepartment = department?.userType === ('DEPARTMENT' as const);
    if (!department || !isDepartment) {
      return NextResponse.json({ error: 'Department account not found' }, { status: 404 });
    }

    // Check if user is owner of the organization
    const orgMembership = department.organizationMemberships[0];
    if (!orgMembership) {
      return NextResponse.json({ error: 'Department not linked to organization' }, { status: 400 });
    }

    const hasAccess = await hasOrganizationAccess(user.id, orgMembership.organizationId, 'owner');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Only organization owners can delete department accounts' }, { status: 403 });
    }

    // Check if department has any active events
    const activeEvents = await prisma.event.count({
      where: {
        organizerId: departmentId,
        status: { in: ['ACTIVE', 'UPCOMING'] }
      }
    });

    if (activeEvents > 0) {
      return NextResponse.json({
        error: `Cannot delete department account with ${activeEvents} active or upcoming events. Please reassign or cancel them first.`
      }, { status: 400 });
    }

    // Delete department account (cascade will handle related records)
    await prisma.user.delete({
      where: { id: departmentId }
    });

    return NextResponse.json({
      message: 'Department account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting department account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

