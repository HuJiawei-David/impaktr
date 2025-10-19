// home/ubuntu/impaktrweb/src/lib/scoring.ts

import { prisma } from './prisma';
import { ParticipationStatus } from '@/types/enums';

export async function calculateImpaktrScore(userId: string): Promise<number> {
  // Get all verified participations for the user
  const participations = await prisma.participation.findMany({
    where: {
      userId,
      status: ParticipationStatus.VERIFIED,
    },
    include: {
      event: true,
      verifications: {
        where: { status: 'APPROVED' }
      }
    },
  });

  if (participations.length === 0) {
    return 0;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      volunteerProfile: true
    },
  });

  if (!user) return 0;

  let totalScore = 0;

  for (const participation of participations) {
    // H = Hours component (log-scaled)
    const hours = participation.hours || 0;
    const H = Math.log10(hours + 1) * 100;

    // I = Intensity multiplier (0.8-1.2) - Based on event type
    const I = getEventIntensity(participation.event);

    // S = Skill multiplier (1.0-1.4) - Based on user skills matching event requirements
    const S = getSkillMultiplier(participation, user);

    // Q = Quality rating (0.5-1.5) - Based on verification ratings
    const Q = getQualityRating(participation);

    // V = Verification factor (0.8-1.1) - Based on verification type
    const V = getVerificationFactor(participation);

    // L = Location fairness multiplier (0.8-1.2)
    const L = getLocationMultiplier({ country: user.country || undefined });

    // Calculate participation score
    const participationScore = (H * I * S * Q * V) * L;
    totalScore += participationScore;
  }

  // Apply diminishing returns for very high scores
  const finalScore = Math.min(totalScore * 0.1, 1000);

  return Math.round(finalScore * 10) / 10; // Round to 1 decimal place
}

export async function calculateOrganizationScore(organizationId: string): Promise<number> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        include: {
          user: {
            include: {
              participations: {
                where: { status: ParticipationStatus.VERIFIED },
                include: { 
                  event: true,
                  verifications: {
                    where: { status: 'APPROVED' }
                  }
                }
              }
            }
          }
        }
      },
      events: {
        include: {
          participations: {
            where: { status: ParticipationStatus.VERIFIED },
            include: { 
              user: true,
              verifications: {
                where: { status: 'APPROVED' }
              }
            }
          }
        }
      }
    }
  });

  if (!organization) return 0;

  const totalMembers = organization.members.length;
  if (totalMembers === 0) return 0;

  // E = Employee participation % (25%)
  const activeMembers = organization.members.filter(
    member => member.user.participations.length > 0
  ).length;
  const E = (activeMembers / totalMembers) * 0.25;

  // H = Hours per employee (15%) - NOW INCLUDES ALL VOLUNTEER HOURS
  const totalHours = organization.events.reduce((sum, event) => {
    return sum + event.participations.reduce((eventSum, p) => {
      return eventSum + (p.hours || 0);
    }, 0);
  }, 0);
  const H = Math.log10((totalHours / totalMembers) + 1) * 0.15;

  // Q = Quality rating (15%) - NOW USES ACTUAL VERIFICATION RATINGS
  const allParticipations = organization.events.flatMap(event => event.participations);
  const avgQuality = allParticipations.reduce((sum, p) => {
    // Use verification rating if available, otherwise default to 1.0
    const verification = p.verifications?.find(v => v.status === 'APPROVED');
    return sum + (verification?.rating || 1.0);
  }, 0) / Math.max(allParticipations.length, 1);
  const Q = avgQuality * 0.15;

  // V = Verification % (10%) - NOW INCLUDES ALL PARTICIPATIONS
  const verifiedCount = allParticipations.length;
  const totalParticipations = organization.events.reduce((sum, event) => 
    sum + event.participations.length, 0);
  const V = (verifiedCount / Math.max(totalParticipations, 1)) * 0.10;

  // S = Skills impact % (15%) - NOW REWARDS SKILL-BASED PARTICIPATION
  const skilledParticipations = allParticipations.filter(p => {
    // Check if user has skills in volunteer profile
    return p.user.volunteerProfile?.skills && p.user.volunteerProfile.skills.length > 0;
  }).length;
  const S = (skilledParticipations / Math.max(allParticipations.length, 1)) * 0.15;

  // I = Innovation factor (10%) - NEW COMPONENT FOR EVENT DIVERSITY
  const uniqueEventTypes = new Set(organization.events.map(e => e.type)).size;
  const I = Math.min(uniqueEventTypes / 5, 1) * 0.10;

  // C = Community reach (10%) - REDEFINED AS UNIQUE PARTICIPANTS
  const uniqueParticipants = new Set(allParticipations.map(p => p.userId)).size;
  const C = Math.min(uniqueParticipants / 100, 1) * 0.10;

  // G = Global fairness factor (0.8-1.2)
  const G = 1.0; // Default for now

  const score = (E + H + Q + V + S + I + C) * G * 1000;
  return Math.round(score * 10) / 10;
}

function getLocationMultiplier(location: { country?: string } | null | undefined): number {
  if (!location?.country) return 1.0;

  // Location multipliers based on volunteer opportunity density and cost of living
  // This would ideally come from a comprehensive database
  const countryMultipliers: { [key: string]: number } = {
    // Developed countries with high volunteer opportunities
    'United States': 1.0,
    'Canada': 1.0,
    'United Kingdom': 1.0,
    'Germany': 1.0,
    'France': 1.0,
    'Australia': 1.0,
    'Japan': 1.0,
    'South Korea': 1.0,
    'Singapore': 1.0,
    'Netherlands': 1.0,
    'Sweden': 1.0,
    'Norway': 1.0,
    'Denmark': 1.0,
    'Switzerland': 0.9, // High cost of living
    
    // Developing countries - boost to encourage participation
    'Malaysia': 1.1,
    'Thailand': 1.1,
    'Indonesia': 1.2,
    'Philippines': 1.2,
    'Vietnam': 1.2,
    'India': 1.2,
    'Bangladesh': 1.3,
    'Pakistan': 1.3,
    'Nigeria': 1.3,
    'Kenya': 1.3,
    'Ghana': 1.3,
    'South Africa': 1.1,
    'Brazil': 1.1,
    'Mexico': 1.1,
    'Argentina': 1.1,
    'Colombia': 1.2,
    'Peru': 1.2,
    'Ecuador': 1.2,
    'Bolivia': 1.3,
    
    // Default for other countries
  };

  return countryMultipliers[location.country] || 1.0;
}

// Helper functions for individual scoring multipliers

function getEventIntensity(event: any): number {
  // Use the event's intensity field if available, otherwise fallback to type-based mapping
  if (event.intensity && event.intensity !== 1.0) {
    return event.intensity;
  }
  
  // Fallback intensity multipliers based on event type
  const intensityMap: { [key: string]: number } = {
    'VOLUNTEERING': 1.0,    // Standard volunteering
    'WORKSHOP': 1.1,        // Educational workshops
    'FUNDRAISER': 1.2,      // Fundraising events
    'CLEANUP': 0.9,         // Environmental cleanup
    'AWARENESS': 1.0,       // Awareness campaigns
    'OTHER': 1.0            // Default
  };
  
  return intensityMap[event.type] || 1.0;
}

function getSkillMultiplier(participation: any, user: any): number {
  // Base multiplier
  let multiplier = 1.0;
  
  // Check if user has skills in volunteer profile
  if (user.volunteerProfile?.skills && user.volunteerProfile.skills.length > 0) {
    multiplier += 0.2; // +20% for having skills
  }
  
  // Check if event has specific skills requirements (if implemented)
  if (participation.event.skills && participation.event.skills.length > 0) {
    multiplier += 0.2; // +20% for skill-based events
    
    // Bonus if user's skills match event requirements
    if (user.volunteerProfile?.skills) {
      const matchingSkills = user.volunteerProfile.skills.filter((skill: string) =>
        participation.event.skills.some((eventSkill: string) =>
          eventSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(eventSkill.toLowerCase())
        )
      );
      
      if (matchingSkills.length > 0) {
        multiplier += 0.1; // Additional bonus for skill matching
      }
    }
  }
  
  return Math.min(multiplier, 1.4); // Cap at 1.4
}

function getQualityRating(participation: any): number {
  // Use verification rating if available
  if (participation.verifications && participation.verifications.length > 0) {
    const verification = participation.verifications.find((v: any) => v.status === 'APPROVED');
    if (verification?.rating) {
      return Math.max(0.5, Math.min(verification.rating, 1.5)); // Clamp between 0.5-1.5
    }
  }
  
  // Default quality rating
  return 1.0;
}

function getVerificationFactor(participation: any): number {
  // Verification multipliers based on type
  const verificationMap: { [key: string]: number } = {
    'SELF': 0.8,        // Self-verification (lower trust)
    'ORGANIZER': 1.1,   // Organization verification (higher trust)
    'PEER': 1.0,        // Peer verification (standard)
    'GPS': 1.05         // GPS verification (slightly higher)
  };
  
  if (participation.verifications && participation.verifications.length > 0) {
    const verification = participation.verifications.find((v: any) => v.status === 'APPROVED');
    if (verification?.type) {
      return verificationMap[verification.type] || 1.0;
    }
  }
  
  return 1.0; // Default verification factor
}