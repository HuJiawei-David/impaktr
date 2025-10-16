// home/ubuntu/impaktrweb/src/app/api/organizations/billing/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const userMembership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { 
        organization: {
          include: {
            members: true,
            events: true
          }
        }
      }
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'User not part of any organization' }, { status: 404 });
    }

    const organization = userMembership.organization;

    // Mock billing data (would come from Stripe in production)
    const billingData = {
      subscriptionTier: organization.subscriptionTier || 'STARTER',
      subscriptionStatus: organization.subscriptionStatus || 'active',
      currentPeriodEnd: organization.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxMembers: organization.maxMembers || 10,
      maxEvents: organization.maxEvents || 5,
      price: organization.subscriptionTier === 'ENTERPRISE' ? 99 : 
             organization.subscriptionTier === 'PROFESSIONAL' ? 49 : 19,
      currency: 'USD',
      features: organization.subscriptionTier === 'ENTERPRISE' ? [
        'Unlimited members',
        'Unlimited events',
        'Advanced analytics',
        'Custom branding',
        'Priority support',
        'API access'
      ] : organization.subscriptionTier === 'PROFESSIONAL' ? [
        'Up to 100 members',
        'Up to 50 events',
        'Basic analytics',
        'Custom branding',
        'Email support'
      ] : [
        'Up to 10 members',
        'Up to 5 events',
        'Basic analytics',
        'Community support'
      ],
      usage: {
        members: organization.members?.length || 0,
        events: organization.events?.length || 0,
        volunteerHours: organization.volunteerHours || 0,
      },
      invoices: [
        {
          id: 'inv_001',
          amount: organization.subscriptionTier === 'ENTERPRISE' ? 99 : 
                 organization.subscriptionTier === 'PROFESSIONAL' ? 49 : 19,
          currency: 'USD',
          status: 'paid',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          downloadUrl: '#'
        },
        {
          id: 'inv_002',
          amount: organization.subscriptionTier === 'ENTERPRISE' ? 99 : 
                 organization.subscriptionTier === 'PROFESSIONAL' ? 49 : 19,
          currency: 'USD',
          status: 'paid',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          downloadUrl: '#'
        }
      ]
    };

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      billing: billingData
    });

  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
