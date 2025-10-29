/**
 * SDG Recommendations API
 * Provides intelligent SDG recommendations based on event title
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import {
  generateSDGRecommendations,
  getQuickRecommendations,
  validateRecommendations,
  getConfidenceLevel,
  SDGRecommendation
} from '@/lib/sdg/sdg-recommendation-engine';

export const dynamic = 'force-dynamic';

interface RecommendationRequest {
  title: string;
  description?: string;
  organizationId?: string;
  contextSDGs?: number[];
  mode?: 'quick' | 'full';
  minConfidence?: number;
  maxRecommendations?: number;
}

interface RecommendationResponse {
  success: boolean;
  recommendations: Array<SDGRecommendation & {
    confidenceLevel: ReturnType<typeof getConfidenceLevel>;
    isNew: boolean;
  }>;
  meta: {
    totalFound: number;
    title: string;
    mode: 'quick' | 'full';
    processingTime: number;
  };
  error?: string;
}

/**
 * POST /api/sdg/recommendations
 * Generate SDG recommendations based on event title
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json() as RecommendationRequest;
    const {
      title,
      description,
      organizationId,
      contextSDGs = [],
      mode = 'quick',
      minConfidence = 0.5,
      maxRecommendations = 5
    } = body;

    // Validate input
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is required and must be a string'
        },
        { status: 400 }
      );
    }

    if (title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title cannot be empty'
        },
        { status: 400 }
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is too long (max 500 characters)'
        },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description && typeof description !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Description must be a string'
        },
        { status: 400 }
      );
    }

    if (description && description.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Description is too long (max 2000 characters)'
        },
        { status: 400 }
      );
    }

    // Validate contextSDGs
    if (contextSDGs && !Array.isArray(contextSDGs)) {
      return NextResponse.json(
        {
          success: false,
          error: 'contextSDGs must be an array'
        },
        { status: 400 }
      );
    }

    if (contextSDGs.some(sdg => typeof sdg !== 'number' || sdg < 1 || sdg > 17)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid SDG numbers in contextSDGs (must be 1-17)'
        },
        { status: 400 }
      );
    }

    // Generate recommendations
    let recommendations: SDGRecommendation[] = [];

    if (mode === 'quick') {
      // Quick mode: title and description analysis only (no database queries)
      recommendations = getQuickRecommendations(title, {
        minConfidence,
        maxRecommendations,
        description
      });
    } else {
      // Full mode: includes historical data and organization preferences
      recommendations = await generateSDGRecommendations(title, {
        minConfidence,
        maxRecommendations,
        includeHistorical: true,
        organizationId,
        contextSDGs,
        description
      });
    }

    // Validate against existing SDGs
    const { new: newRecs, existing: existingRecs } = validateRecommendations(
      recommendations,
      contextSDGs
    );

    // Enrich recommendations with confidence levels and isNew flag
    const enrichedRecommendations = recommendations.map(rec => ({
      ...rec,
      confidenceLevel: getConfidenceLevel(rec.confidence),
      isNew: !contextSDGs.includes(rec.sdgNumber)
    }));

    const processingTime = Date.now() - startTime;

    const response: RecommendationResponse = {
      success: true,
      recommendations: enrichedRecommendations,
      meta: {
        totalFound: recommendations.length,
        title: title.substring(0, 100),
        mode,
        processingTime
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error generating SDG recommendations:', error);

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate recommendations',
        meta: {
          processingTime
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sdg/recommendations
 * Quick recommendation preview (for testing)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get title from query params
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title query parameter is required'
        },
        { status: 400 }
      );
    }

    // Quick recommendations
    const recommendations = getQuickRecommendations(title, {
      minConfidence: 0.3,
      maxRecommendations: 10
    });

    return NextResponse.json({
      success: true,
      recommendations,
      meta: {
        totalFound: recommendations.length,
        title,
        mode: 'quick'
      }
    });
  } catch (error) {
    console.error('Error in GET recommendations:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get recommendations'
      },
      { status: 500 }
    );
  }
}

