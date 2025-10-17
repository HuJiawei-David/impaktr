import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { calculateESGScore } from '@/lib/esg-calculator';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const period = searchParams.get('period') || 'annual';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const esgMetrics = await calculateESGScore(organizationId, period);

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        period,
        calculatedAt: new Date().toISOString(),
        metrics: esgMetrics,
        breakdown: {
          environmental: {
            weight: 40,
            score: esgMetrics.environmental.total,
            sdgs: {
              'Clean Water & Sanitation': esgMetrics.environmental.sdg6,
              'Affordable & Clean Energy': esgMetrics.environmental.sdg7,
              'Sustainable Cities & Communities': esgMetrics.environmental.sdg11,
              'Responsible Consumption & Production': esgMetrics.environmental.sdg12,
              'Climate Action': esgMetrics.environmental.sdg13,
              'Life Below Water': esgMetrics.environmental.sdg14,
              'Life on Land': esgMetrics.environmental.sdg15
            }
          },
          social: {
            weight: 35,
            score: esgMetrics.social.total,
            sdgs: {
              'No Poverty': esgMetrics.social.sdg1,
              'Zero Hunger': esgMetrics.social.sdg2,
              'Good Health & Well-Being': esgMetrics.social.sdg3,
              'Quality Education': esgMetrics.social.sdg4,
              'Gender Equality': esgMetrics.social.sdg5,
              'Decent Work & Economic Growth': esgMetrics.social.sdg8,
              'Reduced Inequalities': esgMetrics.social.sdg10
            }
          },
          governance: {
            weight: 25,
            score: esgMetrics.governance.total,
            sdgs: {
              'Peace, Justice & Strong Institutions': esgMetrics.governance.sdg16,
              'Partnerships for the Goals': esgMetrics.governance.sdg17,
              'Sustainability Reporting': esgMetrics.governance.sdg12_6
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('ESG calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ESG metrics' },
      { status: 500 }
    );
  }
}
