/**
 * ESG Data Validation API Endpoints
 * 
 * This file provides RESTful API endpoints for the comprehensive
 * ESG data validation system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ESGValidationEngine } from '@/lib/esg/validation/engine';
import { FormatValidator } from '@/lib/esg/validation/validators/FormatValidator';
import { ConsistencyValidator } from '@/lib/esg/validation/validators/ConsistencyValidator';
import { TrendValidator } from '@/lib/esg/validation/validators/TrendValidator';
import { IndustryBenchmarkValidator } from '@/lib/esg/validation/validators/IndustryBenchmarkValidator';
import { PublicDataValidator } from '@/lib/esg/validation/validators/PublicDataValidator';
import { AnomalyDetectionValidator } from '@/lib/esg/validation/validators/AnomalyDetectionValidator';
import { 
  ValidationContext, 
  ESGDataPoint, 
  IndustryBenchmark, 
  PublicReport 
} from '@/lib/esg/validation/types';

// Initialize validation engine with all validators
const validationEngine = new ESGValidationEngine();
validationEngine.addValidator(new FormatValidator());
validationEngine.addValidator(new ConsistencyValidator());
validationEngine.addValidator(new TrendValidator());
validationEngine.addValidator(new IndustryBenchmarkValidator());
validationEngine.addValidator(new PublicDataValidator());
validationEngine.addValidator(new AnomalyDetectionValidator());

/**
 * POST /api/organizations/esg-validation
 * Validate ESG data points
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, dataPoints, includeHistorical = true, includeBenchmarks = true } = body;

    if (!organizationId || !dataPoints || !Array.isArray(dataPoints)) {
      return NextResponse.json(
        { error: 'Organization ID and data points are required' },
        { status: 400 }
      );
    }

    // Verify organization access
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        OR: [
          { members: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare validation context
    const validationContext: ValidationContext = {
      organizationId,
      dataPoints: dataPoints as ESGDataPoint[]
    };

    // Add historical data if requested
    if (includeHistorical) {
      const historicalData = await getHistoricalData(organizationId);
      validationContext.historicalData = historicalData;
    }

    // Add industry benchmarks if requested
    if (includeBenchmarks) {
      const benchmarks = await getIndustryBenchmarks(dataPoints as ESGDataPoint[]);
      validationContext.industryBenchmarks = benchmarks;
    }

    // Add public reports if available
    const publicReports = await getPublicReports(organizationId, dataPoints as ESGDataPoint[]);
    validationContext.publicReports = publicReports;

    // Run validation
    const aggregatedResults = await validationEngine.getAggregatedResults(validationContext);
    const validationSummary = await validationEngine.getValidationSummary(validationContext);

    // Save validation results to database
    const validationRecord = await prisma.validationResult.create({
      data: {
        organizationId,
        validatedBy: session.user.id,
        validationScore: aggregatedResults.overallScore,
        isValid: aggregatedResults.isValid,
        issues: JSON.stringify(aggregatedResults.allIssues),
        recommendations: aggregatedResults.allRecommendations,
        validatorResults: JSON.stringify(aggregatedResults.validatorResults),
        validatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        validationId: validationRecord.id,
        summary: validationSummary,
        results: aggregatedResults,
        validatedAt: validationRecord.validatedAt
      }
    });

  } catch (error) {
    console.error('ESG validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate ESG data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizations/esg-validation/history/:organizationId
 * Get validation history for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validationId = searchParams.get('validationId');
    const organizationId = searchParams.get('organizationId');

    if (!validationId) {
      return NextResponse.json(
        { error: 'Validation ID is required' },
        { status: 400 }
      );
    }

    // Get validation record
    const validationRecord = await prisma.validationResult.findFirst({
      where: {
        id: validationId,
        ...(organizationId && { organizationId })
      }
    });

    if (!validationRecord) {
      return NextResponse.json(
        { error: 'Validation record not found' },
        { status: 404 }
      );
    }

    // Verify access
    const organization = await prisma.organization.findFirst({
      where: {
        id: validationRecord.organizationId,
        members: { some: { userId: session.user.id } }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: validationRecord.id,
        organizationId: validationRecord.organizationId,
        validationScore: validationRecord.validationScore,
        isValid: validationRecord.isValid,
        issues: validationRecord.issues,
        recommendations: validationRecord.recommendations,
        validatorResults: validationRecord.validatorResults,
        validatedAt: validationRecord.validatedAt,
        validatedBy: validationRecord.validatedBy
      }
    });

  } catch (error) {
    console.error('Error fetching validation results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation results' },
      { status: 500 }
    );
  }
}

// Helper functions

async function getHistoricalData(organizationId: string): Promise<ESGDataPoint[]> {
  try {
    const historicalMetrics = await prisma.eSGMetric.findMany({
      where: { organizationId },
      orderBy: { reportedAt: 'desc' },
      take: 100 // Limit to recent 100 records
    });

    return historicalMetrics.map(metric => ({
      category: metric.category as 'environmental' | 'social' | 'governance',
      metricName: metric.metricName,
      value: metric.value,
      unit: metric.unit,
      period: metric.period,
      reportedAt: metric.reportedAt.toISOString(),
      notes: metric.notes || undefined
    }));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
}

async function getIndustryBenchmarks(dataPoints: ESGDataPoint[]): Promise<IndustryBenchmark[]> {
  // Mock industry benchmarks - in production, this would come from a database or external API
  const mockBenchmarks: IndustryBenchmark[] = [
    {
      industry: 'Technology',
      metricName: 'carbon_footprint',
      average: 500,
      median: 450,
      standardDeviation: 150,
      percentile25: 350,
      percentile75: 650,
      sampleSize: 150,
      lastUpdated: '2024-01-01'
    },
    {
      industry: 'Technology',
      metricName: 'employee_satisfaction',
      average: 75,
      median: 78,
      standardDeviation: 12,
      percentile25: 65,
      percentile75: 85,
      sampleSize: 200,
      lastUpdated: '2024-01-01'
    },
    {
      industry: 'Technology',
      metricName: 'energy_consumption',
      average: 1000,
      median: 950,
      standardDeviation: 300,
      percentile25: 750,
      percentile75: 1250,
      sampleSize: 120,
      lastUpdated: '2024-01-01'
    }
  ];

  // Filter benchmarks based on data points
  const relevantBenchmarks = mockBenchmarks.filter(benchmark =>
    dataPoints.some(dp => 
      dp.metricName.toLowerCase().includes(benchmark.metricName.toLowerCase()) ||
      benchmark.metricName.toLowerCase().includes(dp.metricName.toLowerCase())
    )
  );

  return relevantBenchmarks;
}

async function getPublicReports(organizationId: string, dataPoints: ESGDataPoint[]): Promise<PublicReport[]> {
  // Mock public reports - in production, this would come from external APIs
  const mockReports: PublicReport[] = [
    {
      source: 'Annual Sustainability Report 2023',
      url: 'https://example.com/sustainability-report-2023',
      metricName: 'carbon_footprint',
      value: 520,
      unit: 'tons CO2/year',
      period: '2023',
      publishedAt: '2024-03-15',
      confidence: 0.9
    },
    {
      source: 'ESG Disclosure Report',
      url: 'https://example.com/esg-disclosure',
      metricName: 'employee_satisfaction',
      value: 78,
      unit: '%',
      period: '2023',
      publishedAt: '2024-02-20',
      confidence: 0.8
    }
  ];

  // Filter reports based on data points
  const relevantReports = mockReports.filter(report =>
    dataPoints.some(dp => 
      dp.metricName.toLowerCase().includes(report.metricName.toLowerCase()) ||
      report.metricName.toLowerCase().includes(dp.metricName.toLowerCase())
    )
  );

  return relevantReports;
}
