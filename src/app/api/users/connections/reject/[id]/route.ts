import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConnectionStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: connectionId } = await params;

    // Find the connection request
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection request not found' }, { status: 404 });
    }

    // Verify that the current user is the addressee
    if (connection.addresseeId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to reject this request' }, { status: 403 });
    }

    // Verify the connection is pending
    if (connection.status !== ConnectionStatus.PENDING) {
      return NextResponse.json({ error: 'Connection request is not pending' }, { status: 400 });
    }

    // Reject the connection (or just delete it)
    await prisma.connection.delete({
      where: { id: connectionId }
    });

    // Mark all connection request notifications for this connection as read
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        type: 'CUSTOM',
        data: {
          path: ['connectionId'],
          equals: connectionId
        },
        AND: {
          data: {
            path: ['type'],
            equals: 'CONNECTION_REQUEST'
          }
        }
      },
      data: {
        isRead: true
      }
    });

    // Delete all connection request notifications for this connection
    await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
        type: 'CUSTOM',
        data: {
          path: ['connectionId'],
          equals: connectionId
        },
        AND: {
          data: {
            path: ['type'],
            equals: 'CONNECTION_REQUEST'
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Connection rejected'
    });
  } catch (error) {
    console.error('Error rejecting connection:', error);
    return NextResponse.json(
      { error: 'Failed to reject connection' },
      { status: 500 }
    );
  }
}

