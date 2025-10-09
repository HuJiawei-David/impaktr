// home/ubuntu/impaktrweb/src/app/api/organization/certificates/templates/[id]/toggle/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const toggleSchema = z.object({
  isActive: z.boolean(),
  notes: z.string().optional(),
});

// Note: This assumes you have a CertificateTemplate model in your Prisma schema
// If you don't have this model yet, you'll need to add it:
/*
model CertificateTemplate {
  id            String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name          String
  description   String?
  templateData  Json     // Store template design and fields
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)
  createdBy     String
  createdByUser User     @relation(fields: [createdBy], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  certificates  Certificate[]
  
  @@map("certificate_templates")
}
*/

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    }

    const body = await request.json();
    const { isActive, notes } = toggleSchema.parse(body);

    // Find the user in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has organization admin permissions
    const adminMembership = user.memberships.find(m => 
      m.role === 'admin' || m.role === 'owner'
    );

    if (!adminMembership) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Organization admin access required.' 
      }, { status: 403 });
    }

    const organization = adminMembership.organization;

    // Since we don't have CertificateTemplate model yet, let's work with a simulated approach
    // In a real implementation, you'd query the CertificateTemplate model
    
    // For now, let's assume we're managing template status through a JSON field or separate table
    // Here's what the query would look like with a proper CertificateTemplate model:
    
    /*
    const template = await prisma.certificateTemplate.findUnique({
      where: { 
        id: id,
        organizationId: organization.id // Ensure template belongs to user's org
      }
    });

    if (!template) {
      return NextResponse.json({ 
        error: 'Certificate template not found or access denied' 
      }, { status: 404 });
    }

    const updatedTemplate = await prisma.certificateTemplate.update({
      where: { id },
      data: {
        isActive,
        updatedAt: new Date()
      }
    });
    */

    const { id } = await params;

    // Temporary implementation - using a mock response
    // Replace this with actual database operations when you add the CertificateTemplate model
    
    const mockTemplate = {
      id: id,
      organizationId: organization.id,
      name: 'Participation Certificate Template',
      isActive: isActive,
      updatedAt: new Date(),
      updatedBy: user.id
    };

    // Log the template toggle for audit trail
    console.log('Certificate template toggled:', {
      templateId: id,
      organizationId: organization.id,
      organizationName: organization.name,
      toggledBy: user.email,
      newStatus: isActive ? 'active' : 'inactive',
      notes,
      timestamp: new Date().toISOString()
    });

    // If deactivating a template, optionally warn about existing certificates using it
    if (!isActive) {
      // Count certificates using this template
      const certificatesUsingTemplate = await prisma.certificate.count({
        where: { 
          templateId: id 
        }
      });

      if (certificatesUsingTemplate > 0) {
        return NextResponse.json({
          success: true,
          message: `Template deactivated successfully`,
          template: mockTemplate,
          warning: `${certificatesUsingTemplate} existing certificates are using this template. They will remain valid but new certificates cannot be issued with this template.`
        });
      }
    }

    // If activating a template and setting as default
    if (isActive && body.setAsDefault) {
      // Deactivate other default templates for this organization
      /*
      await prisma.certificateTemplate.updateMany({
        where: {
          organizationId: organization.id,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      });

      updatedTemplate = await prisma.certificateTemplate.update({
        where: { id },
        data: {
          isActive: true,
          isDefault: true
        }
      });
      */
    }

    return NextResponse.json({
      success: true,
      message: `Template ${isActive ? 'activated' : 'deactivated'} successfully`,
      template: mockTemplate
    });

  } catch (error) {
    console.error('Error toggling certificate template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during template toggle' },
      { status: 500 }
    );
  }
}

// GET method to retrieve template status and details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const adminMembership = user.memberships.find(m => 
      m.role === 'admin' || m.role === 'owner'
    );

    if (!adminMembership) {
      return NextResponse.json({ 
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    const { id } = await params;

    // Mock template data - replace with actual database query
    const mockTemplate = {
      id: id,
      organizationId: adminMembership.organization.id,
      name: 'Participation Certificate Template',
      description: 'Standard template for event participation certificates',
      isActive: true,
      isDefault: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      createdBy: user.id,
      usageCount: 45, // Number of certificates issued with this template
      templateData: {
        layout: 'modern',
        colorScheme: 'blue',
        includeQRCode: true,
        includeSignature: true,
        customFields: ['event_name', 'completion_date', 'hours_completed']
      }
    };

    return NextResponse.json({
      template: mockTemplate
    });

  } catch (error) {
    console.error('Error retrieving certificate template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT method to update template details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    }

    const body = await request.json();
    const updateData = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      templateData: z.object({}).optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }).parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const adminMembership = user.memberships.find(m => 
      m.role === 'admin' || m.role === 'owner'
    );

    if (!adminMembership) {
      return NextResponse.json({ 
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    const { id } = await params;

    // Mock update response - replace with actual database update
    const updatedTemplate = {
      id: id,
      organizationId: adminMembership.organization.id,
      ...updateData,
      updatedAt: new Date(),
      updatedBy: user.id
    };

    console.log('Certificate template updated:', {
      templateId: id,
      updatedBy: user.email,
      changes: updateData,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      template: updatedTemplate
    });

  } catch (error) {
    console.error('Error updating certificate template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}