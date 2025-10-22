import { prisma } from '@/lib/prisma';
import { calculateESGScore, ESGMetrics } from '../esg-calculator';

export interface Baseline {
  totalMembers: number;
  activeMembers: number;
  totalHours: number;
  verifiedEvents: number;
  E: number; H: number; Q: number; V: number; S: number; C: number; G: number;
}

/**
 * Get current ESG baseline from organization data
 * @param organizationId - Organization ID
 * @returns Current ESG baseline metrics
 */
export async function getCurrentESGBaseline(organizationId: string): Promise<Baseline> {
  // Get organization data
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: true,
      events: {
        include: {
          participations: {
            where: { status: 'VERIFIED' }
          }
        }
      }
    }
  });

  if (!organization) {
    throw new Error('Organization not found');
  }

  // Calculate current ESG score
  const esgMetrics = await calculateESGScore(organizationId, 'annual');
  
  // Calculate baseline metrics
  const totalMembers = organization.members.length;
  const activeMembers = organization.members.filter(m => 
    m.status === 'active'
  ).length;
  
  const totalHours = organization.events.reduce((sum, event) => 
    sum + event.participations.reduce((h, p) => h + (p.hours || 0), 0), 0
  );
  
  const verifiedEvents = organization.events.filter(event => 
    event.participations.some(p => p.status === 'VERIFIED')
  ).length;

  return {
    totalMembers,
    activeMembers,
    totalHours,
    verifiedEvents,
    E: esgMetrics.environmental.total / 100, // Convert to 0-1 scale
    H: Math.min(totalHours / 1000, 1), // Hours score based on total hours
    Q: Math.min(verifiedEvents / 50, 1), // Quality score based on verified events
    V: calculateVerificationRate(organization.events),
    S: esgMetrics.social.total / 100, // Convert to 0-1 scale
    C: calculateCauseDiversity(organization.events),
    G: esgMetrics.governance.total / 100, // Convert to 0-1 scale
  };
}

/**
 * Calculate verification rate from events
 */
function calculateVerificationRate(events: any[]): number {
  const allParticipations = events.flatMap(e => e.participations);
  const verifiedParticipations = allParticipations.filter(p => p.status === 'VERIFIED');
  
  return allParticipations.length > 0 ? 
    verifiedParticipations.length / allParticipations.length : 0;
}

/**
 * Calculate cause diversity from events
 */
function calculateCauseDiversity(events: any[]): number {
  const uniqueSDGs = new Set(events.map(e => e.sdg).filter(Boolean));
  return Math.min(uniqueSDGs.size / 10, 1); // Max 10 SDGs = 100%
}

/**
 * Compute Environmental score based on active member ratio
 * @param activeMembers - Number of active members
 * @param totalMembers - Total number of members
 * @returns Environmental score (0-1)
 */
export function computeE(activeMembers: number, totalMembers: number): number {
  if (totalMembers <= 0) return 0;
  return (activeMembers / totalMembers) * 0.25;
}

/**
 * Compute Hours score based on volunteer hours per member
 * @param totalHours - Total volunteer hours
 * @param totalMembers - Total number of members
 * @returns Hours score (0-1)
 */
export function computeH(totalHours: number, totalMembers: number): number {
  const ratio = totalMembers > 0 ? totalHours / totalMembers : 0;
  return Math.log10(ratio + 1) * 0.15;
}

/**
 * Compute Quality score based on verified events
 * @param verifiedEvents - Number of verified events
 * @returns Quality score (0-1)
 */
export function computeQ(verifiedEvents: number): number { 
  return Math.min(verifiedEvents * 0.001, 0.10); 
}

/**
 * Compute Verification score (placeholder)
 * @param _ - Placeholder parameter
 * @returns Verification score (0-1)
 */
export function computeV(_: number): number { 
  return 0; // TODO: replace with canonical formula
}

/**
 * Compute Social score (placeholder)
 * @param _ - Placeholder parameter
 * @returns Social score (0-1)
 */
export function computeS(_: number): number { 
  return 0; // TODO: replace with canonical formula
}

/**
 * Compute Cause score (placeholder)
 * @param _ - Placeholder parameter
 * @returns Cause score (0-1)
 */
export function computeC(_: number): number { 
  return 0; // TODO: replace with canonical formula
}

/**
 * Compute overall organization score
 * @param E - Environmental score
 * @param H - Hours score
 * @param Q - Quality score
 * @param V - Verification score
 * @param S - Social score
 * @param C - Cause score
 * @param G - Governance multiplier
 * @returns Overall score
 */
export function computeOrgScore(E: number, H: number, Q: number, V: number, S: number, C: number, G: number): number {
  return (E + H + Q + V + S + C) * G * 100;
}

/**
 * Calculate predicted component deltas for an event
 * @param template - Event template with impact factors
 * @param participants - Number of participants
 * @param durationHours - Duration in hours
 * @returns Predicted deltas for each component
 */
export function calculateEventDeltas(
  template: {
    impact_E_perParticipant: number;
    impact_E_perHourPerParticipant: number;
    impact_E_perEvent: number;
    impact_H_perParticipant: number;
    impact_H_perHourPerParticipant: number;
    impact_H_perEvent: number;
    impact_Q_perParticipant: number;
    impact_Q_perHourPerParticipant: number;
    impact_Q_perEvent: number;
    impact_V_perParticipant: number;
    impact_V_perHourPerParticipant: number;
    impact_V_perEvent: number;
    impact_S_perParticipant: number;
    impact_S_perHourPerParticipant: number;
    impact_S_perEvent: number;
    impact_C_perParticipant: number;
    impact_C_perHourPerParticipant: number;
    impact_C_perEvent: number;
    gPolicyModifier: number;
  },
  participants: number,
  durationHours: number
): {
  E: number; H: number; Q: number; V: number; S: number; C: number; G: number;
} {
  const totalHours = participants * durationHours;
  
  return {
    E: template.impact_E_perEvent + 
       (template.impact_E_perParticipant * participants) + 
       (template.impact_E_perHourPerParticipant * totalHours),
    H: template.impact_H_perEvent + 
       (template.impact_H_perParticipant * participants) + 
       (template.impact_H_perHourPerParticipant * totalHours),
    Q: template.impact_Q_perEvent + 
       (template.impact_Q_perParticipant * participants) + 
       (template.impact_Q_perHourPerParticipant * totalHours),
    V: template.impact_V_perEvent + 
       (template.impact_V_perParticipant * participants) + 
       (template.impact_V_perHourPerParticipant * totalHours),
    S: template.impact_S_perEvent + 
       (template.impact_S_perParticipant * participants) + 
       (template.impact_S_perHourPerParticipant * totalHours),
    C: template.impact_C_perEvent + 
       (template.impact_C_perParticipant * participants) + 
       (template.impact_C_perHourPerParticipant * totalHours),
    G: template.gPolicyModifier,
  };
}
