import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConnectionStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending connection requests sent to the user
    const receivedRequests = await prisma.connection.findMany({
      where: {
        addresseeId: session.user.id,
        status: ConnectionStatus.PENDING
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            image: true,
            tier: true,
            city: true,
            country: true,
            occupation: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get pending connection requests sent by the user
    const sentRequests = await prisma.connection.findMany({
      where: {
        requesterId: session.user.id,
        status: ConnectionStatus.PENDING
      },
      include: {
        addressee: {
          select: {
            id: true,
            name: true,
            image: true,
            tier: true,
            city: true,
            country: true,
            occupation: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      received: receivedRequests.map(req => ({
        id: req.id,
        user: req.requester,
        sentAt: req.createdAt
      })),
      sent: sentRequests.map(req => ({
        id: req.id,
        user: req.addressee,
        sentAt: req.createdAt
      })),
      receivedCount: receivedRequests.length,
      sentCount: sentRequests.length
    });
  } catch (error) {
    console.error('Error fetching pending connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending connections' },
      { status: 500 }
    );
  }
}

