/**
 * Consistency Validator - Business Logic Validation
 * 
 * This validator checks data consistency and internal logic relationships
 * to detect potential data errors or inconsistencies.
 */

import { 
  Validator, 
  ValidationContext, 
  ValidationResult, 
  ValidationIssue,
  ESGDataPoint,
  DEFAULT_VALIDATION_CONFIG 
} from '../types';

export class ConsistencyValidator implements Validator {
  readonly id = 'consistency-validator';
  readonly name = 'Data Consistency Validator';
  readonly description = 'Validates business logic consistency and internal data relationships';

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let totalSeverityScore = 0;

    const config = DEFAULT_VALIDATION_CONFIG.consistencyValidation;

    // Group data points by category for analysis
    const environmentalData = context.dataPoints.filter(dp => dp.category === 'environmental');
    const socialData = context.dataPoints.filter(dp => dp.category === 'social');
    const governanceData = context.dataPoints.filter(dp => dp.category === 'governance');

    // Environmental consistency checks
    const envIssues = this.validateEnvironmentalConsistency(environmentalData, config);
    issues.push(...envIssues);
    totalSeverityScore += envIssues.reduce((sum, issue) => sum + issue.severityScore, 0);

    // Social consistency checks
    const socialIssues = this.validateSocialConsistency(socialData, config);
    issues.push(...socialIssues);
    totalSeverityScore += socialIssues.reduce((sum, issue) => sum + issue.severityScore, 0);

    // Cross-category consistency checks
    const crossIssues = this.validateCrossCategoryConsistency(context.dataPoints, config);
    issues.push(...crossIssues);
    totalSeverityScore += crossIssues.reduce((sum, issue) => sum + issue.severityScore, 0);

    // Calculate score
    const score = Math.max(0, 100 - totalSeverityScore);
    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;

    // Generate recommendations
    if (envIssues.length > 0) {
      recommendations.push('Review environmental data for consistency between energy consumption and carbon emissions');
    }

    if (socialIssues.length > 0) {
      recommendations.push('Verify social metrics are consistent with organization size and industry standards');
    }

    if (crossIssues.length > 0) {
      recommendations.push('Ensure data consistency across different ESG categories');
    }

    if (issues.length === 0) {
      recommendations.push('All data points show good internal consistency');
    }

    return {
      isValid,
      score,
      issues,
      recommendations,
      validatedAt: new Date().toISOString(),
      validatorId: this.id
    };
  }

  private validateEnvironmentalConsistency(
    environmentalData: ESGDataPoint[], 
    config: typeof DEFAULT_VALIDATION_CONFIG.consistencyValidation
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Find energy and carbon data
    const energyData = environmentalData.find(dp => 
      dp.metricName.toLowerCase().includes('energy') && 
      dp.metricName.toLowerCase().includes('consumption')
    );
    
    const carbonData = environmentalData.find(dp => 
      dp.metricName.toLowerCase().includes('carbon') || 
      dp.metricName.toLowerCase().includes('emission')
    );

    // Energy-Carbon consistency check
    if (energyData && carbonData) {
      const expectedCarbon = energyData.value * config.carbonEmissionFactor;
      const actualCarbon = carbonData.value;
      const deviation = Math.abs(actualCarbon - expectedCarbon) / expectedCarbon;

      if (deviation > config.maxDeviationThreshold) {
        issues.push({
          field: `${energyData.metricName} + ${carbonData.metricName}`,
          message: `Carbon emissions (${actualCarbon} kg CO2) deviate significantly from expected value based on energy consumption (${expectedCarbon.toFixed(0)} kg CO2). Deviation: ${(deviation * 100).toFixed(1)}%`,
          severity: 'warning',
          severityScore: 6,
          category: 'consistency',
          recommendation: 'Verify carbon emission calculations or energy consumption data'
        });
      }
    }

    // Renewable energy vs total energy consistency
    const renewableEnergyData = environmentalData.find(dp => 
      dp.metricName.toLowerCase().includes('renewable')
    );
    
    const totalEnergyData = environmentalData.find(dp => 
      dp.metricName.toLowerCase().includes('energy') && 
      !dp.metricName.toLowerCase().includes('renewable') &&
      !dp.metricName.toLowerCase().includes('efficiency')
    );

    if (renewableEnergyData && totalEnergyData && renewableEnergyData.unit === '%') {
      if (renewableEnergyData.value > 100) {
        issues.push({
          field: renewableEnergyData.metricName,
          message: 'Renewable energy percentage cannot exceed 100%',
          severity: 'error',
          severityScore: 8,
          category: 'consistency',
          recommendation: 'Check renewable energy percentage calculation'
        });
      }
    }

    // Waste recycling consistency
    const wasteGeneratedData = environmentalData.find(dp => 
      dp.metricName.toLowerCase().includes('waste') && 
      dp.metricName.toLowerCase().includes('generated')
    );
    
    const wasteRecycledData = environmentalData.find(dp => 
      dp.metricName.toLowerCase().includes('waste') && 
      dp.metricName.toLowerCase().includes('recycled')
    );

    if (wasteGeneratedData && wasteRecycledData && wasteRecycledData.unit === '%') {
      if (wasteRecycledData.value > 100) {
        issues.push({
          field: wasteRecycledData.metricName,
          message: 'Waste recycling percentage cannot exceed 100%',
          severity: 'error',
          severityScore: 8,
          category: 'consistency',
          recommendation: 'Verify waste recycling percentage calculation'
        });
      }
    }

    return issues;
  }

  private validateSocialConsistency(
    socialData: ESGDataPoint[], 
    config: typeof DEFAULT_VALIDATION_CONFIG.consistencyValidation
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Employee count and training hours consistency
    const employeeCountData = socialData.find(dp => 
      dp.metricName.toLowerCase().includes('employee') && 
      dp.metricName.toLowerCase().includes('count')
    );
    
    const trainingHoursData = socialData.find(dp => 
      dp.metricName.toLowerCase().includes('training') && 
      dp.metricName.toLowerCase().includes('hour')
    );

    if (employeeCountData && trainingHoursData) {
      const trainingHoursPerEmployee = trainingHoursData.value / employeeCountData.value;
      
      if (trainingHoursPerEmployee > config.maxTrainingHoursPerEmployee) {
        issues.push({
          field: `${trainingHoursData.metricName} + ${employeeCountData.metricName}`,
          message: `Training hours per employee (${trainingHoursPerEmployee.toFixed(1)} hours/year) exceeds reasonable threshold (${config.maxTrainingHoursPerEmployee} hours/year)`,
          severity: 'warning',
          severityScore: 5,
          category: 'consistency',
          recommendation: 'Verify training hours data or employee count'
        });
      }
    }

    // Employee satisfaction consistency
    const satisfactionData = socialData.find(dp => 
      dp.metricName.toLowerCase().includes('satisfaction') || 
      dp.metricName.toLowerCase().includes('engagement')
    );

    if (satisfactionData && satisfactionData.unit === '%') {
      if (satisfactionData.value > 100) {
        issues.push({
          field: satisfactionData.metricName,
          message: 'Employee satisfaction percentage cannot exceed 100%',
          severity: 'error',
          severityScore: 8,
          category: 'consistency',
          recommendation: 'Check satisfaction survey calculation method'
        });
      }
    }

    // Diversity metrics consistency
    const diversityMetrics = socialData.filter(dp => 
      dp.metricName.toLowerCase().includes('diversity')
    );

    if (diversityMetrics.length > 1) {
      const totalDiversity = diversityMetrics.reduce((sum, metric) => {
        if (metric.unit === '%') {
          return sum + metric.value;
        }
        return sum;
      }, 0);

      if (totalDiversity > 100) {
        issues.push({
          field: 'diversity_metrics',
          message: `Combined diversity percentages (${totalDiversity.toFixed(1)}%) exceed 100%`,
          severity: 'warning',
          severityScore: 4,
          category: 'consistency',
          recommendation: 'Review diversity metric definitions and calculations'
        });
      }
    }

    return issues;
  }

  private validateCrossCategoryConsistency(
    allData: ESGDataPoint[], 
    config: typeof DEFAULT_VALIDATION_CONFIG.consistencyValidation
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Employee count consistency across categories
    const employeeCountInSocial = allData.find(dp => 
      dp.category === 'social' && 
      dp.metricName.toLowerCase().includes('employee') && 
      dp.metricName.toLowerCase().includes('count')
    );
    
    const employeeCountInEnvironmental = allData.find(dp => 
      dp.category === 'environmental' && 
      dp.metricName.toLowerCase().includes('employee') && 
      dp.metricName.toLowerCase().includes('count')
    );

    if (employeeCountInSocial && employeeCountInEnvironmental) {
      const deviation = Math.abs(employeeCountInSocial.value - employeeCountInEnvironmental.value) / 
                      Math.max(employeeCountInSocial.value, employeeCountInEnvironmental.value);

      if (deviation > 0.1) { // 10% deviation threshold
        issues.push({
          field: 'employee_count_consistency',
          message: `Employee count differs between social (${employeeCountInSocial.value}) and environmental (${employeeCountInEnvironmental.value}) data`,
          severity: 'warning',
          severityScore: 3,
          category: 'consistency',
          recommendation: 'Ensure employee count is consistent across all ESG categories'
        });
      }
    }

    // Period consistency
    const periods = [...new Set(allData.map(dp => dp.period))];
    if (periods.length > 1) {
      issues.push({
        field: 'period_consistency',
        message: `Data points span multiple periods: ${periods.join(', ')}`,
        severity: 'info',
        severityScore: 1,
        category: 'consistency',
        recommendation: 'Consider grouping data by consistent reporting periods for better analysis'
      });
    }

    return issues;
  }
}
