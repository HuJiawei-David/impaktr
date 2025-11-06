import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

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
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user has participated in this event
    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId
        }
      },
      include: {
        event: true
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'Event participation not found' }, { status: 404 });
    }

    const event = participation.event;

    // Get certificate config from certificateConfig JSON field or return defaults
    let certificateConfig = {
      certificateName: event.title,
      certificateContent: ''
    };

    try {
      // Try to get certificateConfig from the event
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

