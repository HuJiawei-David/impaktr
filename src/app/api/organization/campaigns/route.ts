import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  type: z.enum(['VOLUNTEER', 'DONATION', 'AWARENESS', 'FUNDRAISING']),
  goal: z.number().positive().optional(),
  goalType: z.enum(['VOLUNTEERS', 'HOURS', 'AMOUNT', 'REACH']).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  sdg: z.string().optional(),
});

const updateCampaignSchema = createCampaignSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const status = url.searchParams.get('status') as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | null;
    const type = url.searchParams.get('type') as 'VOLUNTEER' | 'DONATION' | 'AWARENESS' | 'FUNDRAISING' | null;

    let where: any = {};

    if (organizationId) {
      // Check if user is member of the organization
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: session.user.id,
          organizationId,
          status: 'active'
        }
      });

      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized to view campaigns' }, { status: 403 });
      }

      where.organizationId = organizationId;
    } else {
      // Public campaigns only
      where.isPublic = true;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            type: true,
          }
        },
        _count: {
          select: {
            events: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate campaign progress
    const enrichedCampaigns = campaigns.map(campaign => {
      // Calculate progress based on events count (simplified)
      const currentValue = campaign._count.events;
      const goalValue = campaign.goal ? parseInt(campaign.goal) : 10; // Default goal
      const progress = goalValue > 0 ? Math.min((currentValue / goalValue) * 100, 100) : 0;

      return {
        ...campaign,
        progress: Math.round(progress),
        currentValue,
        goalValue
      };
    });

    return NextResponse.json({ campaigns: enrichedCampaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCampaignSchema.parse(body);

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user is admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to create campaigns' }, { status: 403 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...validatedData,
        goal: validatedData.goal?.toString() || null,
        organizationId: organizationId,
        status: 'ACTIVE',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            type: true,
          }
        }
      }
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const campaignId = url.searchParams.get('id');

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateCampaignSchema.parse(body);

    // Check if user is admin of the organization that owns the campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        organization: true
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: campaign.organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to update campaign' }, { status: 403 });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...validatedData,
        goal: validatedData.goal?.toString() || undefined,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            type: true,
          }
        }
      }
    });

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const campaignId = url.searchParams.get('id');

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // Check if user is admin of the organization that owns the campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        organization: true
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: campaign.organizationId,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized to delete campaign' }, { status: 403 });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ success: true, message: 'Campaign cancelled successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
