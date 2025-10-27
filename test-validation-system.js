/**
 * ESG Validation System Test Script
 * 
 * This script tests all validation steps to ensure they work correctly
 * according to the comprehensive validation architecture.
 */

const { ESGValidationEngine } = require('./src/lib/esg/validation/engine');
const { FormatValidator } = require('./src/lib/esg/validation/validators/FormatValidator');
const { ConsistencyValidator } = require('./src/lib/esg/validation/validators/ConsistencyValidator');
const { TrendValidator } = require('./src/lib/esg/validation/validators/TrendValidator');
const { IndustryBenchmarkValidator } = require('./src/lib/esg/validation/validators/IndustryBenchmarkValidator');
const { PublicDataValidator } = require('./src/lib/esg/validation/validators/PublicDataValidator');
const { AnomalyDetectionValidator } = require('./src/lib/esg/validation/validators/AnomalyDetectionValidator');

// Test data for validation
const testDataPoints = [
  {
    category: 'environmental',
    metricName: 'Carbon Footprint',
    value: 1500,
    unit: 'tons CO2/year',
    period: '2024',
    reportedAt: '2024-01-01T00:00:00Z',
    notes: 'Annual carbon emissions'
  },
  {
    category: 'environmental',
    metricName: 'Energy Consumption',
    value: 3000,
    unit: 'MWh/year',
    period: '2024',
    reportedAt: '2024-01-01T00:00:00Z',
    notes: 'Total energy consumption'
  },
  {
    category: 'social',
    metricName: 'Employee Satisfaction',
    value: 85,
    unit: '%',
    period: '2024-Q4',
    reportedAt: '2024-12-01T00:00:00Z',
    notes: 'Employee satisfaction survey'
  },
  {
    category: 'social',
    metricName: 'Training Hours',
    value: 1200,
    unit: 'hours/year',
    period: '2024',
    reportedAt: '2024-01-01T00:00:00Z',
    notes: 'Total training hours'
  },
  {
    category: 'governance',
    metricName: 'Policy Compliance',
    value: 95,
    unit: '%',
    period: '2024',
    reportedAt: '2024-01-01T00:00:00Z',
    notes: 'Policy compliance rate'
  }
];

const testHistoricalData = [
  {
    category: 'environmental',
    metricName: 'Carbon Footprint',
    value: 1400,
    unit: 'tons CO2/year',
    period: '2023',
    reportedAt: '2023-01-01T00:00:00Z'
  },
  {
    category: 'environmental',
    metricName: 'Energy Consumption',
    value: 2800,
    unit: 'MWh/year',
    period: '2023',
    reportedAt: '2023-01-01T00:00:00Z'
  },
  {
    category: 'social',
    metricName: 'Employee Satisfaction',
    value: 80,
    unit: '%',
    period: '2023-Q4',
    reportedAt: '2023-12-01T00:00:00Z'
  }
];

const testBenchmarks = [
  {
    industry: 'Technology',
    metricName: 'Carbon Footprint',
    average: 1200,
    median: 1150,
    standardDeviation: 300,
    percentile25: 900,
    percentile75: 1500,
    sampleSize: 150,
    lastUpdated: '2024-01-01T00:00:00Z'
  },
  {
    industry: 'Technology',
    metricName: 'Employee Satisfaction',
    average: 82,
    median: 85,
    standardDeviation: 12,
    percentile25: 75,
    percentile75: 90,
    sampleSize: 200,
    lastUpdated: '2024-01-01T00:00:00Z'
  }
];

const testPublicReports = [
  {
    source: 'Annual Report 2024',
    url: 'https://example.com/annual-report-2024',
    metricName: 'Carbon Footprint',
    value: 1450,
    unit: 'tons CO2/year',
    period: '2024',
    publishedAt: '2024-03-15T00:00:00Z',
    confidence: 0.9
  }
];

async function testValidationSystem() {
  console.log('🧪 Starting ESG Validation System Tests...\n');

  // Initialize validation engine
  const validationEngine = new ESGValidationEngine();
  
  // Add all validators
  validationEngine.addValidator(new FormatValidator());
  validationEngine.addValidator(new ConsistencyValidator());
  validationEngine.addValidator(new TrendValidator());
  validationEngine.addValidator(new IndustryBenchmarkValidator());
  validationEngine.addValidator(new PublicDataValidator());
  validationEngine.addValidator(new AnomalyDetectionValidator());

  const testContext = {
    organizationId: 'test-org-123',
    dataPoints: testDataPoints,
    historicalData: testHistoricalData,
    industryBenchmarks: testBenchmarks,
    publicReports: testPublicReports
  };

  try {
    // Test 1: Individual Validator Tests
    console.log('📋 Test 1: Individual Validator Tests');
    console.log('=====================================');
    
    const individualResults = await validationEngine.validate(testContext);
    
    individualResults.forEach((result, index) => {
      console.log(`\nValidator ${index + 1}: ${result.validatorId}`);
      console.log(`  Score: ${result.score}/100`);
      console.log(`  Valid: ${result.isValid}`);
      console.log(`  Issues: ${result.issues.length}`);
      console.log(`  Recommendations: ${result.recommendations.length}`);
      
      if (result.issues.length > 0) {
        console.log('  Issues:');
        result.issues.forEach((issue, i) => {
          console.log(`    ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        });
      }
    });

    // Test 2: Aggregated Results
    console.log('\n\n📋 Test 2: Aggregated Results');
    console.log('==============================');
    
    const aggregatedResults = await validationEngine.getAggregatedResults(testContext);
    
    console.log(`Overall Score: ${aggregatedResults.overallScore}/100`);
    console.log(`Is Valid: ${aggregatedResults.isValid}`);
    console.log(`Total Issues: ${aggregatedResults.allIssues.length}`);
    console.log(`Total Recommendations: ${aggregatedResults.allRecommendations.length}`);
    
    if (aggregatedResults.allIssues.length > 0) {
      console.log('\nAll Issues:');
      aggregatedResults.allIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        if (issue.recommendation) {
          console.log(`     Recommendation: ${issue.recommendation}`);
        }
      });
    }

    // Test 3: Validation Summary
    console.log('\n\n📋 Test 3: Validation Summary');
    console.log('==============================');
    
    const summary = await validationEngine.getValidationSummary(testContext);
    
    console.log(`Status: ${summary.status.toUpperCase()}`);
    console.log(`Score: ${summary.score}/100`);
    console.log(`Critical Issues: ${summary.criticalIssues}`);
    console.log(`Warnings: ${summary.warnings}`);
    console.log(`Info Items: ${summary.infoItems}`);

    // Test 4: Test Invalid Data
    console.log('\n\n📋 Test 4: Invalid Data Test');
    console.log('=============================');
    
    const invalidDataPoints = [
      {
        category: 'environmental',
        metricName: '', // Empty metric name
        value: -100, // Negative value
        unit: '', // Empty unit
        period: '', // Empty period
        reportedAt: 'invalid-date', // Invalid date
        notes: 'Invalid data test'
      },
      {
        category: 'social',
        metricName: 'Employee Satisfaction',
        value: 150, // Invalid percentage (>100%)
        unit: '%',
        period: '2024',
        reportedAt: '2024-01-01T00:00:00Z',
        notes: 'Invalid percentage test'
      }
    ];

    const invalidContext = {
      ...testContext,
      dataPoints: invalidDataPoints
    };

    const invalidResults = await validationEngine.getAggregatedResults(invalidContext);
    
    console.log(`Invalid Data Score: ${invalidResults.overallScore}/100`);
    console.log(`Is Valid: ${invalidResults.isValid}`);
    console.log(`Total Issues: ${invalidResults.allIssues.length}`);
    
    if (invalidResults.allIssues.length > 0) {
      console.log('\nInvalid Data Issues:');
      invalidResults.allIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    }

    console.log('\n✅ All validation tests completed successfully!');
    
    // Test 5: Performance Test
    console.log('\n\n📋 Test 5: Performance Test');
    console.log('============================');
    
    const startTime = Date.now();
    const performanceResults = await validationEngine.getAggregatedResults(testContext);
    const endTime = Date.now();
    
    console.log(`Validation completed in ${endTime - startTime}ms`);
    console.log(`Performance Score: ${performanceResults.overallScore}/100`);

  } catch (error) {
    console.error('❌ Validation test failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  testValidationSystem().catch(console.error);
}

module.exports = { testValidationSystem };
