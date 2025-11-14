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
      return NextResponse.json({ error: 'Unauthorized to accept this request' }, { status: 403 });
    }

    // Verify the connection is pending
    if (connection.status !== ConnectionStatus.PENDING) {
      return NextResponse.json({ error: 'Connection request is not pending' }, { status: 400 });
    }

    // Get requester info
    const requester = await prisma.user.findUnique({
      where: { id: connection.requesterId },
      select: { id: true, name: true, image: true }
    });

    // Get accepter info
    const accepter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, image: true }
    });

    // Accept the connection
    await prisma.connection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.ACCEPTED }
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

    // Delete duplicate connection request notifications for this connection
    const connectionRequestNotifications = await prisma.notification.findMany({
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

    // Keep only the first one, delete the rest
    if (connectionRequestNotifications.length > 1) {
      const idsToDelete = connectionRequestNotifications.slice(1).map(n => n.id);
      await prisma.notification.deleteMany({
        where: {
          id: {
            in: idsToDelete
          }
        }
      });
    }

    // Create notification for the requester that their request was accepted
    if (requester && accepter) {
      await prisma.notification.create({
        data: {
          userId: connection.requesterId,
          title: 'Connection Request Accepted',
          message: `${accepter.name} accepted your connection request`,
          type: 'CUSTOM',
          data: {
            connectionId: connectionId,
            requesterId: session.user.id,
            requesterName: accepter.name,
            requesterImage: accepter.image,
            type: 'CONNECTION_ACCEPTED'
          },
          isRead: false,
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Connection accepted'
    });
  } catch (error) {
    console.error('Error accepting connection:', error);
    return NextResponse.json(
      { error: 'Failed to accept connection' },
      { status: 500 }
    );
  }
}

