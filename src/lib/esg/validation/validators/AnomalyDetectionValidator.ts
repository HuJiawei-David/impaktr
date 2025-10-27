/**
 * Anomaly Detection Validator - Machine Learning Based Detection
 * 
 * This validator uses machine learning techniques to detect complex
 * data patterns and anomalies that might indicate data quality issues.
 */

import { 
  Validator, 
  ValidationContext, 
  ValidationResult, 
  ValidationIssue,
  ESGDataPoint,
  DEFAULT_VALIDATION_CONFIG 
} from '../types';

export class AnomalyDetectionValidator implements Validator {
  readonly id = 'anomaly-detection-validator';
  readonly name = 'Anomaly Detection Validator';
  readonly description = 'Uses machine learning to detect complex data patterns and anomalies';

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let totalSeverityScore = 0;

    const config = DEFAULT_VALIDATION_CONFIG.anomalyDetection;

    // Need sufficient data for anomaly detection
    if (context.dataPoints.length < 3) {
      return {
        isValid: true,
        score: 0, // Changed from 100 to 0 - insufficient data means no score
        issues: [{
          field: 'anomaly_detection',
          message: 'Insufficient data points for anomaly detection (minimum 3 required)',
          severity: 'info',
          severityScore: 1,
          category: 'anomaly',
          recommendation: 'Collect more data points for better anomaly detection'
        }],
        recommendations: ['More data points needed for anomaly detection'],
        validatedAt: new Date().toISOString(),
        validatorId: this.id
      };
    }

    // Extract features for anomaly detection
    const features = this.extractFeatures(context.dataPoints);
    
    // Detect anomalies using multiple methods
    const isolationForestAnomalies = this.isolationForestDetection(features, config);
    const statisticalAnomalies = this.statisticalAnomalyDetection(features, config);
    const patternAnomalies = this.patternAnomalyDetection(context.dataPoints, config);

    // Combine results
    const allAnomalies = [...isolationForestAnomalies, ...statisticalAnomalies, ...patternAnomalies];

    // Convert anomalies to validation issues
    for (const anomaly of allAnomalies) {
      const issue: ValidationIssue = {
        field: anomaly.metricName,
        message: anomaly.message,
        severity: anomaly.score > config.severeAnomalyThreshold ? 'error' : 'warning',
        severityScore: Math.round(anomaly.score * 10),
        category: 'anomaly',
        recommendation: anomaly.recommendation
      };
      issues.push(issue);
      totalSeverityScore += issue.severityScore;
    }

    // Calculate score
    const score = Math.max(0, 100 - totalSeverityScore);
    const isValid = issues.filter(issue => issue.severity === 'error').length === 0;

    // Generate recommendations
    if (issues.some(issue => issue.severity === 'error')) {
      recommendations.push('Critical anomalies detected - immediate data verification required');
    }

    if (issues.some(issue => issue.severity === 'warning')) {
      recommendations.push('Anomalies detected - review data for accuracy');
    }

    if (issues.length === 0) {
      recommendations.push('No significant anomalies detected in the data');
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

  private extractFeatures(dataPoints: ESGDataPoint[]): number[][] {
    const features: number[][] = [];

    for (const dataPoint of dataPoints) {
      const feature = [
        dataPoint.value,
        this.encodeCategory(dataPoint.category),
        this.encodeMetricName(dataPoint.metricName),
        this.normalizeValue(dataPoint.value, dataPoint.metricName),
        this.extractTemporalFeature(dataPoint.period),
        this.extractUnitFeature(dataPoint.unit)
      ];
      features.push(feature);
    }

    return features;
  }

  private encodeCategory(category: string): number {
    const categoryMap: { [key: string]: number } = {
      'environmental': 0,
      'social': 1,
      'governance': 2
    };
    return categoryMap[category] || 0;
  }

  private encodeMetricName(metricName: string): number {
    // Simple hash-based encoding
    let hash = 0;
    for (let i = 0; i < metricName.length; i++) {
      const char = metricName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 1000; // Normalize to 0-999
  }

  private normalizeValue(value: number, metricName: string): number {
    // Normalize based on metric type
    const metric = metricName.toLowerCase();
    
    if (metric.includes('percentage') || metric.includes('%')) {
      return value / 100; // Normalize percentages to 0-1
    } else if (metric.includes('carbon') || metric.includes('emission')) {
      return Math.log10(value + 1) / 6; // Log scale for carbon emissions
    } else if (metric.includes('energy')) {
      return Math.log10(value + 1) / 7; // Log scale for energy
    } else {
      return Math.log10(value + 1) / 5; // General log normalization
    }
  }

  private extractTemporalFeature(period: string): number {
    // Extract year from period
    const yearMatch = period.match(/\d{4}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      return (year - 2020) / 10; // Normalize years
    }
    return 0;
  }

  private extractUnitFeature(unit: string): number {
    // Encode common units
    const unitMap: { [key: string]: number } = {
      '%': 0,
      'kg': 1,
      'ton': 2,
      'kwh': 3,
      'mwh': 4,
      'm³': 5,
      'count': 6,
      'score': 7
    };
    return unitMap[unit.toLowerCase()] || 8;
  }

  private isolationForestDetection(features: number[][], config: any): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    
    // Simplified Isolation Forest implementation
    const scores = this.calculateIsolationScores(features);
    
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > config.anomalyThreshold) {
        anomalies.push({
          index: i,
          score: scores[i],
          metricName: `Data point ${i + 1}`,
          message: `Anomaly detected using Isolation Forest (score: ${scores[i].toFixed(3)})`,
          recommendation: 'This data point shows unusual patterns compared to others'
        });
      }
    }

    return anomalies;
  }

  private calculateIsolationScores(features: number[][]): number[] {
    const scores: number[] = [];
    const n = features.length;

    for (let i = 0; i < n; i++) {
      let isolationScore = 0;
      const iterations = Math.min(100, n * 2); // Limit iterations for performance

      for (let iter = 0; iter < iterations; iter++) {
        // Random feature selection
        const randomFeature = Math.floor(Math.random() * features[0].length);
        const randomSplit = Math.random();
        
        // Count points on each side
        let leftCount = 0;
        let rightCount = 0;
        
        for (let j = 0; j < n; j++) {
          if (features[j][randomFeature] < randomSplit) {
            leftCount++;
          } else {
            rightCount++;
          }
        }
        
        // Calculate isolation score
        const minCount = Math.min(leftCount, rightCount);
        if (minCount === 0) {
          isolationScore += 1; // Maximum isolation
        } else {
          isolationScore += Math.log2(minCount + 1);
        }
      }
      
      scores.push(isolationScore / iterations);
    }

    return scores;
  }

  private statisticalAnomalyDetection(features: number[][], config: any): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    
    // Calculate statistical measures for each feature
    for (let featureIndex = 0; featureIndex < features[0].length; featureIndex++) {
      const values = features.map(f => f[featureIndex]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Detect outliers using z-score
      for (let i = 0; i < values.length; i++) {
        const zScore = Math.abs(values[i] - mean) / stdDev;
        
        if (zScore > 2.5) { // 2.5 standard deviations threshold
          anomalies.push({
            index: i,
            score: Math.min(1, zScore / 4), // Normalize to 0-1
            metricName: `Data point ${i + 1}`,
            message: `Statistical outlier detected in feature ${featureIndex} (z-score: ${zScore.toFixed(2)})`,
            recommendation: 'This data point is statistically unusual'
          });
        }
      }
    }

    return anomalies;
  }

  private patternAnomalyDetection(dataPoints: ESGDataPoint[], config: any): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    // Detect suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousPatterns(dataPoints);
    
    for (const pattern of suspiciousPatterns) {
      anomalies.push({
        index: pattern.index,
        score: pattern.score,
        metricName: pattern.metricName,
        message: pattern.message,
        recommendation: pattern.recommendation
      });
    }

    return anomalies;
  }

  private detectSuspiciousPatterns(dataPoints: ESGDataPoint[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    // Pattern 1: All values are round numbers (suspicious)
    const roundNumberCount = dataPoints.filter(dp => 
      dp.value % 1 === 0 && dp.value % 10 === 0
    ).length;

    if (roundNumberCount / dataPoints.length > 0.8) {
      anomalies.push({
        index: -1,
        score: 0.7,
        metricName: 'Data Pattern',
        message: 'Suspicious pattern: Most values are round numbers',
        recommendation: 'Verify that values are not artificially rounded or estimated'
      });
    }

    // Pattern 2: Values are too similar (suspicious)
    const values = dataPoints.map(dp => dp.value);
    const uniqueValues = new Set(values);
    
    if (uniqueValues.size / values.length < 0.3) {
      anomalies.push({
        index: -1,
        score: 0.6,
        metricName: 'Data Pattern',
        message: 'Suspicious pattern: Many identical values',
        recommendation: 'Verify that values are not copied or duplicated'
      });
    }

    // Pattern 3: Perfectly increasing/decreasing sequence
    const sortedValues = [...values].sort((a, b) => a - b);
    const isPerfectlyIncreasing = values.every((val, i) => 
      i === 0 || val >= values[i - 1]
    );
    
    if (isPerfectlyIncreasing && values.length > 3) {
      anomalies.push({
        index: -1,
        score: 0.5,
        metricName: 'Data Pattern',
        message: 'Suspicious pattern: Perfectly increasing sequence',
        recommendation: 'Verify that values represent real measurements, not fabricated data'
      });
    }

    return anomalies;
  }
}

interface AnomalyResult {
  index: number;
  score: number; // 0-1 anomaly score
  metricName: string;
  message: string;
  recommendation: string;
}
