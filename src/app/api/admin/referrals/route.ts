import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createReferralSchema = z.object({
  email: z.string().email(),
  message: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || session.user.id;

    // Check if user is admin or viewing their own referrals
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const isAdmin = user?.role === 'ADMIN';
    const isOwnReferrals = userId === session.user.id;

    if (!isAdmin && !isOwnReferrals) {
      return NextResponse.json({ error: 'Unauthorized to view referrals' }, { status: 403 });
    }

    // Get user's referral data
    const [referrals, referralStats, referralRewards] = await Promise.all([
      // Get all referrals made by this user
      prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referredUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
              tier: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Get referral statistics
      prisma.referral.aggregate({
        where: { referrerId: userId },
        _count: true,
        _sum: { rewardAmount: true }
      }),

      // Get referral rewards earned
      prisma.referralReward.findMany({
        where: { userId },
        include: {
          referral: {
            include: {
              referredUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Get user's referral code
    const userReferralCode = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true }
    });

    // Calculate additional stats
    const successfulReferrals = referrals.filter(r => r.status === 'COMPLETED').length;
    const pendingReferrals = referrals.filter(r => r.status === 'PENDING').length;
    const totalRewardsEarned = referralRewards.reduce((sum, reward) => sum + reward.amount, 0);

    return NextResponse.json({
      referralCode: userReferralCode?.referralCode,
      referrals,
      stats: {
        totalReferrals: referralStats._count,
        successfulReferrals,
        pendingReferrals,
        totalRewardsEarned,
        potentialRewards: referralStats._sum.rewardAmount || 0,
      },
      rewards: referralRewards,
    });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReferralSchema.parse(body);

    // Check if user has a referral code
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true }
    });

    if (!user?.referralCode) {
      return NextResponse.json({ error: 'User does not have a referral code' }, { status: 400 });
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Check if referral already exists for this email
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: session.user.id,
        email: validatedData.email
      }
    });

    if (existingReferral) {
      return NextResponse.json({ error: 'Referral already sent to this email' }, { status: 400 });
    }

    // Create referral
    const referral = await prisma.referral.create({
      data: {
        referrerId: session.user.id,
        email: validatedData.email,
        message: validatedData.message,
        status: 'PENDING',
        rewardAmount: 10, // $10 reward for successful referral
      }
    });

    // Send referral email (this would integrate with your email service)
    // await sendReferralEmail(validatedData.email, user.referralCode, validatedData.message);

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    console.error('Error creating referral:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const referralId = url.searchParams.get('id');
    const action = url.searchParams.get('action') as 'accept' | 'reject';

    if (!referralId || !action) {
      return NextResponse.json({ error: 'Referral ID and action are required' }, { status: 400 });
    }

    // Get referral details
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    // Check if user is the referrer or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const isAdmin = user?.role === 'ADMIN';
    const isReferrer = referral.referrerId === session.user.id;

    if (!isAdmin && !isReferrer) {
      return NextResponse.json({ error: 'Unauthorized to update referral' }, { status: 403 });
    }

    // Update referral status
    const status = action === 'accept' ? 'COMPLETED' : 'REJECTED';
    const updatedReferral = await prisma.referral.update({
      where: { id: referralId },
      data: { status },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        referredUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            tier: true,
          }
        }
      }
    });

    // If accepted, create reward for referrer
    if (action === 'accept') {
      await prisma.referralReward.create({
        data: {
          userId: referral.referrerId,
          referralId: referral.id,
          amount: referral.rewardAmount,
          type: 'REFERRAL_BONUS',
          status: 'PENDING',
        }
      });

      // Create notification for referrer
      await prisma.notification.create({
        data: {
          userId: referral.referrerId,
          type: 'REFERRAL_REWARD',
          title: 'Referral Reward Earned',
          message: `You've earned $${referral.rewardAmount} for successfully referring ${referral.email}.`,
          data: {
            referralId: referral.id,
            rewardAmount: referral.rewardAmount,
          }
        }
      });
    }

    return NextResponse.json({ referral: updatedReferral });
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}

