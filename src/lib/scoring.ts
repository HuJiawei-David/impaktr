// home/ubuntu/impaktrweb/src/lib/scoring.ts

import { prisma } from './prisma';
import { ParticipationStatus } from '@prisma/client';

export async function calculateImpaktrScore(userId: string): Promise<number> {
  // Get all verified participations for the user
  const participations = await prisma.participation.findMany({
    where: {
      userId,
      status: ParticipationStatus.VERIFIED,
    },
    include: {
      event: true,
      verifications: true,
    },
  });

  if (participations.length === 0) {
    return 0;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
    },
  });

  if (!user) return 0;

  let totalScore = 0;

  for (const participation of participations) {
    // H = Hours component (log-scaled)
    const hours = participation.hoursActual || participation.hoursCommitted;
    const H = Math.log10(hours + 1) * 100;

    // I = Intensity multiplier (0.8-1.2)
    const I = participation.event.intensity || 1.0;

    // S = Skill multiplier (1.0-1.4)
    const S = participation.skillMultiplier || 1.0;

    // Q = Quality rating (0.5-1.5)
    const Q = participation.qualityRating || 1.0;

    // V = Verification factor (0.8-1.1)
    let V = 0.8; // Self verification
    if (participation.verifications.some(v => v.type === 'ORGANIZER')) {
      V = 1.0; // Organizer verification
    } else if (participation.verifications.some(v => v.type === 'PEER')) {
      V = 1.1; // Peer + proof verification
    } else if (participation.verifications.some(v => v.type === 'GPS')) {
      V = 1.05; // GPS verification
    }

    // L = Location fairness multiplier (0.8-1.2)
    // This would be based on country/region cost of living or volunteer opportunity density
    // For now, we'll use a default value
    const L = getLocationMultiplier(user.profile?.location as any);

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
                include: { event: true }
              }
            }
          }
        }
      },
      events: {
        include: {
          participations: {
            where: { status: ParticipationStatus.VERIFIED }
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

  // H = Hours per employee (15%)
  const totalHours = organization.members.reduce((sum, member) => {
    const memberHours = member.user.participations.reduce((h, p) => 
      h + (p.hoursActual || p.hoursCommitted), 0);
    return sum + memberHours;
  }, 0);
  const H = Math.log10((totalHours / totalMembers) + 1) * 0.15;

  // Q = Quality rating (15%)
  const allParticipations = organization.members.flatMap(m => m.user.participations);
  const avgQuality = allParticipations.reduce((sum, p) => 
    sum + (p.qualityRating || 1.0), 0) / Math.max(allParticipations.length, 1);
  const Q = avgQuality * 0.15;

  // V = Verification % (10%)
  const verifiedCount = allParticipations.length;
  const totalParticipations = organization.members.reduce((sum, member) => 
    sum + member.user.participations.length, 0);
  const V = (verifiedCount / Math.max(totalParticipations, 1)) * 0.10;

  // S = Skills impact % (15%)
  const skilledParticipations = allParticipations.filter(p => 
    (p.skillMultiplier || 1.0) > 1.0).length;
  const S = (skilledParticipations / Math.max(allParticipations.length, 1)) * 0.15;

  // C = Cause diversity (10%)
  const uniqueSDGs = new Set();
  allParticipations.forEach(p => {
    p.event.sdgTags.forEach(sdg => uniqueSDGs.add(sdg));
  });
  const C = Math.min(uniqueSDGs.size / 17, 1) * 0.10;

  // G = Global fairness factor (0.8-1.2)
  const G = 1.0; // Default for now

  const score = (E + H + Q + V + S + C) * G * 100;
  return Math.min(Math.round(score * 10) / 10, 100);
}

function getLocationMultiplier(location: any): number {
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