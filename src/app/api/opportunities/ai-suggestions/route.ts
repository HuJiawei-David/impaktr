import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recommendOpportunities } from '@/lib/opportunity/opportunity-recommendation-engine';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'from', 'that', 'this', 'have', 'will',
  'into', 'about', 'without', 'you', 'are', 'its', 'their', 'them', 'they',
  'looking', 'seeking', 'need', 'like', 'love'
]);

const SYNONYMS: Record<string, string[]> = {
  animal: ['wildlife', 'pet', 'animals', 'veterinary', 'shelter'],
  wildlife: ['animal', 'conservation', 'ecosystem'],
  sustainability: ['environment', 'green', 'climate', 'eco'],
  environment: ['climate', 'ecology', 'sustainability'],
  finance: ['financial', 'investment', 'budget', 'economics'],
  design: ['creative', 'graphics', 'visual', 'ux', 'ui'],
  policy: ['legislative', 'advocacy', 'government'],
  health: ['medical', 'wellness', 'care'],
  data: ['analytics', 'analysis', 'insights', 'statistics'],
  education: ['teaching', 'school', 'learning', 'tutoring'],
};

type AssistantFilters = {
  status?: string;
  location?: string;
  sdg?: string[];
};

type SuggestionRequestBody = {
  prompt?: string;
  filters?: AssistantFilters;
};

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set<string>();
  tokens.forEach((token) => {
    expanded.add(token);
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach((syn) => expanded.add(syn));
    }
  });
  return Array.from(expanded);
}

async function fetchFallback(limit: number, appliedSet?: Set<string>) {
  const fallbackOps = await prisma.opportunity.findMany({
    where: { status: 'OPEN' },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      organization: {
        select: { id: true, name: true, logo: true },
      },
    },
    take: limit,
  });

  return fallbackOps.map((opportunity) => ({
    id: opportunity.id,
    title: opportunity.title,
    description: opportunity.description,
    organization: opportunity.organization,
    location: opportunity.location,
    sdg: opportunity.sdg,
    skills: opportunity.skills,
    highlight: [],
    isApplied: appliedSet?.has(opportunity.id) ?? false,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = (await request.json()) as SuggestionRequestBody;
    const prompt = body.prompt ?? '';
    const filters: AssistantFilters = body.filters ? { ...body.filters } : {};

    let appliedIds: string[] = [];
    if (session?.user?.id) {
      const applications = await prisma.application.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          opportunityId: true,
        },
      });
      appliedIds = applications.map((app) => app.opportunityId);
    }
    const appliedSet = new Set(appliedIds);

    const promptText = typeof prompt === 'string' ? prompt.trim().toLowerCase() : '';
    const rawTokens = promptText
      .split(/\s+/)
      .map((token: string) => token.replace(/[^a-z0-9]/g, ''))
      .filter((token: string) => token.length >= 3 && !STOPWORDS.has(token));

    const tokens = expandTokens(rawTokens);

    if (tokens.length === 0) {
      const fallback = await fetchFallback(5, appliedSet);
      return NextResponse.json({
        suggestions: fallback,
        reason: 'fallback_prompt',
        summary: null,
        tags: [],
      });
    }

    const recommendations = await recommendOpportunities({
      promptTokens: tokens,
      filters,
      contextSDGs:
        filters.sdg?.map((sdgValue) => parseInt(sdgValue, 10)).filter((value) => Number.isFinite(value)) ?? [],
      take: 5,
    });

    const scored = recommendations.map((result) => ({
      id: result.opportunity.id,
      title: result.opportunity.title,
      description: result.opportunity.description,
      highlight: result.highlight,
      organization: result.opportunity.organization ?? null,
      location: result.opportunity.location ?? null,
      sdg: result.opportunity.sdg ?? null,
      skills: result.opportunity.skills ?? [],
      matchReason: result.matchReason.join(' — '),
      tags: result.tags,
      isApplied: appliedSet.has(result.opportunity.id),
    }));

    if (scored.length > 0) {
      return NextResponse.json({
        suggestions: scored,
        reason: 'success',
        summary: null,
        tags: [],
      });
    }

    const fallback = await fetchFallback(5, appliedSet);
    return NextResponse.json({
      suggestions: fallback,
      reason: 'fallback_nomatch',
      summary: null,
      tags: [],
    });
  } catch (error) {
    console.error('[AI Suggestions API] error:', error);
    return NextResponse.json({ suggestions: [], reason: 'error' }, { status: 500 });
  }
}
