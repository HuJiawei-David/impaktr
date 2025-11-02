import { prisma } from './prisma';

interface OrganizationWithEvents {
  events: Array<{
    sdg: string | null;
    type: string;
    location: string;
    country?: string | null;
    title: string;
    skills?: string[] | null;
    isPublic?: boolean | null;
    organizationId?: string | null;
    createdAt?: Date | null;
    participations: Array<{
      hours?: number | null;
      status: string;
      user: {
        gender?: string | null;
        country?: string | null;
        nationality?: string | null;
      };
    }>;
  }>;
  members: Array<{
    user: {
      participations: Array<{
        status: string;
        event: {
          sdg: string | null;
          type: string;
          title: string;
          skills?: string[] | null;
        };
      }>;
    };
  }>;
  name?: string | null;
  description?: string | null;
  address?: string | null;
  industry?: string | null;
  id?: string | null;
}

export interface ESGMetrics {
  environmental: {
    sdg6: number;  // Clean Water & Sanitation
    sdg7: number;  // Affordable & Clean Energy
    sdg11: number; // Sustainable Cities & Communities
    sdg12: number; // Responsible Consumption & Production
    sdg13: number; // Climate Action
    sdg14: number; // Life Below Water
    sdg15: number; // Life on Land
    total: number;
  };
  social: {
    sdg1: number;  // No Poverty
    sdg2: number;  // Zero Hunger
    sdg3: number;  // Good Health & Well-Being
    sdg4: number;  // Quality Education
    sdg5: number;  // Gender Equality
    sdg8: number;  // Decent Work & Economic Growth
    sdg10: number; // Reduced Inequalities
    total: number;
  };
  governance: {
    sdg16: number; // Peace, Justice & Strong Institutions
    sdg17: number; // Partnerships for the Goals
    sdg12_6: number; // Sustainability Reporting
    total: number;
  };
  overall: number;
}

export async function calculateESGScore(organizationId: string, period: string = 'annual'): Promise<ESGMetrics> {
  console.log('[calculateESGScore] Starting for orgId:', organizationId, 'period:', period);
  const startDate = getPeriodStartDate(period);
  
  // Get all events and participations for the organization
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      events: {
        where: {
          createdAt: { gte: startDate }
        },
        include: {
          participations: {
            where: { status: 'VERIFIED' },
            include: { user: true }
          }
        }
      },
      members: {
        include: {
          user: {
            include: {
              participations: {
                where: {
                  status: 'VERIFIED',
                  event: {
                    createdAt: { gte: startDate }
                  }
                },
                include: { event: true }
              }
            }
          }
        }
      }
    }
  });

  if (!organization) {
    throw new Error('Organization not found');
  }

  // Calculate individual SDG scores
  const environmental = {
    sdg6: await calculateSDG6Score(organization),
    sdg7: await calculateSDG7Score(organization),
    sdg11: await calculateSDG11Score(organization),
    sdg12: await calculateSDG12Score(organization),
    sdg13: await calculateSDG13Score(organization),
    sdg14: await calculateSDG14Score(organization),
    sdg15: await calculateSDG15Score(organization),
    total: 0
  };

  const social = {
    sdg1: await calculateSDG1Score(organization),
    sdg2: await calculateSDG2Score(organization),
    sdg3: await calculateSDG3Score(organization),
    sdg4: await calculateSDG4Score(organization),
    sdg5: await calculateSDG5Score(organization),
    sdg8: await calculateSDG8Score(organization),
    sdg10: await calculateSDG10Score(organization),
    total: 0
  };

  const governance = {
    sdg16: await calculateSDG16Score(organization),
    sdg17: await calculateSDG17Score(organization),
    sdg12_6: await calculateSDG12_6Score(organization),
    total: 0
  };

  // Calculate totals with weights
  environmental.total = (
    environmental.sdg6 * 0.15 +   // Water
    environmental.sdg7 * 0.20 +   // Energy
    environmental.sdg11 * 0.15 +  // Cities
    environmental.sdg12 * 0.15 +  // Consumption
    environmental.sdg13 * 0.20 +  // Climate
    environmental.sdg14 * 0.10 +  // Water Life
    environmental.sdg15 * 0.05    // Land Life
  );

  social.total = (
    social.sdg1 * 0.10 +   // Poverty
    social.sdg2 * 0.10 +   // Hunger
    social.sdg3 * 0.15 +   // Health
    social.sdg4 * 0.20 +   // Education
    social.sdg5 * 0.15 +   // Gender
    social.sdg8 * 0.15 +   // Work
    social.sdg10 * 0.15    // Inequalities
  );

  governance.total = (
    governance.sdg16 * 0.50 +   // Justice
    governance.sdg17 * 0.30 +   // Partnerships
    governance.sdg12_6 * 0.20   // Reporting
  );

  const overall = (
    environmental.total * 0.40 +  // Environmental 40%
    social.total * 0.35 +         // Social 35%
    governance.total * 0.25       // Governance 25%
  );

  return {
    environmental,
    social,
    governance,
    overall: Math.min(Math.round(overall * 10) / 10, 100)
  };
}

// Helper function to get period start date
function getPeriodStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1);
    case 'annual':
    default:
      return new Date(now.getFullYear(), 0, 1);
  }
}

// Environmental SDG calculations
async function calculateSDG6Score(organization: OrganizationWithEvents): Promise<number> {
  const waterEvents = organization.events.filter((event) => event.sdg === "6");
  
  const metrics = {
    totalHours: waterEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    totalEvents: waterEvents.length,
    uniqueLocations: new Set(waterEvents.map((e) => e.location)).size,
    cleanupEvents: waterEvents.filter((e) => e.type === 'CLEANUP').length,
    awarenessEvents: waterEvents.filter((e) => e.type === 'AWARENESS').length
  };
  
  const hoursScore = Math.min((metrics.totalHours / 100) * 40, 40);
  const eventsScore = Math.min((metrics.totalEvents / 5) * 30, 30);
  const locationScore = Math.min((metrics.uniqueLocations / 3) * 20, 20);
  const diversityScore = Math.min(((metrics.cleanupEvents + metrics.awarenessEvents) / Math.max(metrics.totalEvents, 1)) * 10, 10);
  
  return Math.min(hoursScore + eventsScore + locationScore + diversityScore, 100);
}

async function calculateSDG7Score(organization: OrganizationWithEvents): Promise<number> {
  const energyEvents = organization.events.filter((event) => event.sdg === "7");
  
  const metrics = {
    totalHours: energyEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    workshopEvents: energyEvents.filter((e) => e.type === 'WORKSHOP').length,
    renewableKeywords: energyEvents.filter((e) => 
      e.title.toLowerCase().includes('solar') || 
      e.title.toLowerCase().includes('renewable') ||
      e.title.toLowerCase().includes('energy')
    ).length
  };
  
  const hoursScore = Math.min((metrics.totalHours / 80) * 50, 50);
  const workshopScore = Math.min((metrics.workshopEvents / 3) * 30, 30);
  const renewableScore = Math.min((metrics.renewableKeywords / Math.max(energyEvents.length, 1)) * 20, 20);
  
  return Math.min(hoursScore + workshopScore + renewableScore, 100);
}

async function calculateSDG11Score(organization: OrganizationWithEvents): Promise<number> {
  const urbanEvents = organization.events.filter((event) => event.sdg === "11");
  
  const metrics = {
    totalHours: urbanEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    urbanLocations: urbanEvents.filter((e) => 
      e.location.toLowerCase().includes('city') || 
      e.location.toLowerCase().includes('urban')
    ).length,
    communityEvents: urbanEvents.filter((e) => e.type === 'VOLUNTEERING').length,
    geographicSpread: new Set(urbanEvents.map((e) => e.country)).size
  };
  
  const hoursScore = Math.min((metrics.totalHours / 120) * 40, 40);
  const urbanScore = Math.min((metrics.urbanLocations / Math.max(urbanEvents.length, 1)) * 30, 30);
  const communityScore = Math.min((metrics.communityEvents / 4) * 20, 20);
  const spreadScore = Math.min((metrics.geographicSpread / 2) * 10, 10);
  
  return Math.min(hoursScore + urbanScore + communityScore + spreadScore, 100);
}

async function calculateSDG12Score(organization: OrganizationWithEvents): Promise<number> {
  const consumptionEvents = organization.events.filter((event) => event.sdg === "12");
  
  const metrics = {
    totalHours: consumptionEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    recyclingEvents: consumptionEvents.filter((e) => 
      e.title.toLowerCase().includes('recycle') || 
      e.title.toLowerCase().includes('waste')
    ).length,
    awarenessEvents: consumptionEvents.filter((e) => e.type === 'AWARENESS').length
  };
  
  const hoursScore = Math.min((metrics.totalHours / 60) * 50, 50);
  const recyclingScore = Math.min((metrics.recyclingEvents / 2) * 30, 30);
  const awarenessScore = Math.min((metrics.awarenessEvents / 3) * 20, 20);
  
  return Math.min(hoursScore + recyclingScore + awarenessScore, 100);
}

async function calculateSDG13Score(organization: OrganizationWithEvents): Promise<number> {
  const climateEvents = organization.events.filter((event) => event.sdg === "13");
  
  const metrics = {
    totalHours: climateEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    totalEvents: climateEvents.length,
    carbonKeywords: climateEvents.filter((e) => 
      e.title.toLowerCase().includes('carbon') || 
      e.title.toLowerCase().includes('climate') ||
      e.title.toLowerCase().includes('emission')
    ).length,
    globalReach: new Set(climateEvents.map((e) => e.country)).size
  };
  
  const hoursScore = Math.min((metrics.totalHours / 150) * 40, 40);
  const eventsScore = Math.min((metrics.totalEvents / 8) * 30, 30);
  const climateScore = Math.min((metrics.carbonKeywords / Math.max(climateEvents.length, 1)) * 20, 20);
  const reachScore = Math.min((metrics.globalReach / 3) * 10, 10);
  
  return Math.min(hoursScore + eventsScore + climateScore + reachScore, 100);
}

async function calculateSDG14Score(organization: OrganizationWithEvents): Promise<number> {
  const oceanEvents = organization.events.filter((event) => event.sdg === "14");
  
  const metrics = {
    totalHours: oceanEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    beachCleanups: oceanEvents.filter((e) => 
      e.title.toLowerCase().includes('beach') || 
      e.title.toLowerCase().includes('ocean') ||
      e.title.toLowerCase().includes('marine')
    ).length,
    coastalLocations: oceanEvents.filter((e) => 
      e.location.toLowerCase().includes('coast') || 
      e.location.toLowerCase().includes('beach')
    ).length
  };
  
  const hoursScore = Math.min((metrics.totalHours / 50) * 50, 50);
  const oceanScore = Math.min((metrics.beachCleanups / 2) * 30, 30);
  const coastalScore = Math.min((metrics.coastalLocations / 2) * 20, 20);
  
  return Math.min(hoursScore + oceanScore + coastalScore, 100);
}

async function calculateSDG15Score(organization: OrganizationWithEvents): Promise<number> {
  const landEvents = organization.events.filter((event) => event.sdg === "15");
  
  const metrics = {
    totalHours: landEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    biodiversityEvents: landEvents.filter((e) => 
      e.title.toLowerCase().includes('tree') || 
      e.title.toLowerCase().includes('forest') ||
      e.title.toLowerCase().includes('wildlife')
    ).length,
    restorationEvents: landEvents.filter((e) => e.type === 'VOLUNTEERING').length
  };
  
  const hoursScore = Math.min((metrics.totalHours / 80) * 50, 50);
  const biodiversityScore = Math.min((metrics.biodiversityEvents / 3) * 30, 30);
  const restorationScore = Math.min((metrics.restorationEvents / 4) * 20, 20);
  
  return Math.min(hoursScore + biodiversityScore + restorationScore, 100);
}

// Social SDG calculations
async function calculateSDG1Score(organization: OrganizationWithEvents): Promise<number> {
  const povertyEvents = organization.events.filter((event) => event.sdg === "1");
  
  const metrics = {
    totalHours: povertyEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    economicEvents: povertyEvents.filter((e) => 
      e.title.toLowerCase().includes('job') || 
      e.title.toLowerCase().includes('financial') ||
      e.title.toLowerCase().includes('employment')
    ).length,
    supportEvents: povertyEvents.filter((e) => 
      e.title.toLowerCase().includes('food') || 
      e.title.toLowerCase().includes('shelter') ||
      e.title.toLowerCase().includes('support')
    ).length,
    geographicReach: new Set(povertyEvents.map((e) => e.location)).size
  };
  
  const hoursScore = Math.min((metrics.totalHours / 100) * 40, 40);
  const economicScore = Math.min((metrics.economicEvents / 3) * 25, 25);
  const supportScore = Math.min((metrics.supportEvents / 3) * 25, 25);
  const reachScore = Math.min((metrics.geographicReach / 4) * 10, 10);
  
  return Math.min(hoursScore + economicScore + supportScore + reachScore, 100);
}

async function calculateSDG2Score(organization: OrganizationWithEvents): Promise<number> {
  const hungerEvents = organization.events.filter((event) => event.sdg === "2");
  
  const metrics = {
    totalHours: hungerEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    foodEvents: hungerEvents.filter((e) => 
      e.title.toLowerCase().includes('food') || 
      e.title.toLowerCase().includes('hunger') ||
      e.title.toLowerCase().includes('nutrition')
    ).length,
    agricultureEvents: hungerEvents.filter((e) => 
      e.title.toLowerCase().includes('garden') || 
      e.title.toLowerCase().includes('agriculture') ||
      e.title.toLowerCase().includes('farming')
    ).length,
    totalParticipants: hungerEvents.reduce((sum: number, event) => sum + event.participations.length, 0)
  };
  
  const hoursScore = Math.min((metrics.totalHours / 80) * 40, 40);
  const foodScore = Math.min((metrics.foodEvents / 2) * 30, 30);
  const agricultureScore = Math.min((metrics.agricultureEvents / 2) * 20, 20);
  const participantScore = Math.min((metrics.totalParticipants / 50) * 10, 10);
  
  return Math.min(hoursScore + foodScore + agricultureScore + participantScore, 100);
}

async function calculateSDG3Score(organization: OrganizationWithEvents): Promise<number> {
  const healthEvents = organization.events.filter((event) => event.sdg === "3");
  
  const metrics = {
    totalHours: healthEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    healthKeywords: healthEvents.filter((e) => 
      e.title.toLowerCase().includes('health') || 
      e.title.toLowerCase().includes('wellness') ||
      e.title.toLowerCase().includes('medical')
    ).length,
    workshopEvents: healthEvents.filter((e) => e.type === 'WORKSHOP').length,
    verifiedHours: healthEvents.reduce((sum: number, event) => 
      sum + event.participations.filter((p) => p.status === 'VERIFIED')
        .reduce((h: number, p) => h + (p.hours || 0), 0), 0)
  };
  
  const hoursScore = Math.min((metrics.totalHours / 120) * 40, 40);
  const healthScore = Math.min((metrics.healthKeywords / Math.max(healthEvents.length, 1)) * 30, 30);
  const workshopScore = Math.min((metrics.workshopEvents / 4) * 20, 20);
  const verificationScore = Math.min((metrics.verifiedHours / Math.max(metrics.totalHours, 1)) * 10, 10);
  
  return Math.min(hoursScore + healthScore + workshopScore + verificationScore, 100);
}

async function calculateSDG4Score(organization: OrganizationWithEvents): Promise<number> {
  const educationEvents = organization.events.filter((event) => event.sdg === "4");
  
  const metrics = {
    totalHours: educationEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    workshopEvents: educationEvents.filter((e) => e.type === 'WORKSHOP').length,
    educationKeywords: educationEvents.filter((e) => 
      e.title.toLowerCase().includes('education') || 
      e.title.toLowerCase().includes('learning') ||
      e.title.toLowerCase().includes('training')
    ).length,
    skillDevelopment: educationEvents.filter((e) => 
      e.skills && e.skills.length > 0
    ).length
  };
  
  const hoursScore = Math.min((metrics.totalHours / 100) * 40, 40);
  const workshopScore = Math.min((metrics.workshopEvents / 5) * 30, 30);
  const educationScore = Math.min((metrics.educationKeywords / Math.max(educationEvents.length, 1)) * 20, 20);
  const skillsScore = Math.min((metrics.skillDevelopment / Math.max(educationEvents.length, 1)) * 10, 10);
  
  return Math.min(hoursScore + workshopScore + educationScore + skillsScore, 100);
}

async function calculateSDG5Score(organization: OrganizationWithEvents): Promise<number> {
  const genderEvents = organization.events.filter((event) => event.sdg === "5");
  
  const metrics = {
    totalHours: genderEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    genderKeywords: genderEvents.filter((e) => 
      e.title.toLowerCase().includes('gender') || 
      e.title.toLowerCase().includes('women') ||
      e.title.toLowerCase().includes('equality')
    ).length,
    awarenessEvents: genderEvents.filter((e) => e.type === 'AWARENESS').length,
    participantDiversity: calculateGenderDiversity(genderEvents)
  };
  
  const hoursScore = Math.min((metrics.totalHours / 60) * 40, 40);
  const genderScore = Math.min((metrics.genderKeywords / Math.max(genderEvents.length, 1)) * 30, 30);
  const awarenessScore = Math.min((metrics.awarenessEvents / 2) * 20, 20);
  const diversityScore = Math.min(metrics.participantDiversity * 10, 10);
  
  return Math.min(hoursScore + genderScore + awarenessScore + diversityScore, 100);
}

async function calculateSDG8Score(organization: OrganizationWithEvents): Promise<number> {
  const workEvents = organization.events.filter((event) => event.sdg === "8");
  
  const metrics = {
    totalHours: workEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    jobKeywords: workEvents.filter((e) => 
      e.title.toLowerCase().includes('job') || 
      e.title.toLowerCase().includes('employment') ||
      e.title.toLowerCase().includes('career')
    ).length,
    skillEvents: workEvents.filter((e) => 
      e.skills && e.skills.length > 0
    ).length,
    economicImpact: workEvents.filter((e) => e.type === 'VOLUNTEERING').length
  };
  
  const hoursScore = Math.min((metrics.totalHours / 80) * 40, 40);
  const jobScore = Math.min((metrics.jobKeywords / Math.max(workEvents.length, 1)) * 30, 30);
  const skillScore = Math.min((metrics.skillEvents / Math.max(workEvents.length, 1)) * 20, 20);
  const impactScore = Math.min((metrics.economicImpact / 3) * 10, 10);
  
  return Math.min(hoursScore + jobScore + skillScore + impactScore, 100);
}

async function calculateSDG10Score(organization: OrganizationWithEvents): Promise<number> {
  const equalityEvents = organization.events.filter((event) => event.sdg === "10");
  
  const metrics = {
    totalHours: equalityEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    inclusionKeywords: equalityEvents.filter((e) => 
      e.title.toLowerCase().includes('inclusion') || 
      e.title.toLowerCase().includes('diversity') ||
      e.title.toLowerCase().includes('equality')
    ).length,
    geographicDiversity: new Set(equalityEvents.map((e) => e.country)).size,
    participantDiversity: calculateDemographicDiversity(equalityEvents)
  };
  
  const hoursScore = Math.min((metrics.totalHours / 70) * 40, 40);
  const inclusionScore = Math.min((metrics.inclusionKeywords / Math.max(equalityEvents.length, 1)) * 30, 30);
  const geoScore = Math.min((metrics.geographicDiversity / 3) * 20, 20);
  const diversityScore = Math.min(metrics.participantDiversity * 10, 10);
  
  return Math.min(hoursScore + inclusionScore + geoScore + diversityScore, 100);
}

// Governance SDG calculations
async function calculateSDG16Score(organization: OrganizationWithEvents): Promise<number> {
  const justiceEvents = organization.events.filter((event) => event.sdg === "16");
  
  const metrics = {
    totalHours: justiceEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    justiceKeywords: justiceEvents.filter((e) => 
      e.title.toLowerCase().includes('justice') || 
      e.title.toLowerCase().includes('peace') ||
      e.title.toLowerCase().includes('rights')
    ).length,
    awarenessEvents: justiceEvents.filter((e) => e.type === 'AWARENESS').length,
    verificationRate: calculateVerificationRate(justiceEvents)
  };
  
  const hoursScore = Math.min((metrics.totalHours / 50) * 40, 40);
  const justiceScore = Math.min((metrics.justiceKeywords / Math.max(justiceEvents.length, 1)) * 30, 30);
  const awarenessScore = Math.min((metrics.awarenessEvents / 2) * 20, 20);
  const verificationScore = Math.min(metrics.verificationRate * 10, 10);
  
  return Math.min(hoursScore + justiceScore + awarenessScore + verificationScore, 100);
}

async function calculateSDG17Score(organization: OrganizationWithEvents): Promise<number> {
  const partnershipEvents = organization.events.filter((event) => event.sdg === "17");
  
  const metrics = {
    totalHours: partnershipEvents.reduce((sum: number, event) => 
      sum + event.participations.reduce((h: number, p) => h + (p.hours || 0), 0), 0),
    collaborationEvents: partnershipEvents.filter((e) => 
      e.title.toLowerCase().includes('partnership') || 
      e.title.toLowerCase().includes('collaboration') ||
      e.title.toLowerCase().includes('alliance')
    ).length,
    crossSectorEvents: partnershipEvents.filter((e) => 
      e.organizationId && e.organizationId !== organization.id
    ).length,
    geographicPartnerships: new Set(partnershipEvents.map((e) => e.country)).size
  };
  
  const hoursScore = Math.min((metrics.totalHours / 60) * 40, 40);
  const collaborationScore = Math.min((metrics.collaborationEvents / 2) * 30, 30);
  const crossSectorScore = Math.min((metrics.crossSectorEvents / 3) * 20, 20);
  const geoScore = Math.min((metrics.geographicPartnerships / 2) * 10, 10);
  
  return Math.min(hoursScore + collaborationScore + crossSectorScore + geoScore, 100);
}

async function calculateSDG12_6Score(organization: OrganizationWithEvents): Promise<number> {
  const metrics = {
    dataCompleteness: calculateDataCompleteness(organization),
    reportingFrequency: calculateReportingFrequency(organization),
    verificationRate: calculateOverallVerificationRate(organization),
    transparencyScore: calculateTransparencyScore(organization)
  };
  
  const completenessScore = metrics.dataCompleteness * 30;
  const frequencyScore = metrics.reportingFrequency * 30;
  const verificationScore = metrics.verificationRate * 20;
  const transparencyScore = metrics.transparencyScore * 20;
  
  return Math.min(completenessScore + frequencyScore + verificationScore + transparencyScore, 100);
}

// Helper functions for diversity and quality calculations
function calculateGenderDiversity(events: OrganizationWithEvents["events"]): number {
  const allParticipants = events.flatMap(e => e.participations);
  const genders = allParticipants.map(p => p.user.gender).filter((gender): gender is string => Boolean(gender));
  
  if (genders.length === 0) return 0;
  
  const genderCounts = genders.reduce((acc: Record<string, number>, gender: string) => {
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});
  
  const uniqueGenders = Object.keys(genderCounts).length;
  const counts = Object.values(genderCounts);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  
  // Diversity score based on gender balance
  return Math.min((uniqueGenders / 3) * 0.5 + (minCount / maxCount) * 0.5, 1);
}

function calculateDemographicDiversity(events: OrganizationWithEvents["events"]): number {
  const allParticipants = events.flatMap(e => e.participations);
  const countries = allParticipants.map(p => p.user.country).filter((country): country is string => Boolean(country));
  const nationalities = allParticipants.map(p => p.user.nationality).filter((nationality): nationality is string => Boolean(nationality));
  
  const countryDiversity = new Set(countries).size / Math.max(countries.length, 1);
  const nationalityDiversity = new Set(nationalities).size / Math.max(nationalities.length, 1);
  
  return (countryDiversity + nationalityDiversity) / 2;
}

function calculateVerificationRate(events: OrganizationWithEvents["events"]): number {
  const allParticipations = events.flatMap(e => e.participations);
  const verifiedParticipations = allParticipations.filter(p => p.status === 'VERIFIED');
  
  return allParticipations.length > 0 ? 
    verifiedParticipations.length / allParticipations.length : 0;
}

function calculateDataCompleteness(organization: OrganizationWithEvents): number {
  const requiredFields = ['name', 'description', 'address', 'industry'];
  const completedFields = requiredFields.filter(field => organization[field as keyof OrganizationWithEvents]).length;
  
  return completedFields / requiredFields.length;
}

function calculateReportingFrequency(organization: OrganizationWithEvents): number {
  // Based on how often events are created and updated
  const recentEvents = organization.events.filter((e) => 
    e.createdAt && new Date(e.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  );
  
  return Math.min(recentEvents.length / 4, 1); // 4 events per quarter = 100%
}

function calculateOverallVerificationRate(organization: OrganizationWithEvents): number {
  const allParticipations = organization.events.flatMap((e) => e.participations);
  const verifiedParticipations = allParticipations.filter((p) => p.status === 'VERIFIED');
  
  return allParticipations.length > 0 ? 
    verifiedParticipations.length / allParticipations.length : 0;
}

function calculateTransparencyScore(organization: OrganizationWithEvents): number {
  // Based on public visibility and data sharing
  const publicEvents = organization.events.filter((e) => e.isPublic).length;
  const totalEvents = organization.events.length;
  
  return totalEvents > 0 ? publicEvents / totalEvents : 0;
}
