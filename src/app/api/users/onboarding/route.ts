// home/ubuntu/impaktrweb/src/app/api/users/onboarding/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { User } from '@prisma/client';

const onboardingSchema = z.object({
  sdgFocus: z.array(z.number().min(1).max(17)).min(1, 'Please select at least one SDG').max(5, 'Maximum 5 SDGs allowed'),
  preferredActivities: z.array(z.string()).min(1, 'Please select at least one activity'),
  motivation: z.array(z.string()).min(1, 'Please select at least one motivation').max(3, 'Maximum 3 motivations allowed'),
  availability: z.object({
    hoursPerWeek: z.number().min(1).max(50),
    weekdayAvailable: z.boolean(),
    weekendAvailable: z.boolean(),
  }),
  impactGoal: z.object({
    targetHours: z.number().min(10).max(1000),
    targetPeriod: z.string(),
  }),
  verificationPreference: z.string().min(1, 'Please select a verification preference'),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean().optional(),
    badges: z.boolean(),
    events: z.boolean(),
    verifications: z.boolean(),
  }),
  privacy: z.object({
    publicProfile: z.boolean(),
    showProgress: z.boolean(),
    allowRecommendations: z.boolean(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = onboardingSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has already completed onboarding by checking if they have any achievements
    const existingAchievement = await prisma.achievement.findFirst({
      where: {
        userId: user.id,
        type: 'onboarding_complete'
      }
    });
    
    if (existingAchievement) {
      return NextResponse.json({ error: 'Onboarding already completed' }, { status: 400 });
    }

    // Update user with onboarding data
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        // Store onboarding data in user fields or create a separate onboarding record
        // For now, we'll just mark the user as having completed onboarding
      }
    });

    // Initialize progress for selected SDG badges
    const selectedSDGBadges = await prisma.badge.findMany({
      where: {
        category: { in: validatedData.sdgFocus.map(sdg => sdg.toString()) },
         rarity: 'SUPPORTER'
      }
    });

    // Create user badges for selected SDGs to show interest
    for (const badge of selectedSDGBadges) {
      await prisma.userBadge.create({
        data: {
          userId: user.id,
          badgeId: badge.id,
        },
      });
    }

    // Create onboarding completion achievement
    await prisma.achievement.create({
      data: {
        userId: user.id,
        type: 'onboarding_complete',
        title: 'Getting Started',
        description: 'Completed the Impaktr onboarding process',
        // icon: '/icons/onboarding-complete.svg', // icon field doesn't exist
        // data: { // data field doesn't exist
        //   selectedSDGs: validatedData.sdgFocus,
        //   activities: validatedData.preferredActivities,
        //   motivation: validatedData.motivation,
        //   completedAt: new Date().toISOString(),
        // }
      }
    });

    // Update score for completing onboarding
    const newScore = (user.impactScore || 0) + 10; // Bonus points for completing onboarding
    await prisma.user.update({
      where: { id: user.id },
      data: { impactScore: newScore }
    });

    // Send welcome notification
    // Note: In a real implementation, you might want to use a queue for this
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'welcome',
          title: 'Welcome to Impaktr!',
          message: `Welcome ${user.name}! You've earned your first 10 points for completing onboarding.`,
          data: {
            points: 10,
            sdgsSelected: validatedData.sdgFocus.length,
          }
        }),
      });
    } catch (notificationError) {
      console.error('Error sending welcome notification:', notificationError);
      // Don't fail the onboarding process if notification fails
    }

    // Generate recommendation preferences for future use
    const recommendations = {
      sdgFocus: validatedData.sdgFocus,
      activities: validatedData.preferredActivities,
      availability: validatedData.availability,
      location: user.location,
      skills: [], // Will be populated as user participates in events
      interests: validatedData.motivation,
    };

    // Store recommendations (could be in Redis or database)
    // For now, recommendations are only computed and could be stored separately if needed

    return NextResponse.json({ 
      success: true,
      user: user,
      message: 'Onboarding completed successfully!',
      pointsEarned: 10,
      redirectTo: '/dashboard'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid onboarding data', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    console.error('Error in user onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        badges: {
          include: { badge: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return onboarding status and any existing preferences
    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        location: user.location,
        bio: user.bio,
        country: user.country,
      },
      currentSDGProgress: user.badges.map(ub => ({
        sdgNumber: ub.badge.category,
        earnedAt: ub.earnedAt,
      })),
      recommendations: {
        // Suggest SDGs based on user's location, interests, etc.
        suggestedSDGs: getSuggestedSDGs(user),
        popularActivities: ['volunteering', 'donating', 'mentoring'],
      }
    });

  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to suggest SDGs based on user profile
function getSuggestedSDGs(user: User): number[] {
  const suggestions: number[] = [];
  
  // Suggest based on location (example logic)
  if (user.country === 'Malaysia') {
    suggestions.push(13, 15, 6); // Climate Action, Life on Land, Clean Water
  }
  
  // Suggest based on bio
  if (user.bio?.toLowerCase().includes('teacher')) {
    suggestions.push(4); // Quality Education
  }
  
  if (user.bio?.toLowerCase().includes('doctor') || 
      user.bio?.toLowerCase().includes('nurse')) {
    suggestions.push(3); // Good Health and Well-being
  }
  
  // Add some popular general SDGs
  suggestions.push(1, 2, 10); // No Poverty, Zero Hunger, Reduced Inequalities
  
  // Remove duplicates and limit to 5
  return [...new Set(suggestions)].slice(0, 5);
}