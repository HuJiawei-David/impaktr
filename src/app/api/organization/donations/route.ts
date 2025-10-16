import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createDonationSchema = z.object({
  campaignId: z.string(),
  amount: z.number().positive().optional(),
  hours: z.number().positive().optional(),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');
    const organizationId = url.searchParams.get('organizationId');
    const donorId = url.searchParams.get('donorId');

    let where: any = {};

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (organizationId) {
      // Check if donor is member of the organization
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: session.user.id,
          organizationId,
          status: 'active'
        }
      });

      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized to view donations' }, { status: 403 });
      }

      where.campaign = {
        organizationId
      };
    }

    if (donorId) {
      where.donorId = donorId;
    }

    const donations = await prisma.donation.findMany({
      where,
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            image: true,
            tier: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ donations });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDonationSchema.parse(body);

    // Verify campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: validatedData.campaignId },
      include: {
        organization: true
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 });
    }

    // Check if campaign has ended
    if (campaign.endDate && new Date() > new Date(campaign.endDate)) {
      return NextResponse.json({ error: 'Campaign has ended' }, { status: 400 });
    }

    // Validate donation amount
    if (!validatedData.amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // Validate hours for volunteer campaigns
    if (!validatedData.hours) {
      return NextResponse.json({ error: 'Hours are required for volunteer campaigns' }, { status: 400 });
    }

    // Create donation
    const donation = await prisma.donation.create({
      data: {
        organizationId: campaign.organizationId,
        donorId: session.user.id,
        amount: validatedData.amount || 0,
        status: 'PENDING',
      },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            image: true,
            tier: true,
          }
        }
      }
    });

    // Update campaign progress
    // Calculate total donations for the organization
    const totalDonations = await prisma.donation.count({
      where: {
        organizationId: campaign.organizationId,
        status: 'COMPLETED'
      }
    });

    const totalAmount = await prisma.donation.aggregate({
      where: {
        organizationId: campaign.organizationId,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });

    // Calculate progress based on total amount
    const progress = campaign.goal ? Math.min((Number(totalAmount._sum.amount || 0) / Number(campaign.goal)) * 100, 100) : 0;
    
    // Check if campaign goal is reached
    const isGoalReached = campaign.goal ? Number(totalAmount._sum.amount || 0) >= Number(campaign.goal) : false;

    // Update campaign status if goal is reached
    if (isGoalReached && campaign.status === 'ACTIVE') {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'COMPLETED' }
      });
    }

    // Create notification for organization
    await prisma.notification.create({
      data: {
        userId: campaign.organizationId, // This should be the organization owner
        type: 'DONATION',
        title: 'New Donation Received',
        message: `${session.user.name} has made a donation to your campaign "${campaign.title}".`,
        data: {
          campaignId: campaign.id,
          donationId: donation.id,
          amount: validatedData.amount,
        }
      }
    });

    return NextResponse.json({ donation }, { status: 201 });
  } catch (error) {
    console.error('Error creating donation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const donationId = url.searchParams.get('id');
    const action = url.searchParams.get('action') as 'approve' | 'reject';

    if (!donationId || !action) {
      return NextResponse.json({ error: 'Donation ID and action are required' }, { status: 400 });
    }

    // Get donation details
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        }
      }
    });

    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    // Check if donor is admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: donation.organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to manage donations' }, { status: 403 });
    }

    // Update donation status
    const status = action === 'approve' ? 'COMPLETED' : 'FAILED';
    const updatedDonation = await prisma.donation.update({
      where: { id: donationId },
      data: { status },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            image: true,
            tier: true,
          }
        }
      }
    });

    // Create notification for donor
    await prisma.notification.create({
      data: {
        userId: donation.donorId || '',
        type: 'DONATION',
        title: action === 'approve' ? 'Donation Approved' : 'Donation Failed',
        message: `Your donation has been ${action === 'approve' ? 'approved' : 'failed'}.`,
        data: {
          donationId: donation.id,
          action,
        }
      }
    });

    return NextResponse.json({ donation: updatedDonation });
  } catch (error) {
    console.error('Error updating donation:', error);
    return NextResponse.json({ error: 'Failed to update donation' }, { status: 500 });
  }
}
