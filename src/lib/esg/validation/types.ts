/**
 * ESG Data Validation System - Core Types
 * 
 * This file defines the core interfaces and types for the comprehensive
 * ESG data validation system as described in the architecture.
 */

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  severityScore: number; // 1-10 scale
  category: 'format' | 'consistency' | 'trend' | 'benchmark' | 'public' | 'anomaly';
  recommendation?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 trust score
  issues: ValidationIssue[];
  recommendations: string[];
  validatedAt: string;
  validatorId: string;
}

export interface ESGDataPoint {
  category: 'environmental' | 'social' | 'governance';
  metricName: string;
  value: number;
  unit: string;
  period: string;
  reportedAt: string;
  notes?: string;
}

export interface ValidationContext {
  organizationId: string;
  dataPoints: ESGDataPoint[];
  historicalData?: ESGDataPoint[];
  industryBenchmarks?: IndustryBenchmark[];
  publicReports?: PublicReport[];
}

export interface IndustryBenchmark {
  industry: string;
  metricName: string;
  average: number;
  median: number;
  standardDeviation: number;
  percentile25: number;
  percentile75: number;
  sampleSize: number;
  lastUpdated: string;
}

export interface PublicReport {
  source: string;
  url: string;
  metricName: string;
  value: number;
  unit: string;
  period: string;
  publishedAt: string;
  confidence: number; // 0-1
}

export interface ValidationEngine {
  addValidator(validator: Validator): void;
  removeValidator(validatorId: string): void;
  validate(context: ValidationContext): Promise<ValidationResult[]>;
}

export interface Validator {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  validate(context: ValidationContext): Promise<ValidationResult>;
}

export interface ValidationConfig {
  formatValidation: {
    carbonFootprintRange: [number, number];
    percentageRange: [number, number];
    energyConsumptionRange: [number, number];
  };
  consistencyValidation: {
    carbonEmissionFactor: number; // kg CO2/kWh
    maxDeviationThreshold: number; // 30%
    maxTrainingHoursPerEmployee: number; // 200 hours/year
  };
  trendValidation: {
    maxChangeRate: number; // 50%
    minDataPoints: number; // 2
  };
  benchmarkValidation: {
    outlierThreshold: number; // 2 standard deviations
    minSampleSize: number; // 10
  };
  publicDataValidation: {
    maxDeviationThreshold: number; // 20%
    minConfidence: number; // 0.7
  };
  anomalyDetection: {
    anomalyThreshold: number; // 0.8
    severeAnomalyThreshold: number; // 0.9
  };
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  formatValidation: {
    carbonFootprintRange: [0, 1000000], // 0 to 1M kg CO2
    percentageRange: [0, 100],
    energyConsumptionRange: [0, 10000000], // 0 to 10M kWh
  },
  consistencyValidation: {
    carbonEmissionFactor: 0.5, // kg CO2/kWh
    maxDeviationThreshold: 0.3, // 30%
    maxTrainingHoursPerEmployee: 200, // hours/year
  },
  trendValidation: {
    maxChangeRate: 0.5, // 50%
    minDataPoints: 2,
  },
  benchmarkValidation: {
    outlierThreshold: 2, // standard deviations
    minSampleSize: 10,
  },
  publicDataValidation: {
    maxDeviationThreshold: 0.2, // 20%
    minConfidence: 0.7,
  },
  anomalyDetection: {
    anomalyThreshold: 0.8,
    severeAnomalyThreshold: 0.9,
  },
};
