/**
 * Public Data Validator - External Data Verification
 * 
 * This validator compares internal data against publicly available reports
 * to verify data consistency and detect potential discrepancies.
 */

import { 
  Validator, 
  ValidationContext, 
  ValidationResult, 
  ValidationIssue,
  ESGDataPoint,
  PublicReport,
  DEFAULT_VALIDATION_CONFIG 
} from '../types';

export class PublicDataValidator implements Validator {
  readonly id = 'public-data-validator';
  readonly name = 'Public Data Validator';
  readonly description = 'Compares data against publicly available reports and external sources';

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let totalSeverityScore = 0;

    const config = DEFAULT_VALIDATION_CONFIG.publicDataValidation;

    // If no public reports provided, skip validation
    if (!context.publicReports || context.publicReports.length === 0) {
      return {
        isValid: true,
        score: 0, // Changed from 100 to 0 - no public reports means no score
        issues: [{
          field: 'public_data_verification',
          message: 'No public reports available for verification',
          severity: 'info',
          severityScore: 1,
          category: 'public',
          recommendation: 'Public reports would help verify data accuracy'
        }],
        recommendations: ['Public reports not available for verification'],
        validatedAt: new Date().toISOString(),
        validatorId: this.id
      };
    }

    // Compare each data point against relevant public reports
    for (const dataPoint of context.dataPoints) {
      const publicIssues = this.compareAgainstPublicData(dataPoint, context.publicReports!, config);
      issues.push(...publicIssues);
      totalSeverityScore += publicIssues.reduce((sum, issue) => sum + issue.severityScore, 0);
    }

    // Calculate score
    const score = Math.max(0, 100 - totalSeverityScore);
    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;

    // Generate recommendations
    if (issues.some(issue => issue.severity === 'error')) {
      recommendations.push('Review data points that significantly differ from public reports');
    }

    if (issues.some(issue => issue.severity === 'warning')) {
      recommendations.push('Consider investigating discrepancies with public data sources');
    }

    if (issues.length === 0) {
      recommendations.push('Data is consistent with available public reports');
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

  private compareAgainstPublicData(
    dataPoint: ESGDataPoint,
    publicReports: PublicReport[],
    config: typeof DEFAULT_VALIDATION_CONFIG.publicDataValidation
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Find matching public reports
    const matchingReports = this.findMatchingPublicReports(dataPoint, publicReports);
    if (matchingReports.length === 0) {
      return issues;
    }

    // Filter reports by confidence level
    const reliableReports = matchingReports.filter(report => 
      report.confidence >= config.minConfidence
    );

    if (reliableReports.length === 0) {
      issues.push({
        field: dataPoint.metricName,
        message: `No reliable public reports found for ${dataPoint.metricName} (confidence threshold: ${config.minConfidence})`,
        severity: 'info',
        severityScore: 1,
        category: 'public',
        recommendation: 'Consider using more reliable data sources for verification'
      });
      return issues;
    }

    // Calculate average public value
    const publicValues = reliableReports.map(report => report.value);
    const publicAverage = publicValues.reduce((sum, val) => sum + val, 0) / publicValues.length;

    // Calculate deviation
    const deviation = Math.abs(dataPoint.value - publicAverage) / publicAverage;

    // Check for significant deviations
    if (deviation > config.maxDeviationThreshold) {
      const sources = reliableReports.map(r => r.source).join(', ');
      
      issues.push({
        field: dataPoint.metricName,
        message: `${dataPoint.metricName} value (${dataPoint.value} ${dataPoint.unit}) differs significantly from public reports (${publicAverage.toFixed(2)} ${dataPoint.unit}). Deviation: ${(deviation * 100).toFixed(1)}%. Sources: ${sources}`,
        severity: deviation > config.maxDeviationThreshold * 2 ? 'error' : 'warning',
        severityScore: deviation > config.maxDeviationThreshold * 2 ? 7 : 4,
        category: 'public',
        recommendation: this.generatePublicDataRecommendation(dataPoint, reliableReports, deviation)
      });
    }

    // Check for multiple conflicting sources
    const conflictingSources = this.detectConflictingSources(reliableReports);
    if (conflictingSources.length > 0) {
      issues.push({
        field: dataPoint.metricName,
        message: `Conflicting values found in public reports for ${dataPoint.metricName}`,
        severity: 'warning',
        severityScore: 3,
        category: 'public',
        recommendation: 'Verify which public source is most accurate and up-to-date'
      });
    }

    // Check report freshness
    const staleReports = reliableReports.filter(report => {
      const reportDate = new Date(report.publishedAt);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return reportDate < oneYearAgo;
    });

    if (staleReports.length > 0 && staleReports.length === reliableReports.length) {
      issues.push({
        field: dataPoint.metricName,
        message: `All public reports for ${dataPoint.metricName} are older than 1 year`,
        severity: 'info',
        severityScore: 1,
        category: 'public',
        recommendation: 'Seek more recent public data sources for better verification'
      });
    }

    return issues;
  }

  private findMatchingPublicReports(
    dataPoint: ESGDataPoint, 
    publicReports: PublicReport[]
  ): PublicReport[] {
    return publicReports.filter(report => {
      // Check metric name similarity
      const metricSimilarity = this.calculateStringSimilarity(
        report.metricName.toLowerCase(), 
        dataPoint.metricName.toLowerCase()
      );

      // Check unit compatibility
      const unitCompatible = this.areUnitsCompatible(report.unit, dataPoint.unit);

      // Check period relevance (within 2 years)
      const periodRelevant = this.isPeriodRelevant(report.period, dataPoint.period);

      return metricSimilarity > 0.6 && unitCompatible && periodRelevant;
    });
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation
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
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private areUnitsCompatible(unit1: string, unit2: string): boolean {
    const normalized1 = unit1.toLowerCase().trim();
    const normalized2 = unit2.toLowerCase().trim();

    // Exact match
    if (normalized1 === normalized2) return true;

    // Common unit conversions
    const unitConversions: { [key: string]: string[] } = {
      'kg': ['kilogram', 'kilograms'],
      'ton': ['tonne', 'tons', 'tonnes'],
      'kwh': ['kilowatt-hour', 'kilowatt hours'],
      'mwh': ['megawatt-hour', 'megawatt hours'],
      '%': ['percent', 'percentage'],
      'co2': ['carbon dioxide', 'co2e', 'co2 equivalent']
    };

    for (const [baseUnit, variants] of Object.entries(unitConversions)) {
      if ((normalized1 === baseUnit || variants.includes(normalized1)) &&
          (normalized2 === baseUnit || variants.includes(normalized2))) {
        return true;
      }
    }

    return false;
  }

  private isPeriodRelevant(publicPeriod: string, dataPeriod: string): boolean {
    // Extract years from periods
    const publicYear = this.extractYear(publicPeriod);
    const dataYear = this.extractYear(dataPeriod);

    if (!publicYear || !dataYear) return true; // If can't parse, assume relevant

    // Consider relevant if within 2 years
    return Math.abs(publicYear - dataYear) <= 2;
  }

  private extractYear(period: string): number | null {
    const yearMatch = period.match(/\d{4}/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }

  private detectConflictingSources(reports: PublicReport[]): PublicReport[] {
    if (reports.length < 2) return [];

    const values = reports.map(r => r.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const threshold = average * 0.2; // 20% threshold for conflict

    return reports.filter(report => 
      Math.abs(report.value - average) > threshold
    );
  }

  private generatePublicDataRecommendation(
    dataPoint: ESGDataPoint,
    reports: PublicReport[],
    deviation: number
  ): string {
    const metricName = dataPoint.metricName;
    const sources = reports.map(r => r.source).join(', ');

    if (deviation > 0.5) {
      return `Significant deviation from public reports. Verify data accuracy and consider if differences reflect reporting methodology, timing, or data quality issues. Sources: ${sources}`;
    } else {
      return `Minor deviation from public reports. This may be due to different reporting periods, methodologies, or data collection methods. Sources: ${sources}`;
    }
  }
}
