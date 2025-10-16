import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const period = url.searchParams.get('period') || '1h'; // 1h, 24h, 7d, 30d
    const metric = url.searchParams.get('metric') || 'overview'; // overview, performance, errors, uptime

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
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
    }

    switch (metric) {
      case 'overview':
        return await getOverviewMetrics(startDate, now);
      case 'performance':
        return await getPerformanceMetrics(startDate, now);
      case 'errors':
        return await getErrorMetrics(startDate, now);
      case 'uptime':
        return await getUptimeMetrics(startDate, now);
      default:
        return await getOverviewMetrics(startDate, now);
    }
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch performance metrics' }, { status: 500 });
  }
}

async function getOverviewMetrics(startDate: Date, endDate: Date) {
  // Get system health metrics
  const [
    totalRequests,
    averageResponseTime,
    errorRate,
    activeUsers,
    databaseConnections,
    memoryUsage,
    cpuUsage,
    diskUsage
  ] = await Promise.all([
    // Total API requests in period
    prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
    `,
    
    // Average response time
    prisma.$queryRaw`
      SELECT AVG("responseTime") as avg_time
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
    `,
    
    // Error rate
    prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN "statusCode" >= 400 THEN 1 END) as error_requests
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
    `,
    
    // Active users (users who participated in events in period)
    prisma.user.count({
      where: {
        participations: {
          some: {
            joinedAt: { gte: startDate }
          }
        }
      }
    }),
    
    // Database connections (mock data)
    Promise.resolve({ count: 15 }),
    
    // Memory usage (mock data)
    Promise.resolve({ usage: 75 }),
    
    // CPU usage (mock data)
    Promise.resolve({ usage: 45 }),
    
    // Disk usage (mock data)
    Promise.resolve({ usage: 60 })
  ]);

  return NextResponse.json({
    overview: {
      totalRequests: (totalRequests as any)[0]?.count || 0,
      averageResponseTime: (averageResponseTime as any)[0]?.avg_time || 0,
      errorRate: (errorRate as any)[0]?.error_requests / (errorRate as any)[0]?.total_requests || 0,
      activeUsers,
      databaseConnections: databaseConnections.count,
      memoryUsage: memoryUsage.usage,
      cpuUsage: cpuUsage.usage,
      diskUsage: diskUsage.usage,
    }
  });
}

async function getPerformanceMetrics(startDate: Date, endDate: Date) {
  const [
    responseTimeTrends,
    throughputTrends,
    slowestEndpoints,
    databasePerformance,
    cachePerformance
  ] = await Promise.all([
    // Response time trends
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', "timestamp") as hour,
        AVG("responseTime") as avg_response_time,
        MAX("responseTime") as max_response_time,
        MIN("responseTime") as min_response_time
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
      GROUP BY DATE_TRUNC('hour', "timestamp")
      ORDER BY hour ASC
    `,
    
    // Throughput trends
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', "timestamp") as hour,
        COUNT(*) as requests,
        COUNT(DISTINCT "userId") as unique_users
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
      GROUP BY DATE_TRUNC('hour', "timestamp")
      ORDER BY hour ASC
    `,
    
    // Slowest endpoints
    prisma.$queryRaw`
      SELECT 
        "endpoint",
        COUNT(*) as requests,
        AVG("responseTime") as avg_response_time,
        MAX("responseTime") as max_response_time
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
      GROUP BY "endpoint"
      ORDER BY avg_response_time DESC
      LIMIT 10
    `,
    
    // Database performance (mock data)
    Promise.resolve([
      { query: 'SELECT * FROM users', avg_time: 45, count: 1250 },
      { query: 'SELECT * FROM events', avg_time: 32, count: 890 },
      { query: 'SELECT * FROM participations', avg_time: 28, count: 2100 },
    ]),
    
    // Cache performance (mock data)
    Promise.resolve({
      hitRate: 85.5,
      missRate: 14.5,
      totalRequests: 15000,
      cacheSize: '2.3GB'
    })
  ]);

  return NextResponse.json({
    responseTimeTrends,
    throughputTrends,
    slowestEndpoints,
    databasePerformance,
    cachePerformance
  });
}

async function getErrorMetrics(startDate: Date, endDate: Date) {
  const [
    errorTrends,
    errorTypes,
    errorEndpoints,
    recentErrors,
    errorResolution
  ] = await Promise.all([
    // Error trends over time
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', "timestamp") as hour,
        COUNT(*) as total_errors,
        COUNT(CASE WHEN "statusCode" = 500 THEN 1 END) as server_errors,
        COUNT(CASE WHEN "statusCode" = 404 THEN 1 END) as not_found_errors,
        COUNT(CASE WHEN "statusCode" = 400 THEN 1 END) as bad_request_errors
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
      AND "statusCode" >= 400
      GROUP BY DATE_TRUNC('hour', "timestamp")
      ORDER BY hour ASC
    `,
    
    // Error types distribution
    prisma.$queryRaw`
      SELECT 
        "statusCode",
        COUNT(*) as count,
        AVG("responseTime") as avg_response_time
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
      AND "statusCode" >= 400
      GROUP BY "statusCode"
      ORDER BY count DESC
    `,
    
    // Error endpoints
    prisma.$queryRaw`
      SELECT 
        "endpoint",
        COUNT(*) as error_count,
        AVG("responseTime") as avg_response_time
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
      AND "statusCode" >= 400
      GROUP BY "endpoint"
      ORDER BY error_count DESC
      LIMIT 10
    `,
    
    // Recent errors
    prisma.$queryRaw`
      SELECT 
        "timestamp",
        "endpoint",
        "statusCode",
        "responseTime",
        "errorMessage"
      FROM "performance_logs" 
      WHERE "timestamp" >= ${startDate}
      AND "statusCode" >= 400
      ORDER BY "timestamp" DESC
      LIMIT 20
    `,
    
    // Error resolution (mock data)
    Promise.resolve({
      resolved: 95,
      pending: 5,
      averageResolutionTime: '2.5 hours'
    })
  ]);

  return NextResponse.json({
    errorTrends,
    errorTypes,
    errorEndpoints,
    recentErrors,
    errorResolution
  });
}

async function getUptimeMetrics(startDate: Date, endDate: Date) {
  const [
    uptimeStats,
    downtimeEvents,
    serviceHealth,
    alertHistory
  ] = await Promise.all([
    // Uptime statistics
    Promise.resolve({
      uptime: 99.9,
      downtime: 0.1,
      totalUptime: '8760 hours',
      totalDowntime: '8.76 hours'
    }),
    
    // Downtime events
    Promise.resolve([
      {
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
        duration: '5 minutes',
        cause: 'Database connection timeout',
        status: 'resolved'
      },
      {
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 2 * 60 * 1000),
        duration: '2 minutes',
        cause: 'Load balancer maintenance',
        status: 'resolved'
      }
    ]),
    
    // Service health
    Promise.resolve([
      { service: 'API', status: 'healthy', responseTime: '120ms' },
      { service: 'Database', status: 'healthy', responseTime: '45ms' },
      { service: 'Cache', status: 'healthy', responseTime: '15ms' },
      { service: 'Email Service', status: 'healthy', responseTime: '200ms' },
      { service: 'File Storage', status: 'healthy', responseTime: '80ms' }
    ]),
    
    // Alert history
    Promise.resolve([
      {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        level: 'warning',
        message: 'High response time detected',
        service: 'API',
        resolved: true
      },
      {
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        level: 'critical',
        message: 'Database connection pool exhausted',
        service: 'Database',
        resolved: true
      }
    ])
  ]);

  return NextResponse.json({
    uptimeStats,
    downtimeEvents,
    serviceHealth,
    alertHistory
  });
}
