// home/ubuntu/impaktrweb/src/app/api/organizations/esg/route.ts

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
      include: { organization: true }
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'User not part of any organization' }, { status: 404 });
    }

    const organization = userMembership.organization;

    // Calculate ESG scores (mock data for now - would be calculated from actual metrics)
    const esgData = {
      environmental: {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        carbonFootprint: Math.floor(Math.random() * 1000) + 500, // 500-1500 kg CO₂
        wasteReduction: Math.floor(Math.random() * 30) + 20, // 20-50%
        energyEfficiency: Math.floor(Math.random() * 40) + 40, // 40-80%
        renewableEnergy: Math.floor(Math.random() * 50) + 30, // 30-80%
      },
      social: {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        employeeSatisfaction: Math.floor(Math.random() * 30) + 70, // 70-100%
        communityImpact: Math.floor(Math.random() * 500) + 200, // 200-700 pts
        diversityIndex: Math.floor(Math.random() * 40) + 50, // 50-90%
        volunteerHours: organization.volunteerHours || 0,
      },
      governance: {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        transparency: Math.floor(Math.random() * 30) + 70, // 70-100%
        ethicsCompliance: Math.floor(Math.random() * 20) + 80, // 80-100%
        stakeholderEngagement: Math.floor(Math.random() * 30) + 60, // 60-90%
        riskManagement: Math.floor(Math.random() * 30) + 70, // 70-100%
      },
      overallScore: 0, // Will be calculated
      achievements: [
        {
          id: '1',
          title: 'Carbon Neutral Event',
          description: 'Hosted first carbon-neutral volunteer event',
          category: 'environmental' as const,
          earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          title: 'Community Impact Leader',
          description: 'Reached 1000+ volunteer hours milestone',
          category: 'social' as const,
          earnedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          title: 'Transparency Champion',
          description: 'Published comprehensive impact report',
          category: 'governance' as const,
          earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      goals: [
        {
          id: '1',
          title: 'Reduce Carbon Footprint',
          description: 'Achieve 25% reduction in carbon emissions',
          target: 1000,
          current: 750,
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'environmental' as const,
        },
        {
          id: '2',
          title: 'Increase Volunteer Participation',
          description: 'Reach 80% member participation rate',
          target: 80,
          current: 65,
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'social' as const,
        },
        {
          id: '3',
          title: 'Enhance Stakeholder Engagement',
          description: 'Improve stakeholder satisfaction to 90%',
          target: 90,
          current: 75,
          deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'governance' as const,
        },
      ],
    };

    // Calculate overall score
    esgData.overallScore = Math.round(
      (esgData.environmental.score + esgData.social.score + esgData.governance.score) / 3
    );

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      esgData
    });

  } catch (error) {
    console.error('Error fetching ESG data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}