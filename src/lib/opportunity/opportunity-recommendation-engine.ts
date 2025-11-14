import { prisma } from '@/lib/prisma';
import { getSDGById } from '@/constants/sdgs';
import type { OpportunityStatus } from '@prisma/client';

type OpportunityRecord = {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  skills: string[];
  requirements: string[];
  sdg?: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
};

export type OpportunityRecommendation = {
  opportunity: OpportunityRecord;
  confidence: number;
  highlight: string[];
  matchReason: string[];
  tags: string[];
};

export type OpportunityRecommendationOptions = {
  promptTokens: string[];
  filters?: {
    sdg?: string[];
    location?: string;
    status?: string;
  };
  contextSDGs?: number[];
  take?: number;
};

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'your',
  'from',
  'that',
  'this',
  'have',
  'will',
  'into',
  'about',
  'without',
  'you',
  'are',
  'its',
  'their',
  'them',
  'they',
  'looking',
  'seeking',
  'need',
  'like',
  'love',
]);

const SYNONYM_MAP: Record<string, string[]> = {
  coding: ['software', 'developer', 'programmer', 'engineering'],
  volunteer: ['volunteering', 'community', 'service'],
  teaching: ['education', 'tutor', 'mentorship'],
  design: ['ux', 'ui', 'graphics', 'visual'],
  finance: ['financial', 'investment', 'budget'],
  sustainability: ['environment', 'climate', 'green'],
  healthcare: ['medical', 'wellness', 'health'],
  data: ['analytics', 'analysis', 'insights', 'statistics'],
  marketing: ['promotion', 'communications', 'social media'],
  leadership: ['manager', 'lead', 'coordinator'],
};

const TITLE_WEIGHT = 0.4;
const DESCRIPTION_WEIGHT = 0.25;
const SKILL_WEIGHT = 0.25;
const SDG_WEIGHT = 0.1;

function normalizeToken(token: string): string | null {
  const cleaned = token
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
  if (!cleaned || cleaned.length < 2 || STOPWORDS.has(cleaned)) {
    return null;
  }
  return cleaned;
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set<string>();
  for (const token of tokens) {
    expanded.add(token);
    const synonyms = SYNONYM_MAP[token];
    if (synonyms) {
      synonyms.forEach((syn) => expanded.add(syn));
    }
  }
  return Array.from(expanded);
}

function scoreTextMatch(haystack: string, tokens: string[]): { score: number; highlights: string[] } {
  let matched = 0;
  const highlights: string[] = [];
  for (const token of tokens) {
    if (haystack.includes(token)) {
      matched += 1;
      highlights.push(token);
    }
  }

  if (matched === 0) {
    return { score: 0, highlights: [] };
  }

  const score = Math.min(matched / tokens.length, 1);
  return { score, highlights };
}

function scoreSkillMatch(skills: string[], tokens: string[]): { score: number; highlights: string[] } {
  if (!skills || skills.length === 0) {
    return { score: 0, highlights: [] };
  }
  const skillText = skills.join(' ').toLowerCase();
  return scoreTextMatch(skillText, tokens);
}

function scoreSDGMatch(opportunity: OpportunityRecord, contextSDGs: number[]): { score: number; reasons: string[] } {
  if (!opportunity.sdg || contextSDGs.length === 0) {
    return { score: 0, reasons: [] };
  }
  const sdgNum = parseInt(opportunity.sdg, 10);
  if (!Number.isFinite(sdgNum)) {
    return { score: 0, reasons: [] };
  }
  if (!contextSDGs.includes(sdgNum)) {
    return { score: 0, reasons: [] };
  }
  const sdgInfo = getSDGById(sdgNum);
  const reason = sdgInfo ? `Aligns with your SDG ${sdgNum}: ${sdgInfo.title}` : `Matches SDG ${sdgNum}`;
  return { score: 1, reasons: [reason] };
}

function buildMatchReason(
  opportunity: OpportunityRecord,
  titleHighlights: string[],
  skillHighlights: string[],
  sdgReasons: string[],
) {
  const reasons: string[] = [];

  if (titleHighlights.length > 0) {
    reasons.push(`Title matches: ${Array.from(new Set(titleHighlights)).join(', ')}`);
  }
  if (skillHighlights.length > 0) {
    reasons.push(`Skills match: ${Array.from(new Set(skillHighlights)).join(', ')}`);
  }
  if (sdgReasons.length > 0) {
    reasons.push(...sdgReasons);
  }

  if (reasons.length === 0) {
    reasons.push('Relevant based on your prompt.');
  }

  return reasons;
}

function buildTags(opportunity: OpportunityRecord, skillHighlights: string[], sdgReasons: string[]) {
  const tags = new Set<string>();
  if (skillHighlights.length > 0) {
    skillHighlights.slice(0, 3).forEach((skill) => tags.add(skill));
  }
  if (opportunity.sdg) {
    const sdgInfo = getSDGById(parseInt(opportunity.sdg, 10));
    if (sdgInfo) {
      tags.add(`SDG ${sdgInfo.id}`);
    }
  }
  sdgReasons.forEach((reason) => tags.add(reason));
  return Array.from(tags);
}

export async function recommendOpportunities({
  promptTokens,
  filters,
  contextSDGs = [],
  take = 10,
}: OpportunityRecommendationOptions): Promise<OpportunityRecommendation[]> {
  if (promptTokens.length === 0) {
    return [];
  }

  const normalizedTokens = promptTokens
    .map(normalizeToken)
    .filter((token): token is string => Boolean(token));
  const expandedTokens = expandTokens(normalizedTokens);

  if (expandedTokens.length === 0) {
    return [];
  }

  const statusFilterValue = (filters?.status ?? 'OPEN') as OpportunityStatus;

  const opportunities = await prisma.opportunity.findMany({
    where: {
      status: {
        equals: statusFilterValue,
      },
      ...(filters?.sdg && filters.sdg.length > 0
        ? {
            sdg: {
              in: filters.sdg,
            },
          }
        : {}),
      ...(filters?.location
        ? {
            OR: [
              { location: { contains: filters.location, mode: 'insensitive' } },
              { description: { contains: filters.location, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 150,
  });

  const scored = opportunities
    .map((opportunity) => {
      const title = opportunity.title.toLowerCase();
      const description = opportunity.description?.toLowerCase() ?? '';
      const requirementsText = opportunity.requirements?.join(' ').toLowerCase() ?? '';

      const { score: titleScore, highlights: titleHighlights } = scoreTextMatch(title, expandedTokens);
      const { score: descriptionScore } = scoreTextMatch(description + ' ' + requirementsText, expandedTokens);
      const { score: skillScore, highlights: skillHighlights } = scoreSkillMatch(
        opportunity.skills ?? [],
        expandedTokens,
      );
      const { score: sdgScore, reasons: sdgReasons } = scoreSDGMatch(opportunity as OpportunityRecord, contextSDGs);

      const confidence =
        titleScore * TITLE_WEIGHT +
        descriptionScore * DESCRIPTION_WEIGHT +
        skillScore * SKILL_WEIGHT +
        sdgScore * SDG_WEIGHT;

      const highlight = Array.from(new Set([...titleHighlights, ...skillHighlights]));
      const matchReason = buildMatchReason(opportunity as OpportunityRecord, titleHighlights, skillHighlights, sdgReasons);
      const tags = buildTags(opportunity as OpportunityRecord, skillHighlights, sdgReasons);

      return {
        opportunity: opportunity as OpportunityRecord,
        confidence,
        highlight,
        matchReason,
        tags,
      };
    })
    .filter((result) => result.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, take);

  return scored;
}


