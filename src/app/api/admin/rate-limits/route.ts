import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRateLimitSchema = z.object({
  endpoint: z.string().min(1).max(200),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  limit: z.number().int().min(1).max(10000),
  windowMs: z.number().int().min(1000).max(86400000), // 1 second to 24 hours
  message: z.string().max(500).optional(),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
});

const updateRateLimitSchema = createRateLimitSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');
    const method = url.searchParams.get('method');
    const isActive = url.searchParams.get('isActive') === 'true';

    let where: any = {};

    if (endpoint) {
      where.endpoint = { contains: endpoint, mode: 'insensitive' };
    }

    if (method) {
      where.method = method;
    }

    if (isActive !== null) {
      where.isActive = isActive;
    }

    const rateLimits = await prisma.rateLimit.findMany({
      where,
      orderBy: [
        { endpoint: 'asc' },
        { method: 'asc' }
      ]
    });

    // Get rate limit statistics
    const [
      totalRateLimits,
      activeRateLimits,
      rateLimitViolations,
      topViolatedEndpoints
    ] = await Promise.all([
      prisma.rateLimit.count(),
      prisma.rateLimit.count({ where: { isActive: true } }),
      prisma.rateLimitViolation.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.rateLimitViolation.groupBy({
        by: ['endpoint'],
        _count: { endpoint: true },
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10
      })
    ]);

    return NextResponse.json({
      rateLimits,
      statistics: {
        totalRateLimits,
        activeRateLimits,
        rateLimitViolations,
        topViolatedEndpoints
      }
    });
  } catch (error) {
    console.error('Error fetching rate limits:', error);
    return NextResponse.json({ error: 'Failed to fetch rate limits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createRateLimitSchema.parse(body);

    // Check if rate limit already exists for this endpoint and method
    const existingRateLimit = await prisma.rateLimit.findFirst({
      where: {
        endpoint: validatedData.endpoint,
        method: validatedData.method
      }
    });

    if (existingRateLimit) {
      return NextResponse.json({ error: 'Rate limit already exists for this endpoint and method' }, { status: 400 });
    }

    const rateLimit = await prisma.rateLimit.create({
      data: {
        ...validatedData,
        isActive: true,
        createdBy: session.user.id,
      }
    });

    return NextResponse.json({ rateLimit }, { status: 201 });
  } catch (error) {
    console.error('Error creating rate limit:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create rate limit' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const rateLimitId = url.searchParams.get('id');

    if (!rateLimitId) {
      return NextResponse.json({ error: 'Rate limit ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateRateLimitSchema.parse(body);

    const rateLimit = await prisma.rateLimit.update({
      where: { id: rateLimitId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ rateLimit });
  } catch (error) {
    console.error('Error updating rate limit:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update rate limit' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const rateLimitId = url.searchParams.get('id');

    if (!rateLimitId) {
      return NextResponse.json({ error: 'Rate limit ID is required' }, { status: 400 });
    }

    // Soft delete by deactivating
    await prisma.rateLimit.update({
      where: { id: rateLimitId },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: 'Rate limit deactivated successfully' });
  } catch (error) {
    console.error('Error deleting rate limit:', error);
    return NextResponse.json({ error: 'Failed to delete rate limit' }, { status: 500 });
  }
}

// Rate limit violation monitoring
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '24h'; // 1h, 24h, 7d, 30d

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [
      violationTrends,
      topViolators,
      endpointViolations,
      recentViolations
    ] = await Promise.all([
      // Violation trends over time
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', "createdAt") as hour,
          COUNT(*) as violations,
          COUNT(DISTINCT "userId") as unique_users
        FROM "rate_limit_violations" 
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('hour', "createdAt")
        ORDER BY hour ASC
      `,
      
    // Top violators
    prisma.$queryRaw`
      SELECT 
        rlv."userId",
        u."name",
        u."email",
        COUNT(*) as violation_count
      FROM "rate_limit_violations" rlv
      LEFT JOIN "users" u ON rlv."userId" = u."id"
      WHERE rlv."createdAt" >= ${startDate}
      GROUP BY rlv."userId", u."name", u."email"
      ORDER BY violation_count DESC
      LIMIT 10
    `,
      
      // Endpoint violations
      prisma.rateLimitViolation.groupBy({
        by: ['endpoint'],
        _count: { endpoint: true },
        where: { createdAt: { gte: startDate } },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10
      }),
      
    // Recent violations
    prisma.$queryRaw`
      SELECT 
        rlv."timestamp",
        rlv."endpoint",
        rlv."method",
        rlv."ipAddress",
        rlv."userAgent",
        u."name",
        u."email"
      FROM "rate_limit_violations" rlv
      LEFT JOIN "users" u ON rlv."userId" = u."id"
      WHERE rlv."createdAt" >= ${startDate}
      ORDER BY rlv."timestamp" DESC
      LIMIT 20
    `
    ]);

    return NextResponse.json({
      violationTrends,
      topViolators,
      endpointViolations,
      recentViolations
    });
  } catch (error) {
    console.error('Error fetching rate limit violations:', error);
    return NextResponse.json({ error: 'Failed to fetch rate limit violations' }, { status: 500 });
  }
}
