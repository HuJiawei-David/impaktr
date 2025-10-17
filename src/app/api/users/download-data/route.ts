import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        participations: {
          include: {
            event: {
              select: {
                title: true,
                description: true,
                startDate: true,
                endDate: true,
              }
            }
          }
        },
        achievements: true,
        badges: {
          include: {
            badge: true
          }
        },
        scoreHistory: true,
        posts: true,
        comments: true,
        saves: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { password, ...userData } = user;

    // Create downloadable JSON
    const exportData = {
      exportDate: new Date().toISOString(),
      profile: userData,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonString);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="impaktr-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error downloading user data:', error);
    return NextResponse.json(
      { error: 'Failed to download data' },
      { status: 500 }
    );
  }
}

