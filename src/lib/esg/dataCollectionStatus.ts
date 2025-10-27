import { prisma } from '../prisma';

export interface DataCollectionStatus {
  environmental: number;
  social: number;
  governance: number;
}

/**
 * Calculate real data collection status for an organization
 * @param organizationId - The organization ID
 * @returns DataCollectionStatus with percentages for each category
 */
export async function calculateDataCollectionStatus(organizationId: string): Promise<DataCollectionStatus> {
  try {
    // Get organization data
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        carbonFootprint: true,
        volunteerHours: true,
        employeeCount: true,
        lastReportDate: true,
        createdAt: true,
        esgMetrics: {
          select: {
            category: true,
            metricName: true,
            value: true,
            reportedAt: true
          }
        }
      }
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Calculate real data collection status for all organizations
    // No mock data - only real calculations based on actual data

    // Calculate Environmental completion
    const environmentalCompletion = calculateEnvironmentalCompletion(organization);
    
    // Calculate Social completion
    const socialCompletion = calculateSocialCompletion(organization);
    
    // Calculate Governance completion
    const governanceCompletion = calculateGovernanceCompletion(organization);

    return {
      environmental: Math.round(environmentalCompletion),
      social: Math.round(socialCompletion),
      governance: Math.round(governanceCompletion)
    };

  } catch (error) {
    console.error('Error calculating data collection status:', error);
    // Return default values on error
    return {
      environmental: 0,
      social: 0,
      governance: 0
    };
  }
}


/**
 * Calculate Environmental data completion percentage
 * Based on: carbonFootprint + energyData + wasteData + waterData
 * Strict validation: checks data quality, not just existence
 */
function calculateEnvironmentalCompletion(org: any): number {
  const metrics = org.esgMetrics;
  
  // Check for required environmental data points with strict validation
  const hasCarbonFootprint = isValidCarbonFootprint(org.carbonFootprint);
  const hasEnergyData = hasValidMetricData(metrics, 'environmental', ['energy_consumption', 'renewable_energy', 'energy_efficiency']);
  const hasWasteData = hasValidMetricData(metrics, 'environmental', ['waste_generated', 'waste_recycled', 'waste_reduction']);
  const hasWaterData = hasValidMetricData(metrics, 'environmental', ['water_consumption', 'water_efficiency', 'water_recycling']);
  
  const completedItems = [hasCarbonFootprint, hasEnergyData, hasWasteData, hasWaterData]
    .filter(Boolean).length;
  
  return (completedItems / 4) * 100;
}

/**
 * Calculate Social data completion percentage
 * Based on: employeeSurvey + communityImpact + diversityData + trainingData
 * Strict validation: checks data quality, not just existence
 */
function calculateSocialCompletion(org: any): number {
  const metrics = org.esgMetrics;
  
  // Check for required social data points with strict validation
  const hasEmployeeSurvey = hasValidMetricData(metrics, 'social', ['employee_satisfaction', 'employee_survey', 'employee_engagement']);
  const hasCommunityImpact = isValidVolunteerHours(org.volunteerHours) || 
                            hasValidMetricData(metrics, 'social', ['community_hours', 'volunteer_hours', 'community_impact']);
  const hasDiversityData = hasValidMetricData(metrics, 'social', ['diversity_index', 'gender_diversity', 'ethnic_diversity']);
  const hasTrainingData = hasValidMetricData(metrics, 'social', ['training_hours', 'employee_training', 'skill_development']);
  
  const completedItems = [hasEmployeeSurvey, hasCommunityImpact, hasDiversityData, hasTrainingData]
    .filter(Boolean).length;
  
  return (completedItems / 4) * 100;
}

/**
 * Calculate Governance data completion percentage
 * Based on: policies + auditData + reportingData + transparencyData
 * Strict validation: checks data quality, not just existence
 */
function calculateGovernanceCompletion(org: any): number {
  const metrics = org.esgMetrics;
  
  // Check for required governance data points with strict validation
  const hasPolicies = hasValidMetricData(metrics, 'governance', ['policy_compliance', 'code_of_conduct', 'governance_policies']);
  const hasAuditData = hasValidMetricData(metrics, 'governance', ['audit_results', 'compliance_audit', 'internal_audit']);
  const hasReportingData = isValidReportDate(org.lastReportDate) || 
                          hasValidMetricData(metrics, 'governance', ['reporting_frequency', 'sustainability_report', 'annual_report']);
  const hasTransparencyData = hasValidMetricData(metrics, 'governance', ['transparency_score', 'disclosure_rate', 'public_reporting']);
  
  const completedItems = [hasPolicies, hasAuditData, hasReportingData, hasTransparencyData]
    .filter(Boolean).length;
  
  return (completedItems / 4) * 100;
}

/**
 * Strict data validation functions - check data quality, not just existence
 */

/**
 * Validate carbon footprint data - must be realistic value
 */
function isValidCarbonFootprint(value: any): boolean {
  if (!value || typeof value !== 'number') return false;
  // Carbon footprint should be positive and realistic (not mock data)
  // Typical range: 1-10000 tons CO2/year for organizations
  return value > 0 && value <= 100000 && !isMockValue(value);
}

/**
 * Validate volunteer hours data - must be realistic value
 */
function isValidVolunteerHours(value: any): boolean {
  if (!value || typeof value !== 'number') return false;
  // Volunteer hours should be positive and realistic
  // Typical range: 1-100000 hours/year for organizations
  return value > 0 && value <= 100000 && !isMockValue(value);
}

/**
 * Validate report date - must be recent and valid
 */
function isValidReportDate(date: any): boolean {
  if (!date) return false;
  const reportDate = new Date(date);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  // Report date should be within last year and not in the future
  return reportDate >= oneYearAgo && reportDate <= now;
}

/**
 * Check if organization has valid metric data for specific category and metric names
 * Strict validation: checks data quality, not just existence
 */
function hasValidMetricData(metrics: any[], category: string, metricNames: string[]): boolean {
  return metrics.some(metric => {
    if (metric.category !== category) return false;
    
    const hasMatchingName = metricNames.some(name => 
      metric.metricName.toLowerCase().includes(name.toLowerCase())
    );
    
    if (!hasMatchingName) return false;
    
    // Additional validation: check if metric has valid data
    return isValidMetricValue(metric);
  });
}

/**
 * Validate metric value - must be realistic and not mock data
 */
function isValidMetricValue(metric: any): boolean {
  if (!metric || typeof metric.value !== 'number') return false;
  
  // Check for mock/test values that should be excluded
  if (isMockValue(metric.value)) return false;
  
  // Value should be positive and realistic
  return metric.value > 0 && metric.value <= 1000000;
}

/**
 * Detect mock/test values that should not be counted as real data
 */
function isMockValue(value: any): boolean {
  if (typeof value !== 'number') return false;
  
  // Common mock values to exclude
  const mockValues = [
    0, 1, 100, 1000, 123, 1234, 999, 9999,
    // Round numbers that are often used in mock data
    10, 20, 30, 40, 50, 60, 70, 80, 90,
    200, 300, 400, 500, 600, 700, 800, 900,
    2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000
  ];
  
  return mockValues.includes(value);
}

/**
 * Check if organization has metric data for specific category and metric names
 * @deprecated Use hasValidMetricData instead for strict validation
 */
function hasMetricData(metrics: any[], category: string, metricNames: string[]): boolean {
  return metrics.some(metric => 
    metric.category === category && 
    metricNames.some(name => 
      metric.metricName.toLowerCase().includes(name.toLowerCase())
    )
  );
}

/**
 * Get detailed data collection status with specific missing data points
 */
export async function getDetailedDataCollectionStatus(organizationId: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        carbonFootprint: true,
        volunteerHours: true,
        employeeCount: true,
        lastReportDate: true,
        createdAt: true,
        esgMetrics: {
          select: {
            category: true,
            metricName: true,
            value: true,
            reportedAt: true
          }
        }
      }
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const metrics = organization.esgMetrics;
    
    return {
      environmental: {
        percentage: calculateEnvironmentalCompletion(organization),
        details: {
          carbonFootprint: isValidCarbonFootprint(organization.carbonFootprint),
          energyData: hasValidMetricData(metrics, 'environmental', ['energy_consumption', 'renewable_energy', 'energy_efficiency']),
          wasteData: hasValidMetricData(metrics, 'environmental', ['waste_generated', 'waste_recycled', 'waste_reduction']),
          waterData: hasValidMetricData(metrics, 'environmental', ['water_consumption', 'water_efficiency', 'water_recycling'])
        }
      },
      social: {
        percentage: calculateSocialCompletion(organization),
        details: {
          employeeSurvey: hasValidMetricData(metrics, 'social', ['employee_satisfaction', 'employee_survey', 'employee_engagement']),
          communityImpact: isValidVolunteerHours(organization.volunteerHours) || 
                          hasValidMetricData(metrics, 'social', ['community_hours', 'volunteer_hours', 'community_impact']),
          diversityData: hasValidMetricData(metrics, 'social', ['diversity_index', 'gender_diversity', 'ethnic_diversity']),
          trainingData: hasValidMetricData(metrics, 'social', ['training_hours', 'employee_training', 'skill_development'])
        }
      },
      governance: {
        percentage: calculateGovernanceCompletion(organization),
        details: {
          policies: hasValidMetricData(metrics, 'governance', ['policy_compliance', 'code_of_conduct', 'governance_policies']),
          auditData: hasValidMetricData(metrics, 'governance', ['audit_results', 'compliance_audit', 'internal_audit']),
          reportingData: isValidReportDate(organization.lastReportDate) || 
                        hasValidMetricData(metrics, 'governance', ['reporting_frequency', 'sustainability_report', 'annual_report']),
          transparencyData: hasValidMetricData(metrics, 'governance', ['transparency_score', 'disclosure_rate', 'public_reporting'])
        }
      }
    };

  } catch (error) {
    console.error('Error getting detailed data collection status:', error);
    throw error;
  }
}
