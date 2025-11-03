import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const certificateConfigSchema = z.object({
  certificateName: z.string().min(1),
  certificateContent: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find organizations where user is admin or owner
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs that user has admin access to
    const organizationIds = adminMemberships.map(m => m.organization.id);

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId: { in: organizationIds }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get certificate config from certificateConfig JSON field or return defaults
    let certificateConfig = {
      certificateName: event.title,
      certificateContent: ''
    };

    try {
      // Try to get certificateConfig from the event
      // Use raw query to handle the column that might not exist in Prisma schema
      const result = await prisma.$queryRawUnsafe<Array<{ certificateConfig: any }>>(
        `SELECT "certificateConfig" FROM "events" WHERE id = $1`,
        eventId
      );

      if (result && result.length > 0 && result[0].certificateConfig) {
        const parsed = typeof result[0].certificateConfig === 'string' 
          ? JSON.parse(result[0].certificateConfig) 
          : result[0].certificateConfig;
        certificateConfig = {
          certificateName: parsed.certificateName || event.title,
          certificateContent: parsed.certificateContent || ''
        };
      }
    } catch (e) {
      // Use defaults if column doesn't exist or parsing fails
      console.log('Certificate config column may not exist yet, using defaults');
    }

    return NextResponse.json({ certificateConfig });

  } catch (error) {
    console.error('Error fetching certificate config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { certificateName, certificateContent } = certificateConfigSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find organizations where user is admin or owner
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs that user has admin access to
    const organizationIds = adminMemberships.map(m => m.organization.id);

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId: { in: organizationIds }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Store certificate config in a JSON field
    // We'll use raw SQL to handle the certificateConfig column
    // First, try to add the column if it doesn't exist (using IF NOT EXISTS for PostgreSQL)
    const certificateConfig = JSON.stringify({
      certificateName,
      certificateContent
    });

    try {
      // Try to add the column if it doesn't exist (PostgreSQL specific)
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'events' AND column_name = 'certificateConfig'
          ) THEN
            ALTER TABLE "events" ADD COLUMN "certificateConfig" jsonb;
          END IF;
        END $$;
      `);
      
      // Update event with certificate config
      await prisma.$executeRaw`
        UPDATE "events"
        SET "certificateConfig" = ${certificateConfig}::jsonb
        WHERE id = ${eventId}
      `;
    } catch (e) {
      console.error('Error updating certificate config:', e);
      // Fallback: try direct update (assuming column exists)
      try {
        await prisma.$executeRaw`
          UPDATE "events"
          SET "certificateConfig" = ${certificateConfig}::jsonb
          WHERE id = ${eventId}
        `;
      } catch (fallbackError) {
        console.error('Fallback update also failed:', fallbackError);
        throw new Error('Failed to save certificate configuration');
      }
    }

    return NextResponse.json({ 
      success: true,
      certificateConfig: {
        certificateName,
        certificateContent
      }
    });

  } catch (error) {
    console.error('Error saving certificate config:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

