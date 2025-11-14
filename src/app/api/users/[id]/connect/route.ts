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

    const { id: targetUserId } = await params;

    // Can't connect to yourself
    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'Cannot connect to yourself' }, { status: 400 });
    }

    // Check if target user exists and is an individual
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, userType: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.userType !== 'INDIVIDUAL') {
      return NextResponse.json({ error: 'Can only connect with individual users' }, { status: 400 });
    }

    // Check if connection already exists (in either direction)
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: session.user.id }
        ]
      }
    });

    // Get requester user info for notifications
    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, image: true }
    });

    if (existingConnection) {
      if (existingConnection.status === ConnectionStatus.PENDING) {
        // If the other person sent a request, auto-accept it
        if (existingConnection.requesterId === targetUserId) {
          await prisma.connection.update({
            where: { id: existingConnection.id },
            data: { status: ConnectionStatus.ACCEPTED }
          });

          // Create notification for the requester that their request was accepted
          if (requester) {
            await prisma.notification.create({
              data: {
                userId: targetUserId, // The person who originally sent the request
                title: 'Connection Request Accepted',
                message: `${requester.name} accepted your connection request`,
                type: 'CUSTOM',
                data: {
                  connectionId: existingConnection.id,
                  requesterId: session.user.id,
                  requesterName: requester.name,
                  requesterImage: requester.image,
                  type: 'CONNECTION_ACCEPTED'
                },
                isRead: false,
              }
            });
          }

          return NextResponse.json({ 
            connectionStatus: 'ACCEPTED',
            message: 'Connection request accepted'
          });
        }
        // If we sent a request, cancel it
        await prisma.connection.delete({
          where: { id: existingConnection.id }
        });
        return NextResponse.json({ 
          connectionStatus: null,
          message: 'Connection request cancelled'
        });
      } else if (existingConnection.status === ConnectionStatus.ACCEPTED) {
        // Remove connection
        await prisma.connection.delete({
          where: { id: existingConnection.id }
        });
        return NextResponse.json({ 
          connectionStatus: null,
          message: 'Connection removed'
        });
      } else if (existingConnection.status === ConnectionStatus.REJECTED) {
        // Allow sending a new request after rejection
        await prisma.connection.update({
          where: { id: existingConnection.id },
          data: {
            requesterId: session.user.id,
            addresseeId: targetUserId,
            status: ConnectionStatus.PENDING
          }
        });

        // Create notification for the target user
        if (requester) {
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              title: 'New Connection Request',
              message: `${requester.name} wants to connect with you`,
              type: 'CUSTOM',
              data: {
                connectionId: existingConnection.id,
                requesterId: session.user.id,
                requesterName: requester.name,
                requesterImage: requester.image,
                type: 'CONNECTION_REQUEST'
              },
              isRead: false,
            }
          });
        }

        return NextResponse.json({ 
          connectionStatus: 'PENDING',
          message: 'Connection request sent'
        });
      }
    }

    // Create new connection request
    const connection = await prisma.connection.create({
      data: {
        requesterId: session.user.id,
        addresseeId: targetUserId,
        status: ConnectionStatus.PENDING
      }
    });

    // Check if a notification already exists for this connection request
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: targetUserId,
        type: 'CUSTOM',
        data: {
          path: ['connectionId'],
          equals: connection.id
        },
        AND: {
          data: {
            path: ['type'],
            equals: 'CONNECTION_REQUEST'
          }
        }
      }
    });

    // Only create notification if one doesn't already exist
    if (!existingNotification && requester) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'New Connection Request',
          message: `${requester.name} wants to connect with you`,
          type: 'CUSTOM',
          data: {
            connectionId: connection.id,
            requesterId: session.user.id,
            requesterName: requester.name,
            requesterImage: requester.image,
            type: 'CONNECTION_REQUEST'
          },
          isRead: false,
        }
      });
    }

    return NextResponse.json({ 
      connectionStatus: 'PENDING',
      message: 'Connection request sent'
    });
  } catch (error) {
    console.error('Error managing connection:', error);
    return NextResponse.json(
      { error: 'Failed to manage connection' },
      { status: 500 }
    );
  }
}

