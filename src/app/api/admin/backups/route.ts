import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createBackupSchema = z.object({
  type: z.enum(['FULL', 'INCREMENTAL', 'SCHEMA_ONLY', 'DATA_ONLY']),
  description: z.string().max(500).optional(),
  retentionDays: z.number().int().min(1).max(365).default(30),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | null;
    const type = url.searchParams.get('type') as 'FULL' | 'INCREMENTAL' | 'SCHEMA_ONLY' | 'DATA_ONLY' | null;

    let where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const backups = await prisma.backup.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Get backup statistics
    const [
      totalBackups,
      totalSize,
      lastBackup,
      nextScheduledBackup
    ] = await Promise.all([
      prisma.backup.count(),
      prisma.backup.aggregate({
        _sum: { size: true }
      }),
      prisma.backup.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.backup.findFirst({
        where: { status: 'PENDING' },
        orderBy: { scheduledFor: 'asc' }
      })
    ]);

    return NextResponse.json({
      backups,
      statistics: {
        totalBackups,
        totalSize: totalSize._sum.size || 0,
        lastBackup,
        nextScheduledBackup
      }
    });
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createBackupSchema.parse(body);

    // Check if there's already a backup in progress
    const existingBackup = await prisma.backup.findFirst({
      where: { status: 'IN_PROGRESS' }
    });

    if (existingBackup) {
      return NextResponse.json({ error: 'Backup already in progress' }, { status: 400 });
    }

    // Create backup record
    const backup = await prisma.backup.create({
      data: {
        ...validatedData,
        status: 'PENDING',
        createdBy: session.user.id,
        scheduledFor: new Date(),
      }
    });

    // Start backup process (this would integrate with your backup service)
    // await startBackupProcess(backup.id, validatedData.type);

    return NextResponse.json({ backup }, { status: 201 });
  } catch (error) {
    console.error('Error creating backup:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const backupId = url.searchParams.get('id');
    const action = url.searchParams.get('action') as 'restore' | 'download' | 'delete' | 'schedule';

    if (!backupId || !action) {
      return NextResponse.json({ error: 'Backup ID and action are required' }, { status: 400 });
    }

    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    switch (action) {
      case 'restore':
        if (backup.status !== 'COMPLETED') {
          return NextResponse.json({ error: 'Can only restore completed backups' }, { status: 400 });
        }
        
        // Start restore process
        await prisma.backup.update({
          where: { id: backupId },
          data: { 
            status: 'IN_PROGRESS',
            restoredAt: new Date(),
            restoredBy: session.user.id
          }
        });
        
        // await startRestoreProcess(backupId);
        break;

      case 'download':
        if (backup.status !== 'COMPLETED') {
          return NextResponse.json({ error: 'Can only download completed backups' }, { status: 400 });
        }
        
        // Generate download URL
        const downloadUrl = `https://backups.impaktr.com/download/${backup.id}`;
        break;

      case 'delete':
        if (backup.status === 'IN_PROGRESS') {
          return NextResponse.json({ error: 'Cannot delete backup in progress' }, { status: 400 });
        }
        
        await prisma.backup.update({
          where: { id: backupId },
          data: { status: 'DELETED' }
        });
        break;

      case 'schedule':
        // Schedule recurring backup
        await prisma.backupSchedule.create({
          data: {
            backupId,
            frequency: 'daily',
            nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isActive: true,
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Backup ${action} initiated` });
  } catch (error) {
    console.error('Error updating backup:', error);
    return NextResponse.json({ error: 'Failed to update backup' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const backupId = url.searchParams.get('id');

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
    }

    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    if (backup.status === 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Cannot delete backup in progress' }, { status: 400 });
    }

    // Soft delete
    await prisma.backup.update({
      where: { id: backupId },
      data: { status: 'DELETED' }
    });

    return NextResponse.json({ success: true, message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 });
  }
}

