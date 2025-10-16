// home/ubuntu/impaktrweb/src/app/api/organizations/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: {
        organization: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  }
                }
              }
            },
            events: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                participations: {
                  select: { id: true }
                }
              }
            },
            badges: true,
            _count: {
              select: {
                members: true,
                events: true
              }
            }
          }
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization = membership.organization;

    // Calculate stats
    const totalVolunteerHours = organization.volunteerHours || 0;
    const impactScore = organization.averageImpactScore || 0;
    const badgesEarned = organization.badges?.length || 0;
    const certificatesIssued = 0; // TODO: Calculate actual certificates

    // Transform data to match frontend expectations
    const organizationProfile = {
      id: organization.id,
      name: organization.name,
      email: organization.email,
      website: organization.website,
      description: organization.description,
      industry: organization.industry,
      companySize: organization.companySize,
      country: organization.country,
      address: organization.address,
      city: organization.city,
      phone: organization.phone,
      logo: organization.logo,
      createdAt: organization.createdAt,
      stats: {
        totalMembers: organization._count?.members || 0,
        totalEvents: organization._count?.events || 0,
        totalVolunteerHours,
        impactScore,
        badgesEarned,
        certificatesIssued,
      },
      recentEvents: organization.events?.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location || '',
        status: event.status,
        participantCount: event.participations?.length || 0,
      })) || [],
      badges: organization.badges?.map(badge => ({
        id: badge.id,
        name: badge.badgeName,
        description: badge.badgeType,
        icon: 'award',
        tier: 'BRONZE',
        earnedAt: badge.earnedAt,
      })) || [],
      members: organization.members?.map(member => ({
        id: member.user.id,
        name: member.user.name || 'Unknown',
        email: member.user.email || '',
        role: member.role,
        joinedAt: member.joinedAt,
        avatar: member.user.image,
      })) || [],
    };

    return NextResponse.json({ organization: organizationProfile });
  } catch (error) {
    console.error('Error fetching organization profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Find user's organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { 
        userId: session.user.id,
        role: { in: ['ADMIN', 'OWNER'] } // Only admins can update profile
      },
      include: { organization: true }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found or insufficient permissions' }, { status: 404 });
    }

    // Update organization profile
    const updatedOrganization = await prisma.organization.update({
      where: { id: membership.organizationId },
      data: {
        name: body.name,
        email: body.email,
        website: body.website,
        description: body.description,
        industry: body.industry,
        companySize: body.companySize,
        country: body.country,
        address: body.address,
        city: body.city,
        phone: body.phone,
      }
    });

    return NextResponse.json({ organization: updatedOrganization });
  } catch (error) {
    console.error('Error updating organization profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}