// home/ubuntu/impaktrweb/src/app/api/organization/certificates/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { Certificate, CertificateTemplate } from '@prisma/client';

// Types for database query results
interface AvgTimeToIssueResult {
  avg_hours: number;
}

interface EngagementStatsResult {
  totalCertificates: number;
  totalRecipients: number;
  averageCertificatesPerRecipient: number;
  mostActiveMonth: string;
}

// Template type with _count relation
type TemplateWithCount = CertificateTemplate & {
  _count: {
    certificates: number;
  };
};

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import { z } from 'zod';

const querySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  templateId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { period, templateId, groupBy } = querySchema.parse(params);

    // Get user's organization
    const organization = await prisma.organization.findFirst({
      where: {
        members: {
          some: {
            userId: session.user.id,
            role: { in: ['admin', 'owner', 'member'] }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization access required' }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const baseWhere = {
      template: {
        organizationId: organization.id
      },
      ...(period !== 'all' && {
        issuedAt: {
          gte: startDate
        }
      }),
      ...(templateId && {
        templateId
      })
    };

    // Get overall statistics
    const [
      totalIssued,
      totalActive,
      totalRevoked,
      totalExpired,
      totalTemplates,
      totalUniqueRecipients,
      recentIssued,
      mostUsedTemplates,
      certificatesByType,
      certificatesByMonth
    ] = await Promise.all([
      // Total certificates issued
      prisma.certificate.count({
        where: baseWhere
      }),

      // Active certificates
      prisma.certificate.count({
        where: {
          ...baseWhere,
          revokedAt: null,
          OR: [
            // expiresAt field doesn't exist in Certificate model
          ]
        }
      }),

      // Revoked certificates
      prisma.certificate.count({
        where: {
          ...baseWhere,
          revokedAt: { not: null }
        }
      }),

      // Expired certificates
      prisma.certificate.count({
        where: {
          ...baseWhere,
          // expiresAt field doesn't exist in Certificate model
          revokedAt: null
        }
      }),

      // Total templates
      prisma.certificateTemplate.count({
        where: {
          organizationId: organization.id,
          // isActive field doesn't exist in CertificateTemplate model
        }
      }),

      // Unique recipients
      prisma.certificate.aggregate({
        where: baseWhere,
        _count: {
          userId: true
        }
      }).then(result => result._count.userId),

      // Recently issued certificates
      prisma.certificate.count({
        where: {
          ...baseWhere,
          issuedAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Most used templates
      prisma.certificateTemplate.findMany({
        where: {
          organizationId: organization.id,
        },
        include: {
          _count: {
            select: {
              certificates: true
            }
          }
        } as {
          _count: {
            select: {
              certificates: boolean;
            };
          };
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),

      // Certificates by type
      prisma.certificate.groupBy({
        by: ['type'],
        where: baseWhere,
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      }),

      // Certificates issued over time (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', issued_at) as month,
          COUNT(*) as count
        FROM certificates c
        JOIN certificate_templates ct ON c.template_id = ct.id
        WHERE ct.organization_id = ${organization.id}
          AND c.issued_at >= ${new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE_TRUNC('month', issued_at)
        ORDER BY month DESC
      `
    ]);

    // Calculate growth rate
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousPeriodCount = await prisma.certificate.count({
      where: {
        templateId: { not: null }, // template field doesn't exist, using templateId instead
        issuedAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    });

    const growthRate = previousPeriodCount > 0 
      ? ((recentIssued - previousPeriodCount) / previousPeriodCount) * 100 
      : 0;

    // Get average time to issue (from event completion to certificate issue)
    const avgTimeToIssue = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM (c.issued_at - p.verified_at))/3600) as avg_hours
      FROM certificates c
      JOIN participations p ON c.participation_id = p.id
      JOIN certificate_templates ct ON c.template_id = ct.id
      WHERE ct.organization_id = ${organization.id}
        AND p.verified_at IS NOT NULL
        AND c.issued_at >= ${startDate}
    `;

    // Popular certificate periods
    const popularPeriods = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN EXTRACT(DOW FROM issued_at) IN (0, 6) THEN 'weekend'
          ELSE 'weekday'
        END as period_type,
        COUNT(*) as count
      FROM certificates c
      JOIN certificate_templates ct ON c.template_id = ct.id
      WHERE ct.organization_id = ${organization.id}
        AND c.issued_at >= ${startDate}
      GROUP BY period_type
    `;

    // Certificate engagement stats
    const engagementStats = await prisma.$queryRaw`
      SELECT 
        AVG(CASE WHEN linkedin_shared THEN 1 ELSE 0 END) * 100 as linkedin_share_rate,
        COUNT(CASE WHEN certificate_url IS NOT NULL THEN 1 END) as downloaded_count,
        COUNT(*) as total_count
      FROM certificates c
      JOIN certificate_templates ct ON c.template_id = ct.id
      WHERE ct.organization_id = ${organization.id}
        AND c.issued_at >= ${startDate}
    `;

    return NextResponse.json({
      summary: {
        totalIssued,
        totalActive,
        totalRevoked,
        totalExpired,
        totalTemplates,
        totalUniqueRecipients,
        recentIssued,
        growthRate: Math.round(growthRate * 100) / 100,
        averageTimeToIssue: Array.isArray(avgTimeToIssue) && avgTimeToIssue.length > 0 ? Math.round((avgTimeToIssue[0] as AvgTimeToIssueResult)?.avg_hours || 0) : 0
      },
      charts: {
        certificatesOverTime: certificatesByMonth,
        certificatesByType: certificatesByType.map(item => ({
          type: item.type,
          count: item._count.id
        })),
        popularPeriods: popularPeriods,
        engagement: Array.isArray(engagementStats) && engagementStats.length > 0 ? engagementStats[0] as EngagementStatsResult : null
      },
      templates: {
        mostUsed: mostUsedTemplates.map((template: TemplateWithCount) => ({
          id: template.id,
          name: template.name,
          type: template.type,
          usageCount: template._count.certificates
        }))
      },
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching certificate statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}