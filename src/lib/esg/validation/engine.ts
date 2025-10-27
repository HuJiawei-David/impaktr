/**
 * ESG Data Validation Engine - Core Implementation
 * 
 * This is the main validation engine that coordinates all validators
 * and implements the strategy pattern for extensible validation.
 */

import { 
  ValidationEngine, 
  Validator, 
  ValidationContext, 
  ValidationResult,
  ValidationIssue 
} from './types';

export class ESGValidationEngine implements ValidationEngine {
  private validators: Map<string, Validator> = new Map();

  addValidator(validator: Validator): void {
    this.validators.set(validator.id, validator);
  }

  removeValidator(validatorId: string): void {
    this.validators.delete(validatorId);
  }

  async validate(context: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Execute all validators in parallel for better performance
    const validationPromises = Array.from(this.validators.values()).map(async (validator) => {
      try {
        return await validator.validate(context);
      } catch (error) {
        console.error(`Validator ${validator.id} failed:`, error);
        // Return a failed validation result instead of throwing
        return {
          isValid: false,
          score: 0,
          issues: [{
            field: 'validator',
            message: `Validator ${validator.name} encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error' as const,
            severityScore: 10,
            category: 'format' as const,
            recommendation: 'Please try again or contact support if the issue persists'
          }],
          recommendations: ['Retry validation or contact support'],
          validatedAt: new Date().toISOString(),
          validatorId: validator.id
        };
      }
    });

    const validationResults = await Promise.all(validationPromises);
    results.push(...validationResults);

    return results;
  }

  /**
   * Get aggregated validation results with overall score and recommendations
   */
  async getAggregatedResults(context: ValidationContext): Promise<{
    overallScore: number;
    isValid: boolean;
    allIssues: ValidationIssue[];
    allRecommendations: string[];
    validatorResults: ValidationResult[];
  }> {
    // If no data points provided, return invalid result
    if (!context.dataPoints || context.dataPoints.length === 0) {
      return {
        overallScore: 0,
        isValid: false,
        allIssues: [{
          field: 'data_points',
          message: 'No data points provided for validation',
          severity: 'error',
          severityScore: 10,
          category: 'format',
          recommendation: 'Please provide ESG data points for validation'
        }],
        allRecommendations: ['Provide ESG data points for validation'],
        validatorResults: []
      };
    }

    // Check if all data points are empty (no meaningful data)
    const hasEmptyData = context.dataPoints.every(dataPoint => 
      !dataPoint.metricName.trim() || 
      dataPoint.value === 0 || 
      !dataPoint.unit.trim() || 
      !dataPoint.period.trim()
    );

    if (hasEmptyData) {
      return {
        overallScore: 0,
        isValid: false,
        allIssues: [{
          field: 'data_points',
          message: 'All data points are empty or incomplete',
          severity: 'error',
          severityScore: 10,
          category: 'format',
          recommendation: 'Please fill in the metric data before validation'
        }],
        allRecommendations: ['Fill in metric data before validation'],
        validatorResults: []
      };
    }

    const validatorResults = await this.validate(context);
    
    // Aggregate all issues
    const allIssues: ValidationIssue[] = [];
    const allRecommendations: string[] = [];
    let totalScore = 0;
    let validValidatorCount = 0;

    validatorResults.forEach(result => {
      allIssues.push(...result.issues);
      allRecommendations.push(...result.recommendations);
      
      if (result.score > 0) {
        totalScore += result.score;
        validValidatorCount++;
      }
    });

    // Calculate overall score as average of all validator scores
    // If no validators returned scores > 0, overall score should be 0
    const overallScore = validValidatorCount > 0 ? totalScore / validValidatorCount : 0;
    
    // Determine overall validity (fail if any critical errors exist)
    const hasCriticalErrors = allIssues.some(issue => issue.severity === 'error');
    const isValid = !hasCriticalErrors && overallScore >= 60; // Minimum 60% score for validity

    // Remove duplicate recommendations
    const uniqueRecommendations = [...new Set(allRecommendations)];

    return {
      overallScore: Math.round(overallScore),
      isValid,
      allIssues: allIssues.sort((a, b) => b.severityScore - a.severityScore), // Sort by severity
      allRecommendations: uniqueRecommendations,
      validatorResults
    };
  }

  /**
   * Get validation summary for quick overview
   */
  async getValidationSummary(context: ValidationContext): Promise<{
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';
    criticalIssues: number;
    warnings: number;
    infoItems: number;
  }> {
    const aggregated = await this.getAggregatedResults(context);
    
    const criticalIssues = aggregated.allIssues.filter(issue => issue.severity === 'error').length;
    const warnings = aggregated.allIssues.filter(issue => issue.severity === 'warning').length;
    const infoItems = aggregated.allIssues.filter(issue => issue.severity === 'info').length;

    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';
    if (!aggregated.isValid) {
      status = 'invalid';
    } else if (aggregated.overallScore >= 90) {
      status = 'excellent';
    } else if (aggregated.overallScore >= 80) {
      status = 'good';
    } else if (aggregated.overallScore >= 70) {
      status = 'fair';
    } else {
      status = 'poor';
    }

    return {
      score: aggregated.overallScore,
      status,
      criticalIssues,
      warnings,
      infoItems
    };
  }
}
