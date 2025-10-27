/**
 * Comprehensive ESG Validation System Test
 * 
 * This script tests all 6 validators and the complete validation workflow
 * as described in the architecture document.
 */

import { ESGValidationEngine } from './src/lib/esg/validation/engine.js';
import { FormatValidator } from './src/lib/esg/validation/validators/FormatValidator.js';
import { ConsistencyValidator } from './src/lib/esg/validation/validators/ConsistencyValidator.js';
import { TrendValidator } from './src/lib/esg/validation/validators/TrendValidator.js';
import { IndustryBenchmarkValidator } from './src/lib/esg/validation/validators/IndustryBenchmarkValidator.js';
import { PublicDataValidator } from './src/lib/esg/validation/validators/PublicDataValidator.js';
import { AnomalyDetectionValidator } from './src/lib/esg/validation/validators/AnomalyDetectionValidator.js';
import { ValidationContext, ESGDataPoint } from './src/lib/esg/validation/types.js';

console.log('🧪 Starting Comprehensive ESG Validation System Test\n');
console.log('=' .repeat(60));

// Test data sets
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
    reportedAt: new Date().toISOString(),
    notes: 'Total energy consumption'
  },
  {
    category: 'social',
    metricName: 'employee_satisfaction',
    value: 75,
    unit: '%',
    period: '2024-Q4',
    reportedAt: new Date().toISOString(),
    notes: 'Employee satisfaction survey'
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
    reportedAt: new Date().toISOString(),
    notes: 'Policy compliance rate'
  }
];

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

// Initialize validation engine
const engine = new ESGValidationEngine();

console.log('\n✅ Step 1: Initialize Validation Engine');
console.log('-'.repeat(60));

// Add all validators
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
  console.log(`  ✓ Added ${validator.name} (${validator.id})`);
});

console.log(`\n📊 Total validators registered: ${validators.length}`);

// Test 1: Valid Data Validation
async function testValidData() {
  console.log('\n\n✅ Step 2: Test Valid Data Points');
  console.log('-'.repeat(60));

  const context: ValidationContext = {
    organizationId: 'test-org-001',
    dataPoints: validDataPoints,
    historicalData: historicalData
  };

  try {
    const results = await engine.validate(context);
    console.log(`\n✓ Validation completed successfully`);
    console.log(`  Total validator results: ${results.length}`);

    results.forEach((result, index) => {
      console.log(`\n  Validator ${index + 1}: ${result.validatorId}`);
      console.log(`    ├─ Valid: ${result.isValid}`);
      console.log(`    ├─ Score: ${result.score}/100`);
      console.log(`    ├─ Issues: ${result.issues.length}`);
      if (result.issues.length > 0) {
        result.issues.slice(0, 3).forEach(issue => {
          console.log(`    │  • [${issue.severity}] ${issue.message}`);
        });
      }
      console.log(`    └─ Recommendations: ${result.recommendations.length}`);
    });

    const aggregated = await engine.getAggregatedResults(context);
    console.log(`\n📈 Aggregated Results:`);
    console.log(`  ├─ Overall Score: ${aggregated.overallScore}/100`);
    console.log(`  ├─ Is Valid: ${aggregated.isValid}`);
    console.log(`  ├─ Total Issues: ${aggregated.allIssues.length}`);
    console.log(`  │  ├─ Errors: ${aggregated.allIssues.filter(i => i.severity === 'error').length}`);
    console.log(`  │  ├─ Warnings: ${aggregated.allIssues.filter(i => i.severity === 'warning').length}`);
    console.log(`  │  └─ Info: ${aggregated.allIssues.filter(i => i.severity === 'info').length}`);
    console.log(`  └─ Recommendations: ${aggregated.allRecommendations.length}`);

    const summary = await engine.getValidationSummary(context);
    console.log(`\n📊 Validation Summary:`);
    console.log(`  ├─ Score: ${summary.score}/100`);
    console.log(`  ├─ Status: ${summary.status.toUpperCase()}`);
    console.log(`  ├─ Critical Issues: ${summary.criticalIssues}`);
    console.log(`  ├─ Warnings: ${summary.warnings}`);
    console.log(`  └─ Info Items: ${summary.infoItems}`);

    return { success: true, score: aggregated.overallScore };
  } catch (error) {
    console.error(`\n❌ Validation failed:`, error);
    return { success: false, error };
  }
}

// Test 2: Invalid Data Validation
async function testInvalidData() {
  console.log('\n\n❌ Step 3: Test Invalid Data Points');
  console.log('-'.repeat(60));

  const context: ValidationContext = {
    organizationId: 'test-org-002',
    dataPoints: invalidDataPoints
  };

  try {
    const aggregated = await engine.getAggregatedResults(context);
    console.log(`\n✓ Validation completed (expected to find issues)`);
    console.log(`\n📈 Results:`);
    console.log(`  ├─ Overall Score: ${aggregated.overallScore}/100`);
    console.log(`  ├─ Is Valid: ${aggregated.isValid}`);
    console.log(`  └─ Total Issues: ${aggregated.allIssues.length}`);

    if (aggregated.allIssues.length > 0) {
      console.log(`\n  📋 Issues Found:`);
      aggregated.allIssues.forEach((issue, index) => {
        console.log(`    ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        console.log(`       Field: ${issue.field}`);
        console.log(`       Severity Score: ${issue.severityScore}/10`);
        if (issue.recommendation) {
          console.log(`       Recommendation: ${issue.recommendation}`);
        }
      });
    }

    return { success: true, hasIssues: aggregated.allIssues.length > 0 };
  } catch (error) {
    console.error(`\n❌ Test failed:`, error);
    return { success: false, error };
  }
}

// Test 3: Individual Validator Tests
async function testIndividualValidators() {
  console.log('\n\n🔍 Step 4: Test Individual Validators');
  console.log('-'.repeat(60));

  const context: ValidationContext = {
    organizationId: 'test-org-003',
    dataPoints: validDataPoints,
    historicalData: historicalData
  };

  const results = [];

  for (const validator of validators) {
    console.log(`\n  Testing ${validator.name}...`);
    try {
      const result = await validator.validate(context);
      console.log(`    ✓ Success - Score: ${result.score}/100, Issues: ${result.issues.length}`);
      results.push({ validator: validator.name, success: true, result });
    } catch (error) {
      console.error(`    ❌ Failed:`, error instanceof Error ? error.message : error);
      results.push({ validator: validator.name, success: false, error });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n  Results: ${successCount}/${validators.length} validators passed`);

  return { success: successCount === validators.length, results };
}

// Test 4: Performance Test
async function testPerformance() {
  console.log('\n\n⚡ Step 5: Performance Test');
  console.log('-'.repeat(60));

  const largeDataset: ESGDataPoint[] = [];
  for (let i = 0; i < 50; i++) {
    largeDataset.push({
      category: ['environmental', 'social', 'governance'][i % 3] as 'environmental' | 'social' | 'governance',
      metricName: `metric_${i}`,
      value: Math.random() * 1000,
      unit: 'units',
      period: '2024',
      reportedAt: new Date().toISOString()
    });
  }

  const context: ValidationContext = {
    organizationId: 'test-org-performance',
    dataPoints: largeDataset,
    historicalData: largeDataset.map(dp => ({
      ...dp,
      value: dp.value * 0.9,
      period: '2023'
    }))
  };

  const startTime = Date.now();
  try {
    await engine.validate(context);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`\n  ✓ Validated ${largeDataset.length} data points`);
    console.log(`  ⏱️  Duration: ${duration}ms`);
    console.log(`  📊 Average: ${(duration / largeDataset.length).toFixed(2)}ms per data point`);

    return { success: true, duration, dataPoints: largeDataset.length };
  } catch (error) {
    console.error(`\n  ❌ Performance test failed:`, error);
    return { success: false, error };
  }
}

// Run all tests
async function runAllTests() {
  const testResults = {
    validDataTest: await testValidData(),
    invalidDataTest: await testInvalidData(),
    individualValidatorsTest: await testIndividualValidators(),
    performanceTest: await testPerformance()
  };

  console.log('\n\n');
  console.log('='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));

  const allTestsPassed = 
    testResults.validDataTest.success &&
    testResults.invalidDataTest.success &&
    testResults.individualValidatorsTest.success &&
    testResults.performanceTest.success;

  console.log(`\n✅ Valid Data Test: ${testResults.validDataTest.success ? 'PASSED' : 'FAILED'}`);
  if (testResults.validDataTest.success && 'score' in testResults.validDataTest) {
    console.log(`   Score: ${testResults.validDataTest.score}/100`);
  }

  console.log(`\n✅ Invalid Data Test: ${testResults.invalidDataTest.success ? 'PASSED' : 'FAILED'}`);
  if (testResults.invalidDataTest.success && 'hasIssues' in testResults.invalidDataTest) {
    console.log(`   Issues Detected: ${testResults.invalidDataTest.hasIssues ? 'YES' : 'NO'}`);
  }

  console.log(`\n✅ Individual Validators Test: ${testResults.individualValidatorsTest.success ? 'PASSED' : 'FAILED'}`);
  if (testResults.individualValidatorsTest.success && 'results' in testResults.individualValidatorsTest) {
    const successCount = testResults.individualValidatorsTest.results.filter((r: any) => r.success).length;
    console.log(`   Validators Passed: ${successCount}/${validators.length}`);
  }

  console.log(`\n✅ Performance Test: ${testResults.performanceTest.success ? 'PASSED' : 'FAILED'}`);
  if (testResults.performanceTest.success && 'duration' in testResults.performanceTest) {
    console.log(`   Duration: ${testResults.performanceTest.duration}ms`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎯 OVERALL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(60));

  return allTestsPassed;
}

// Execute tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

