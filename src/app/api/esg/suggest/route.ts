import { NextRequest, NextResponse } from 'next/server';
import { getSuggestion } from '@/lib/esg/suggestion/SuggestionEngine';
import { SuggestionRequestSchema } from '@/lib/esg/suggestion/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = SuggestionRequestSchema.parse(body);
    
    // Get organizationId from request or use a default
    const organizationId = body.organizationId;
    
    // Generate suggestions
    const result = await getSuggestion(validatedData, organizationId);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
