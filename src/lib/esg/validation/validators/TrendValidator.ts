/**
 * Trend Validator - Time Series Analysis
 * 
 * This validator analyzes historical data trends to detect unusual changes
 * that might indicate data errors or significant business changes.
 */

import { 
  Validator, 
  ValidationContext, 
  ValidationResult, 
  ValidationIssue,
  ESGDataPoint,
  DEFAULT_VALIDATION_CONFIG 
} from '../types';

export class TrendValidator implements Validator {
  readonly id = 'trend-validator';
  readonly name = 'Trend Analysis Validator';
  readonly description = 'Analyzes historical data trends to detect unusual changes and anomalies';

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let totalSeverityScore = 0;

    const config = DEFAULT_VALIDATION_CONFIG.trendValidation;

    // If no historical data, skip trend analysis
    if (!context.historicalData || context.historicalData.length < config.minDataPoints) {
      return {
        isValid: true,
        score: 0, // Changed from 100 to 0 - no data means no score
        issues: [{
          field: 'trend_analysis',
          message: 'Insufficient historical data for trend analysis',
          severity: 'info',
          severityScore: 1,
          category: 'trend',
          recommendation: 'Collect more historical data for better trend analysis'
        }],
        recommendations: ['Historical data needed for trend analysis'],
        validatedAt: new Date().toISOString(),
        validatorId: this.id
      };
    }

    // Group current and historical data by metric
    const metricGroups = this.groupDataByMetric(context.dataPoints, context.historicalData);

    for (const [metricName, dataGroup] of metricGroups) {
      const trendIssues = this.analyzeMetricTrend(dataGroup, config);
      issues.push(...trendIssues);
      totalSeverityScore += trendIssues.reduce((sum, issue) => sum + issue.severityScore, 0);
    }

    // Calculate score
    const score = Math.max(0, 100 - totalSeverityScore);
    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;

    // Generate recommendations
    if (issues.some(issue => issue.severity === 'error')) {
      recommendations.push('Review data points with significant trend changes for accuracy');
    }

    if (issues.some(issue => issue.severity === 'warning')) {
      recommendations.push('Monitor trends closely and verify data accuracy');
    }

    if (issues.length === 0) {
      recommendations.push('Data trends appear normal and consistent');
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

  private groupDataByMetric(
    currentData: ESGDataPoint[], 
    historicalData: ESGDataPoint[]
  ): Map<string, { current: ESGDataPoint[], historical: ESGDataPoint[] }> {
    const groups = new Map<string, { current: ESGDataPoint[], historical: ESGDataPoint[] }>();

    // Group current data
    for (const dataPoint of currentData) {
      const key = `${dataPoint.category}_${dataPoint.metricName}`;
      if (!groups.has(key)) {
        groups.set(key, { current: [], historical: [] });
      }
      groups.get(key)!.current.push(dataPoint);
    }

    // Group historical data
    for (const dataPoint of historicalData) {
      const key = `${dataPoint.category}_${dataPoint.metricName}`;
      if (groups.has(key)) {
        groups.get(key)!.historical.push(dataPoint);
      }
    }

    return groups;
  }

  private analyzeMetricTrend(
    dataGroup: { current: ESGDataPoint[], historical: ESGDataPoint[] },
    config: typeof DEFAULT_VALIDATION_CONFIG.trendValidation
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (dataGroup.current.length === 0 || dataGroup.historical.length === 0) {
      return issues;
    }

    // Calculate average current value
    const currentAvg = dataGroup.current.reduce((sum, dp) => sum + dp.value, 0) / dataGroup.current.length;
    
    // Calculate average historical value
    const historicalAvg = dataGroup.historical.reduce((sum, dp) => sum + dp.value, 0) / dataGroup.historical.length;

    // Calculate change rate
    const changeRate = Math.abs(currentAvg - historicalAvg) / historicalAvg;

    // Check for significant changes
    if (changeRate > config.maxChangeRate) {
      const metricName = dataGroup.current[0].metricName;
      const category = dataGroup.current[0].category;
      
      issues.push({
        field: `${category}_${metricName}`,
        message: `Significant change detected: ${metricName} changed by ${(changeRate * 100).toFixed(1)}% (from ${historicalAvg.toFixed(2)} to ${currentAvg.toFixed(2)})`,
        severity: changeRate > config.maxChangeRate * 2 ? 'error' : 'warning',
        severityScore: changeRate > config.maxChangeRate * 2 ? 8 : 5,
        category: 'trend',
        recommendation: 'Verify data accuracy and investigate business changes that might explain this trend'
      });
    }

    // Analyze volatility
    const volatility = this.calculateVolatility([...dataGroup.historical, ...dataGroup.current]);
    if (volatility > 0.3) { // 30% volatility threshold
      const metricName = dataGroup.current[0].metricName;
      const category = dataGroup.current[0].category;
      
      issues.push({
        field: `${category}_${metricName}`,
        message: `High volatility detected in ${metricName}: ${(volatility * 100).toFixed(1)}% coefficient of variation`,
        severity: 'warning',
        severityScore: 3,
        category: 'trend',
        recommendation: 'Review data collection methods and consider smoothing techniques'
      });
    }

    // Detect outliers in current data
    const outliers = this.detectOutliers(dataGroup.current, dataGroup.historical);
    for (const outlier of outliers) {
      issues.push({
        field: `${outlier.category}_${outlier.metricName}`,
        message: `Outlier detected: ${outlier.metricName} value ${outlier.value} is significantly different from historical trend`,
        severity: 'warning',
        severityScore: 4,
        category: 'trend',
        recommendation: 'Verify outlier data point for accuracy'
      });
    }

    return issues;
  }

  private calculateVolatility(dataPoints: ESGDataPoint[]): number {
    if (dataPoints.length < 2) return 0;

    const values = dataPoints.map(dp => dp.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    return mean === 0 ? 0 : standardDeviation / mean;
  }

  private detectOutliers(currentData: ESGDataPoint[], historicalData: ESGDataPoint[]): ESGDataPoint[] {
    const outliers: ESGDataPoint[] = [];

    if (historicalData.length < 3) return outliers;

    const historicalValues = historicalData.map(dp => dp.value);
    const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
    const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
    const standardDeviation = Math.sqrt(variance);

    for (const dataPoint of currentData) {
      const zScore = Math.abs(dataPoint.value - mean) / standardDeviation;
      if (zScore > 2) { // 2 standard deviations threshold
        outliers.push(dataPoint);
      }
    }

    return outliers;
  }

  private parsePeriod(period: string): Date | null {
    // Handle different period formats
    if (period.match(/^\d{4}$/)) {
      // Year format: 2024
      return new Date(parseInt(period), 0, 1);
    } else if (period.match(/^\d{4}-Q[1-4]$/)) {
      // Quarter format: 2024-Q1
      const [year, quarter] = period.split('-Q');
      const quarterStartMonth = (parseInt(quarter) - 1) * 3;
      return new Date(parseInt(year), quarterStartMonth, 1);
    } else if (period.match(/^\d{4}-\d{2}$/)) {
      // Month format: 2024-01
      const [year, month] = period.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    
    return null;
  }

  private sortDataByPeriod(dataPoints: ESGDataPoint[]): ESGDataPoint[] {
    return dataPoints.sort((a, b) => {
      const dateA = this.parsePeriod(a.period);
      const dateB = this.parsePeriod(b.period);
      
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
  }
}
