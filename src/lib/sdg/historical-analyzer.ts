/**
 * Historical Data Analyzer
 * Analyzes historical events to provide SDG recommendations based on similar past events
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HistoricalMatch {
  eventId: string;
  eventTitle: string;
  similarity: number;
  sdgs: number[];
}

export interface HistoricalSDGRecommendation {
  sdgNumber: number;
  frequency: number;
  confidence: number;
  reasoning: string;
  similarEvents: string[];
}

/**
 * Calculate text similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const matrix: number[][] = [];
  const len1 = s1.length;
  const len2 = s2.length;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  return maxLen === 0 ? 1.0 : 1 - (distance / maxLen);
}

/**
 * Calculate similarity based on word overlap
 */
function calculateWordOverlap(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate combined similarity score
 */
function calculateCombinedSimilarity(title1: string, title2: string): number {
  const levenshteinScore = calculateSimilarity(title1, title2);
  const wordOverlapScore = calculateWordOverlap(title1, title2);
  
  // Weighted average: word overlap is more important for event titles
  return (levenshteinScore * 0.3) + (wordOverlapScore * 0.7);
}

/**
 * Find similar historical events
 */
export async function findSimilarEvents(
  title: string,
  limit: number = 20,
  minSimilarity: number = 0.3
): Promise<HistoricalMatch[]> {
  try {
    // Fetch recent events with SDG tags
    const events = await prisma.event.findMany({
      where: {
        sdg: {
          not: null // Only events with SDG tags
        },
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        id: true,
        title: true,
        sdg: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 200 // Analyze last 200 events
    });

    // Calculate similarity for each event
    const matches: HistoricalMatch[] = [];

    for (const event of events) {
      const similarity = calculateCombinedSimilarity(title, event.title);

      if (similarity >= minSimilarity && event.sdg) {
        matches.push({
          eventId: event.id,
          eventTitle: event.title,
          similarity,
          sdgs: [parseInt(event.sdg.replace('SDG', ''))]
        });
      }
    }

    // Sort by similarity (descending)
    matches.sort((a, b) => b.similarity - a.similarity);

    return matches.slice(0, limit);
  } catch (error) {
    console.error('Error finding similar events:', error);
    return [];
  }
}

/**
 * Analyze historical events to recommend SDGs
 */
export async function analyzeHistoricalData(
  title: string,
  options: {
    minSimilarity?: number;
    maxEvents?: number;
    minFrequency?: number;
  } = {}
): Promise<HistoricalSDGRecommendation[]> {
  const {
    minSimilarity = 0.3,
    maxEvents = 20,
    minFrequency = 2
  } = options;

  try {
    // Find similar events
    const similarEvents = await findSimilarEvents(title, maxEvents, minSimilarity);

    if (similarEvents.length === 0) {
      return [];
    }

    // Aggregate SDG frequencies
    const sdgData = new Map<number, {
      frequency: number;
      totalSimilarity: number;
      events: string[];
    }>();

    for (const event of similarEvents) {
      for (const sdgNumber of event.sdgs) {
        const existing = sdgData.get(sdgNumber);
        
        if (existing) {
          existing.frequency++;
          existing.totalSimilarity += event.similarity;
          existing.events.push(event.eventTitle);
        } else {
          sdgData.set(sdgNumber, {
            frequency: 1,
            totalSimilarity: event.similarity,
            events: [event.eventTitle]
          });
        }
      }
    }

    // Convert to recommendations
    const recommendations: HistoricalSDGRecommendation[] = [];

    for (const [sdgNumber, data] of sdgData.entries()) {
      if (data.frequency >= minFrequency) {
        // Calculate confidence based on frequency and similarity
        const frequencyScore = Math.min(data.frequency / similarEvents.length, 1);
        const avgSimilarity = data.totalSimilarity / data.frequency;
        const confidence = (frequencyScore * 0.6) + (avgSimilarity * 0.4);

        // Generate reasoning
        const percentage = Math.round((data.frequency / similarEvents.length) * 100);
        const reasoning = `Found in ${data.frequency} of ${similarEvents.length} similar events (${percentage}%)`;

        recommendations.push({
          sdgNumber,
          frequency: data.frequency,
          confidence,
          reasoning,
          similarEvents: data.events.slice(0, 3) // Top 3 similar events
        });
      }
    }

    // Sort by confidence (descending)
    recommendations.sort((a, b) => b.confidence - a.confidence);

    return recommendations;
  } catch (error) {
    console.error('Error analyzing historical data:', error);
    return [];
  }
}

/**
 * Get SDG co-occurrence patterns
 * Analyzes which SDGs are commonly used together
 */
export async function getSDGCooccurrence(sdgs: number[]): Promise<Map<number, number>> {
  try {
    if (sdgs.length === 0) {
      return new Map();
    }

    // Find events that have any of the provided SDGs
    const events = await prisma.event.findMany({
      where: {
        sdg: {
          in: sdgs.map(sdg => `SDG${sdg}`)
        }
      },
      select: {
        sdg: true
      },
      take: 500
    });

    // Count co-occurrences
    const cooccurrence = new Map<number, number>();

    for (const event of events) {
      if (event.sdg) {
        const eventSDG = parseInt(event.sdg.replace('SDG', ''));
        const hasAnyInputSDG = sdgs.includes(eventSDG);

        if (hasAnyInputSDG) {
          // For single SDG events, we can't calculate co-occurrence
          // This function might need to be redesigned for single SDG events
          continue;
        }
      }
    }

    return cooccurrence;
  } catch (error) {
    console.error('Error getting SDG co-occurrence:', error);
    return new Map();
  }
}

/**
 * Get organization's SDG preferences
 */
export async function getOrganizationSDGPreferences(
  organizationId?: string
): Promise<Map<number, number>> {
  try {
    if (!organizationId) {
      return new Map();
    }

    // Get organization's past events
    const events = await prisma.event.findMany({
      where: {
        organizationId,
        sdg: {
          not: null
        }
      },
      select: {
        sdg: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Last 50 events
    });

    // Count SDG frequency
    const sdgFrequency = new Map<number, number>();

    for (const event of events) {
      if (event.sdg) {
        const sdg = parseInt(event.sdg.replace('SDG', ''));
        sdgFrequency.set(sdg, (sdgFrequency.get(sdg) || 0) + 1);
      }
    }

    return sdgFrequency;
  } catch (error) {
    console.error('Error getting organization SDG preferences:', error);
    return new Map();
  }
}

/**
 * Cleanup function to close Prisma connection
 */
export async function cleanup() {
  await prisma.$disconnect();
}

