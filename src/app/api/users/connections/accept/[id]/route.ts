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

    // Accept the connection
    await prisma.connection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.ACCEPTED }
    });

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

