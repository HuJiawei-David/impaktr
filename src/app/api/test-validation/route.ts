/**
 * Test API Endpoint for ESG Validation System
 * 
 * This endpoint tests all 6 validators and provides a comprehensive validation report.
 * Access at: http://localhost:3000/api/test-validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { ESGValidationEngine } from '@/lib/esg/validation/engine';
import { FormatValidator } from '@/lib/esg/validation/validators/FormatValidator';
import { ConsistencyValidator } from '@/lib/esg/validation/validators/ConsistencyValidator';
import { TrendValidator } from '@/lib/esg/validation/validators/TrendValidator';
import { IndustryBenchmarkValidator } from '@/lib/esg/validation/validators/IndustryBenchmarkValidator';
import { PublicDataValidator } from '@/lib/esg/validation/validators/PublicDataValidator';
import { AnomalyDetectionValidator } from '@/lib/esg/validation/validators/AnomalyDetectionValidator';
import { ValidationContext, ESGDataPoint } from '@/lib/esg/validation/types';

export async function GET(request: NextRequest) {
  try {
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Initialize validation engine
    const engine = new ESGValidationEngine();
    const validators = [
      new FormatValidator(),
      new ConsistencyValidator(),
      new TrendValidator(),
      new IndustryBenchmarkValidator(),
      new PublicDataValidator(),
      new AnomalyDetectionValidator()
    ];

    validators.forEach(validator => {
      engine.addValidator(validator);
    });

    testResults.validatorsRegistered = validators.map(v => ({
      id: v.id,
      name: v.name,
      description: v.description
    }));

    // Test 1: Valid data points
    const validDataPoints: ESGDataPoint[] = [
      {
        category: 'environmental',
        metricName: 'carbon_footprint',
        value: 500,
        unit: 'tons CO2/year',
        period: '2024',
        reportedAt: new Date().toISOString(),
        notes: 'Annual carbon emissions'
      },
      {
        category: 'environmental',
        metricName: 'energy_consumption',
        value: 1000,
        unit: 'MWh/year',
        period: '2024',
        reportedAt: new Date().toISOString()
      },
      {
        category: 'social',
        metricName: 'employee_satisfaction',
        value: 75,
        unit: '%',
        period: '2024-Q4',
        reportedAt: new Date().toISOString()
      },
      {
        category: 'social',
        metricName: 'employee_count',
        value: 100,
        unit: 'employees',
        period: '2024',
        reportedAt: new Date().toISOString()
      },
      {
        category: 'social',
        metricName: 'training_hours',
        value: 5000,
        unit: 'hours/year',
        period: '2024',
        reportedAt: new Date().toISOString()
      },
      {
        category: 'governance',
        metricName: 'policy_compliance',
        value: 95,
        unit: '%',
        period: '2024',
        reportedAt: new Date().toISOString()
      }
    ];

    const historicalData: ESGDataPoint[] = [
      {
        category: 'environmental',
        metricName: 'carbon_footprint',
        value: 480,
        unit: 'tons CO2/year',
        period: '2023',
        reportedAt: new Date('2023-12-31').toISOString()
      },
      {
        category: 'social',
        metricName: 'employee_satisfaction',
        value: 72,
        unit: '%',
        period: '2023-Q4',
        reportedAt: new Date('2023-12-31').toISOString()
      }
    ];

    const validContext: ValidationContext = {
      organizationId: 'test-org-001',
      dataPoints: validDataPoints,
      historicalData: historicalData
    };

    const validDataResults = await engine.validate(validContext);
    const validDataAggregated = await engine.getAggregatedResults(validContext);
    const validDataSummary = await engine.getValidationSummary(validContext);

    testResults.tests.push({
      name: 'Valid Data Validation',
      status: 'completed',
      validatorResults: validDataResults.map(r => ({
        validatorId: r.validatorId,
        isValid: r.isValid,
        score: r.score,
        issuesCount: r.issues.length,
        issues: r.issues.slice(0, 5), // First 5 issues
        recommendationsCount: r.recommendations.length
      })),
      aggregated: {
        overallScore: validDataAggregated.overallScore,
        isValid: validDataAggregated.isValid,
        totalIssues: validDataAggregated.allIssues.length,
        errorCount: validDataAggregated.allIssues.filter(i => i.severity === 'error').length,
        warningCount: validDataAggregated.allIssues.filter(i => i.severity === 'warning').length,
        infoCount: validDataAggregated.allIssues.filter(i => i.severity === 'info').length
      },
      summary: validDataSummary
    });

    // Test 2: Invalid data points
    const invalidDataPoints: ESGDataPoint[] = [
      {
        category: 'environmental',
        metricName: 'carbon_footprint',
        value: -100, // Invalid: negative value
        unit: 'tons CO2/year',
        period: '2024',
        reportedAt: new Date().toISOString()
      },
      {
        category: 'social',
        metricName: 'employee_satisfaction',
        value: 150, // Invalid: percentage over 100
        unit: '%',
        period: '2024',
        reportedAt: new Date().toISOString()
      }
    ];

    const invalidContext: ValidationContext = {
      organizationId: 'test-org-002',
      dataPoints: invalidDataPoints
    };

    const invalidDataAggregated = await engine.getAggregatedResults(invalidContext);
    const invalidDataSummary = await engine.getValidationSummary(invalidContext);

    testResults.tests.push({
      name: 'Invalid Data Validation',
      status: 'completed',
      aggregated: {
        overallScore: invalidDataAggregated.overallScore,
        isValid: invalidDataAggregated.isValid,
        totalIssues: invalidDataAggregated.allIssues.length,
        issues: invalidDataAggregated.allIssues.map(i => ({
          field: i.field,
          message: i.message,
          severity: i.severity,
          category: i.category
        }))
      },
      summary: invalidDataSummary
    });

    // Test 3: Individual validator tests
    const individualTests = [];
    for (const validator of validators) {
      try {
        const result = await validator.validate(validContext);
        individualTests.push({
          validator: validator.name,
          id: validator.id,
          success: true,
          score: result.score,
          isValid: result.isValid,
          issuesCount: result.issues.length
        });
      } catch (error) {
        individualTests.push({
          validator: validator.name,
          id: validator.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    testResults.tests.push({
      name: 'Individual Validator Tests',
      status: 'completed',
      validators: individualTests,
      successRate: `${individualTests.filter(t => t.success).length}/${validators.length}`
    });

    // Overall assessment
    const allValidatorsPassed = individualTests.every(t => t.success);
    const validDataScoreAcceptable = validDataAggregated.overallScore >= 60;
    const invalidDataDetected = invalidDataAggregated.allIssues.length > 0;

    testResults.overall = {
      status: allValidatorsPassed && validDataScoreAcceptable && invalidDataDetected ? 'PASSED' : 'FAILED',
      allValidatorsPassed,
      validDataScoreAcceptable,
      invalidDataDetected,
      summary: {
        totalValidators: validators.length,
        validatorsWorking: individualTests.filter(t => t.success).length,
        validDataScore: validDataAggregated.overallScore,
        invalidDataIssuesFound: invalidDataAggregated.allIssues.length
      }
    };

    return NextResponse.json({
      success: true,
      message: 'ESG Validation System Test Completed',
      results: testResults
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Test validation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, {
      status: 500
    });
  }
}

