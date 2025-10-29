/**
 * SDG Recommendation Engine
 * Combines multiple analysis methods to provide intelligent SDG recommendations
 */

import { analyzeEventTitle, SDGMatch } from './event-title-analyzer';
import {
  analyzeHistoricalData,
  getOrganizationSDGPreferences,
  getSDGCooccurrence,
  HistoricalSDGRecommendation
} from './historical-analyzer';
import { getSDGInfo } from './sdg-keywords';

export interface SDGRecommendation {
  sdgNumber: number;
  sdgName: string;
  confidence: number;
  score: number;
  reasoning: string[];
  keywords: string[];
  color: string;
  sources: {
    titleAnalysis?: number;
    historicalData?: number;
    organizationPreference?: number;
    cooccurrence?: number;
  };
}

export interface RecommendationOptions {
  minConfidence?: number;
  maxRecommendations?: number;
  includeHistorical?: boolean;
  organizationId?: string;
  contextSDGs?: number[]; // Already selected SDGs for co-occurrence analysis
}

/**
 * Normalize scores to 0-1 range
 */
function normalizeScore(score: number, max: number): number {
  return Math.min(score / max, 1);
}

/**
 * Combine multiple recommendation sources
 */
async function combineRecommendations(
  titleMatches: SDGMatch[],
  historicalRecommendations: HistoricalSDGRecommendation[],
  organizationPreferences: Map<number, number>,
  cooccurrence: Map<number, number>
): Promise<Map<number, SDGRecommendation>> {
  const combined = new Map<number, SDGRecommendation>();

  // Get all unique SDG numbers
  const allSDGs = new Set<number>();
  titleMatches.forEach(m => allSDGs.add(m.sdgNumber));
  historicalRecommendations.forEach(r => allSDGs.add(r.sdgNumber));
  organizationPreferences.forEach((_, sdg) => allSDGs.add(sdg));
  cooccurrence.forEach((_, sdg) => allSDGs.add(sdg));

  // Normalize organization preferences
  const maxOrgPreference = Math.max(...Array.from(organizationPreferences.values()), 1);
  const maxCooccurrence = Math.max(...Array.from(cooccurrence.values()), 1);

  for (const sdgNumber of allSDGs) {
    const sdgInfo = getSDGInfo(sdgNumber);
    if (!sdgInfo) continue;

    const reasoning: string[] = [];
    const keywords: string[] = [];
    const sources: SDGRecommendation['sources'] = {};

    let totalScore = 0;
    let sourceCount = 0;

    // Title analysis contribution (40% weight)
    const titleMatch = titleMatches.find(m => m.sdgNumber === sdgNumber);
    if (titleMatch) {
      const titleScore = titleMatch.confidence * 0.4;
      totalScore += titleScore;
      sourceCount++;
      sources.titleAnalysis = titleMatch.confidence;
      
      reasoning.push(titleMatch.reasoning);
      keywords.push(...titleMatch.matches.map(m => m.keyword));
    }

    // Historical data contribution (35% weight)
    const historicalMatch = historicalRecommendations.find(r => r.sdgNumber === sdgNumber);
    if (historicalMatch) {
      const historicalScore = historicalMatch.confidence * 0.35;
      totalScore += historicalScore;
      sourceCount++;
      sources.historicalData = historicalMatch.confidence;
      
      reasoning.push(historicalMatch.reasoning);
      if (historicalMatch.similarEvents.length > 0) {
        reasoning.push(`Similar to: "${historicalMatch.similarEvents[0]}"`);
      }
    }

    // Organization preference contribution (15% weight)
    const orgPreference = organizationPreferences.get(sdgNumber);
    if (orgPreference) {
      const normalizedPref = normalizeScore(orgPreference, maxOrgPreference);
      const orgScore = normalizedPref * 0.15;
      totalScore += orgScore;
      sourceCount++;
      sources.organizationPreference = normalizedPref;
      
      reasoning.push(`Your organization frequently uses this SDG (${orgPreference} times)`);
    }

    // Co-occurrence contribution (10% weight)
    const cooccurrenceCount = cooccurrence.get(sdgNumber);
    if (cooccurrenceCount) {
      const normalizedCooc = normalizeScore(cooccurrenceCount, maxCooccurrence);
      const coocScore = normalizedCooc * 0.1;
      totalScore += coocScore;
      sourceCount++;
      sources.cooccurrence = normalizedCooc;
      
      reasoning.push(`Often paired with your selected SDGs (${cooccurrenceCount} events)`);
    }

    // Calculate final confidence
    const confidence = sourceCount > 0 ? totalScore : 0;

    if (confidence > 0) {
      combined.set(sdgNumber, {
        sdgNumber,
        sdgName: sdgInfo.name,
        confidence,
        score: totalScore,
        reasoning: reasoning.filter((r, i, arr) => arr.indexOf(r) === i), // Remove duplicates
        keywords: keywords.filter((k, i, arr) => arr.indexOf(k) === i).slice(0, 5), // Top 5 unique keywords
        color: sdgInfo.color,
        sources
      });
    }
  }

  return combined;
}

/**
 * Main recommendation engine
 */
export async function generateSDGRecommendations(
  title: string,
  options: RecommendationOptions & { description?: string } = {}
): Promise<SDGRecommendation[]> {
  const {
    minConfidence = 0.5,
    maxRecommendations = 5,
    includeHistorical = true,
    organizationId,
    contextSDGs = [],
    description
  } = options;

  try {
    // 1. Analyze event title and description
    const titleMatches = analyzeEventTitle(title, description);

    // 2. Analyze historical data (if enabled)
    let historicalRecommendations: HistoricalSDGRecommendation[] = [];
    if (includeHistorical && title.trim().length > 0) {
      historicalRecommendations = await analyzeHistoricalData(title, {
        minSimilarity: 0.3,
        maxEvents: 20,
        minFrequency: 2
      });
    }

    // 3. Get organization preferences
    let organizationPreferences = new Map<number, number>();
    if (organizationId) {
      organizationPreferences = await getOrganizationSDGPreferences(organizationId);
    }

    // 4. Get SDG co-occurrence patterns
    let cooccurrence = new Map<number, number>();
    if (contextSDGs.length > 0) {
      cooccurrence = await getSDGCooccurrence(contextSDGs);
    }

    // 5. Combine all recommendations
    const combinedRecommendations = await combineRecommendations(
      titleMatches,
      historicalRecommendations,
      organizationPreferences,
      cooccurrence
    );

    // 6. Filter and sort
    const recommendations = Array.from(combinedRecommendations.values())
      .filter(rec => rec.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxRecommendations);

    return recommendations;
  } catch (error) {
    console.error('Error generating SDG recommendations:', error);
    return [];
  }
}

/**
 * Get explanation for a recommended SDG
 */
export function explainRecommendation(recommendation: SDGRecommendation): string {
  const parts: string[] = [];

  parts.push(`SDG ${recommendation.sdgNumber}: ${recommendation.sdgName}`);
  parts.push(`Confidence: ${(recommendation.confidence * 100).toFixed(1)}%`);
  
  if (recommendation.sources.titleAnalysis) {
    parts.push(`✓ Title match (${(recommendation.sources.titleAnalysis * 100).toFixed(0)}%)`);
  }
  
  if (recommendation.sources.historicalData) {
    parts.push(`✓ Similar events (${(recommendation.sources.historicalData * 100).toFixed(0)}%)`);
  }
  
  if (recommendation.sources.organizationPreference) {
    parts.push(`✓ Organization preference`);
  }
  
  if (recommendation.sources.cooccurrence) {
    parts.push(`✓ Related to selected SDGs`);
  }

  if (recommendation.keywords.length > 0) {
    parts.push(`Keywords: ${recommendation.keywords.slice(0, 3).join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Quick recommendation (title and description analysis only, no database queries)
 */
export function getQuickRecommendations(
  title: string,
  options: {
    minConfidence?: number;
    maxRecommendations?: number;
    description?: string;
  } = {}
): SDGRecommendation[] {
  const {
    minConfidence = 0.5,
    maxRecommendations = 5,
    description
  } = options;

  const titleMatches = analyzeEventTitle(title, description);

  const recommendations: SDGRecommendation[] = titleMatches
    .filter(match => match.confidence >= minConfidence)
    .map(match => {
      const sdgInfo = getSDGInfo(match.sdgNumber);
      
      return {
        sdgNumber: match.sdgNumber,
        sdgName: sdgInfo?.name || `SDG ${match.sdgNumber}`,
        confidence: match.confidence,
        score: match.score,
        reasoning: [match.reasoning],
        keywords: match.matches.map(m => m.keyword).slice(0, 5),
        color: sdgInfo?.color || '#000000',
        sources: {
          titleAnalysis: match.confidence
        }
      };
    })
    .slice(0, maxRecommendations);

  return recommendations;
}

/**
 * Validate recommended SDGs against existing selection
 */
export function validateRecommendations(
  recommendations: SDGRecommendation[],
  existingSDGs: number[]
): {
  new: SDGRecommendation[];
  existing: SDGRecommendation[];
} {
  const newRecs: SDGRecommendation[] = [];
  const existingRecs: SDGRecommendation[] = [];

  for (const rec of recommendations) {
    if (existingSDGs.includes(rec.sdgNumber)) {
      existingRecs.push(rec);
    } else {
      newRecs.push(rec);
    }
  }

  return { new: newRecs, existing: existingRecs };
}

/**
 * Get confidence level description
 */
export function getConfidenceLevel(confidence: number): {
  level: 'very-high' | 'high' | 'medium' | 'low';
  label: string;
  description: string;
} {
  if (confidence >= 0.8) {
    return {
      level: 'very-high',
      label: 'Very High',
      description: 'Strong match - highly recommended'
    };
  } else if (confidence >= 0.65) {
    return {
      level: 'high',
      label: 'High',
      description: 'Good match - recommended'
    };
  } else if (confidence >= 0.5) {
    return {
      level: 'medium',
      label: 'Medium',
      description: 'Moderate match - consider adding'
    };
  } else {
    return {
      level: 'low',
      label: 'Low',
      description: 'Weak match - optional'
    };
  }
}

