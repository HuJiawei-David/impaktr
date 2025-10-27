/**
 * Format Validator - Basic Data Format Validation
 * 
 * This validator ensures data conforms to basic technical requirements
 * and prevents obvious input errors like negative values or unrealistic ranges.
 */

import { 
  Validator, 
  ValidationContext, 
  ValidationResult, 
  ValidationIssue,
  ESGDataPoint,
  DEFAULT_VALIDATION_CONFIG 
} from '../types';

export class FormatValidator implements Validator {
  readonly id = 'format-validator';
  readonly name = 'Data Format Validator';
  readonly description = 'Validates basic data format and range requirements';

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let totalSeverityScore = 0;

    for (const dataPoint of context.dataPoints) {
      // Validate metric name
      if (!dataPoint.metricName.trim()) {
        issues.push({
          field: dataPoint.metricName,
          message: 'Metric name cannot be empty',
          severity: 'error',
          severityScore: 10,
          category: 'format',
          recommendation: 'Provide a descriptive metric name'
        });
        totalSeverityScore += 10;
      }

      // Validate value is numeric and positive
      if (typeof dataPoint.value !== 'number' || isNaN(dataPoint.value)) {
        issues.push({
          field: dataPoint.metricName,
          message: 'Value must be a valid number',
          severity: 'error',
          severityScore: 10,
          category: 'format',
          recommendation: 'Enter a numeric value'
        });
        totalSeverityScore += 10;
        continue; // Skip further validation for this data point
      }

      if (dataPoint.value < 0) {
        issues.push({
          field: dataPoint.metricName,
          message: 'Value cannot be negative',
          severity: 'error',
          severityScore: 8,
          category: 'format',
          recommendation: 'Enter a positive value'
        });
        totalSeverityScore += 8;
      }

      // Validate unit
      if (!dataPoint.unit.trim()) {
        issues.push({
          field: dataPoint.metricName,
          message: 'Unit is required',
          severity: 'error',
          severityScore: 7,
          category: 'format',
          recommendation: 'Specify the unit of measurement'
        });
        totalSeverityScore += 7;
      }

      // Validate period format
      if (!dataPoint.period.trim()) {
        issues.push({
          field: dataPoint.metricName,
          message: 'Period is required',
          severity: 'error',
          severityScore: 7,
          category: 'format',
          recommendation: 'Specify the reporting period'
        });
        totalSeverityScore += 7;
      }

      // Validate reported date
      if (!dataPoint.reportedAt || isNaN(Date.parse(dataPoint.reportedAt))) {
        issues.push({
          field: dataPoint.metricName,
          message: 'Reported date must be valid',
          severity: 'error',
          severityScore: 6,
          category: 'format',
          recommendation: 'Enter a valid date'
        });
        totalSeverityScore += 6;
      }

      // Category-specific range validations
      const rangeIssues = this.validateValueRanges(dataPoint);
      issues.push(...rangeIssues);
      totalSeverityScore += rangeIssues.reduce((sum, issue) => sum + issue.severityScore, 0);

      // Unit consistency validation
      const unitIssues = this.validateUnitConsistency(dataPoint);
      issues.push(...unitIssues);
      totalSeverityScore += unitIssues.reduce((sum, issue) => sum + issue.severityScore, 0);
    }

    // Calculate score (100 - total severity score, minimum 0)
    const score = Math.max(0, 100 - totalSeverityScore);
    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;

    // Generate recommendations based on common issues
    if (issues.some(issue => issue.field.includes('carbon') && issue.severity === 'error')) {
      recommendations.push('Ensure carbon footprint values are realistic (typically 1-10,000 tons CO2/year for organizations)');
    }

    if (issues.some(issue => issue.field.includes('percentage') && issue.severity === 'error')) {
      recommendations.push('Percentage values should be between 0-100');
    }

    if (issues.some(issue => issue.field.includes('energy') && issue.severity === 'error')) {
      recommendations.push('Energy consumption values should be realistic for your organization size');
    }

    if (issues.length === 0) {
      recommendations.push('All data points passed format validation');
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

  private validateValueRanges(dataPoint: ESGDataPoint): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const config = DEFAULT_VALIDATION_CONFIG.formatValidation;

    // Carbon footprint validation
    if (dataPoint.metricName.toLowerCase().includes('carbon') || 
        dataPoint.metricName.toLowerCase().includes('emission')) {
      if (dataPoint.value < config.carbonFootprintRange[0] || 
          dataPoint.value > config.carbonFootprintRange[1]) {
        issues.push({
          field: dataPoint.metricName,
          message: `Carbon footprint value ${dataPoint.value} is outside realistic range (${config.carbonFootprintRange[0]}-${config.carbonFootprintRange[1]} kg CO2)`,
          severity: 'warning',
          severityScore: 5,
          category: 'format',
          recommendation: 'Verify the carbon footprint value is accurate'
        });
      }
    }

    // Percentage validation
    if (dataPoint.unit === '%' || dataPoint.unit.toLowerCase().includes('percent')) {
      if (dataPoint.value < config.percentageRange[0] || 
          dataPoint.value > config.percentageRange[1]) {
        issues.push({
          field: dataPoint.metricName,
          message: `Percentage value ${dataPoint.value}% is outside valid range (0-100%)`,
          severity: 'error',
          severityScore: 8,
          category: 'format',
          recommendation: 'Percentage values must be between 0 and 100'
        });
      }
    }

    // Energy consumption validation
    if (dataPoint.metricName.toLowerCase().includes('energy') && 
        (dataPoint.unit.toLowerCase().includes('kwh') || dataPoint.unit.toLowerCase().includes('mwh'))) {
      if (dataPoint.value < 0 || dataPoint.value > config.energyConsumptionRange[1]) {
        issues.push({
          field: dataPoint.metricName,
          message: `Energy consumption value ${dataPoint.value} ${dataPoint.unit} seems unrealistic`,
          severity: 'warning',
          severityScore: 4,
          category: 'format',
          recommendation: 'Verify energy consumption values are accurate'
        });
      }
    }

    // Employee count validation
    if (dataPoint.metricName.toLowerCase().includes('employee') && 
        dataPoint.unit.toLowerCase().includes('count')) {
      if (dataPoint.value < 1 || dataPoint.value > 1000000) {
        issues.push({
          field: dataPoint.metricName,
          message: `Employee count ${dataPoint.value} seems unrealistic`,
          severity: 'warning',
          severityScore: 3,
          category: 'format',
          recommendation: 'Verify employee count is accurate'
        });
      }
    }

    return issues;
  }

  private validateUnitConsistency(dataPoint: ESGDataPoint): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for common unit inconsistencies
    const metricName = dataPoint.metricName.toLowerCase();
    const unit = dataPoint.unit.toLowerCase();

    // Carbon footprint should typically be in CO2 units
    if (metricName.includes('carbon') && !unit.includes('co2') && !unit.includes('carbon')) {
      issues.push({
        field: dataPoint.metricName,
        message: `Carbon footprint metric "${dataPoint.metricName}" should typically use CO2 units`,
        severity: 'warning',
        severityScore: 2,
        category: 'format',
        recommendation: 'Consider using CO2 units for carbon footprint metrics'
      });
    }

    // Energy should be in energy units
    if (metricName.includes('energy') && !unit.includes('kwh') && !unit.includes('mwh') && !unit.includes('joule')) {
      issues.push({
        field: dataPoint.metricName,
        message: `Energy metric "${dataPoint.metricName}" should use energy units (kWh, MWh, etc.)`,
        severity: 'warning',
        severityScore: 2,
        category: 'format',
        recommendation: 'Use standard energy units for energy metrics'
      });
    }

    // Waste should be in weight units
    if (metricName.includes('waste') && !unit.includes('ton') && !unit.includes('kg') && !unit.includes('lb')) {
      issues.push({
        field: dataPoint.metricName,
        message: `Waste metric "${dataPoint.metricName}" should use weight units`,
        severity: 'warning',
        severityScore: 2,
        category: 'format',
        recommendation: 'Use weight units (tons, kg) for waste metrics'
      });
    }

    return issues;
  }
}
