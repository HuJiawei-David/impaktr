/**
 * Industry Benchmark Validator - Industry Comparison
 * 
 * This validator compares organization data against industry benchmarks
 * to identify outliers and potential data quality issues.
 */

import { 
  Validator, 
  ValidationContext, 
  ValidationResult, 
  ValidationIssue,
  ESGDataPoint,
  IndustryBenchmark,
  DEFAULT_VALIDATION_CONFIG 
} from '../types';

export class IndustryBenchmarkValidator implements Validator {
  readonly id = 'benchmark-validator';
  readonly name = 'Industry Benchmark Validator';
  readonly description = 'Compares data against industry benchmarks to identify outliers';

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let totalSeverityScore = 0;

    const config = DEFAULT_VALIDATION_CONFIG.benchmarkValidation;

    // If no benchmarks provided, skip validation
    if (!context.industryBenchmarks || context.industryBenchmarks.length === 0) {
      return {
        isValid: true,
        score: 0, // Changed from 100 to 0 - no benchmarks means no score
        issues: [{
          field: 'benchmark_analysis',
          message: 'No industry benchmarks available for comparison',
          severity: 'info',
          severityScore: 1,
          category: 'benchmark',
          recommendation: 'Industry benchmarks would help validate data quality'
        }],
        recommendations: ['Industry benchmarks not available'],
        validatedAt: new Date().toISOString(),
        validatorId: this.id
      };
    }

    // Compare each data point against relevant benchmarks
    for (const dataPoint of context.dataPoints) {
      const benchmarkIssues = this.compareAgainstBenchmark(dataPoint, context.industryBenchmarks!, config);
      issues.push(...benchmarkIssues);
      totalSeverityScore += benchmarkIssues.reduce((sum, issue) => sum + issue.severityScore, 0);
    }

    // Calculate score
    const score = Math.max(0, 100 - totalSeverityScore);
    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;

    // Generate recommendations
    if (issues.some(issue => issue.severity === 'error')) {
      recommendations.push('Review data points that significantly deviate from industry benchmarks');
    }

    if (issues.some(issue => issue.severity === 'warning')) {
      recommendations.push('Consider investigating metrics that differ from industry averages');
    }

    if (issues.length === 0) {
      recommendations.push('Data aligns well with industry benchmarks');
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

  private compareAgainstBenchmark(
    dataPoint: ESGDataPoint,
    benchmarks: IndustryBenchmark[],
    config: typeof DEFAULT_VALIDATION_CONFIG.benchmarkValidation
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Find matching benchmark
    const benchmark = this.findMatchingBenchmark(dataPoint, benchmarks);
    if (!benchmark) {
      return issues;
    }

    // Check sample size
    if (benchmark.sampleSize < config.minSampleSize) {
      issues.push({
        field: dataPoint.metricName,
        message: `Industry benchmark for ${dataPoint.metricName} has insufficient sample size (${benchmark.sampleSize} < ${config.minSampleSize})`,
        severity: 'info',
        severityScore: 1,
        category: 'benchmark',
        recommendation: 'Benchmark data may not be statistically significant'
      });
      return issues;
    }

    // Calculate z-score (standard deviations from mean)
    const zScore = (dataPoint.value - benchmark.average) / benchmark.standardDeviation;
    const absZScore = Math.abs(zScore);

    // Check for outliers
    if (absZScore > config.outlierThreshold) {
      const percentile = this.calculatePercentile(dataPoint.value, benchmark);
      const direction = zScore > 0 ? 'above' : 'below';
      
      issues.push({
        field: dataPoint.metricName,
        message: `${dataPoint.metricName} value (${dataPoint.value} ${dataPoint.unit}) is ${absZScore.toFixed(1)} standard deviations ${direction} industry average (${benchmark.average.toFixed(2)} ${dataPoint.unit}). This places you in the ${percentile}th percentile.`,
        severity: absZScore > config.outlierThreshold * 2 ? 'error' : 'warning',
        severityScore: absZScore > config.outlierThreshold * 2 ? 7 : 4,
        category: 'benchmark',
        recommendation: this.generateBenchmarkRecommendation(dataPoint, benchmark, zScore)
      });
    }

    // Check for extreme outliers (beyond 3 standard deviations)
    if (absZScore > 3) {
      issues.push({
        field: dataPoint.metricName,
        message: `${dataPoint.metricName} value is extremely ${zScore > 0 ? 'high' : 'low'} compared to industry standards (${absZScore.toFixed(1)} standard deviations from mean)`,
        severity: 'error',
        severityScore: 9,
        category: 'benchmark',
        recommendation: 'This extreme deviation requires immediate verification of data accuracy'
      });
    }

    // Check if value is within reasonable range (between 25th and 75th percentiles)
    if (dataPoint.value < benchmark.percentile25 || dataPoint.value > benchmark.percentile75) {
      if (absZScore <= config.outlierThreshold) {
        issues.push({
          field: dataPoint.metricName,
          message: `${dataPoint.metricName} is outside the interquartile range (25th-75th percentiles) but within acceptable limits`,
          severity: 'info',
          severityScore: 1,
          category: 'benchmark',
          recommendation: 'Monitor this metric closely as it differs from typical industry values'
        });
      }
    }

    return issues;
  }

  private findMatchingBenchmark(dataPoint: ESGDataPoint, benchmarks: IndustryBenchmark[]): IndustryBenchmark | null {
    // Try exact match first
    let benchmark = benchmarks.find(b => 
      b.metricName.toLowerCase() === dataPoint.metricName.toLowerCase()
    );

    if (benchmark) return benchmark;

    // Try fuzzy matching for similar metrics
    const fuzzyMatches = benchmarks.filter(b => 
      this.calculateStringSimilarity(b.metricName.toLowerCase(), dataPoint.metricName.toLowerCase()) > 0.7
    );

    if (fuzzyMatches.length > 0) {
      // Return the best match
      return fuzzyMatches.reduce((best, current) => 
        this.calculateStringSimilarity(current.metricName.toLowerCase(), dataPoint.metricName.toLowerCase()) >
        this.calculateStringSimilarity(best.metricName.toLowerCase(), dataPoint.metricName.toLowerCase()) 
          ? current : best
      );
    }

    return null;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculatePercentile(value: number, benchmark: IndustryBenchmark): number {
    // Simple percentile calculation based on normal distribution assumption
    const zScore = (value - benchmark.average) / benchmark.standardDeviation;
    
    // Convert z-score to percentile using approximation
    const percentile = 50 + (zScore * 34.13); // Rough approximation for normal distribution
    
    return Math.max(0, Math.min(100, Math.round(percentile)));
  }

  private generateBenchmarkRecommendation(
    dataPoint: ESGDataPoint, 
    benchmark: IndustryBenchmark, 
    zScore: number
  ): string {
    const direction = zScore > 0 ? 'higher' : 'lower';
    const metricName = dataPoint.metricName;
    
    if (Math.abs(zScore) > 2) {
      return `Your ${metricName} is significantly ${direction} than industry average. Verify data accuracy and consider if this reflects genuine business performance or data quality issues.`;
    } else {
      return `Your ${metricName} is ${direction} than industry average. This may reflect your organization's unique characteristics or data collection methods.`;
    }
  }
}
