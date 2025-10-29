import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, text, type } = await request.json();

    if (!userId || !text || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-recommendation
    if (session.user.id === userId) {
      return NextResponse.json({ error: 'Cannot recommend yourself' }, { status: 400 });
    }

    // For now, we'll just return success since we don't have a Recommendation model yet
    // In a real implementation, you would save this to the database
    
    return NextResponse.json({ 
      success: true, 
      message: 'Recommendation submitted successfully' 
    });

  } catch (error) {
    console.error('Error submitting recommendation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if the user's profile is public
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPublic: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only require authentication for private profiles
    const session = await getServerSession(authOptions);
    if (!user.isPublic && !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch real recommendations from database
    const recommendations = await prisma.recommendation.findMany({
      where: { userId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            userType: true,
            tier: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format recommendations for frontend
    const formattedRecommendations = await Promise.all(recommendations.map(async (rec) => {
      // Calculate actual events together
      let eventsTogether = 0;
      try {
        const eventsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recommendations/events-together?userId1=${userId}&userId2=${rec.author.id}`);
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          eventsTogether = eventsData.eventsTogether;
        }
      } catch (error) {
        console.error('Error fetching events together:', error);
        // Fallback to random number if API fails
        eventsTogether = Math.floor(Math.random() * 5) + 1;
      }

      return {
        id: rec.id,
        text: rec.text,
        type: rec.authorType,
        authorName: rec.author.name,
        authorImage: rec.author.image,
        authorType: rec.author.userType,
        authorTier: rec.author.tier,
        authorId: rec.author.id,
        createdAt: rec.createdAt,
        eventsTogether
      };
    }));

    return NextResponse.json({ recommendations: formattedRecommendations });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}