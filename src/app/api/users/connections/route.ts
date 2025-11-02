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

    // Get all accepted connections
    const connections = await prisma.connection.findMany({
      where: {
        AND: [
          {
            OR: [
              { requesterId: session.user.id },
              { addresseeId: session.user.id }
            ]
          },
          { status: ConnectionStatus.ACCEPTED }
        ]
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
            occupation: true,
            userType: true
          }
        },
        addressee: {
          select: {
            id: true,
            name: true,
            image: true,
            tier: true,
            city: true,
            country: true,
            occupation: true,
            userType: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform to return the other user's info
    const transformedConnections = connections.map(conn => {
      const otherUser = conn.requesterId === session.user.id ? conn.addressee : conn.requester;
      return {
        id: conn.id,
        connectedAt: conn.updatedAt,
        user: otherUser
      };
    });

    return NextResponse.json({ 
      connections: transformedConnections,
      count: transformedConnections.length
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

