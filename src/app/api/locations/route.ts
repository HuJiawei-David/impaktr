import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('[API] /api/locations - Request received');
    
    // Verify Prisma client has the models
    if (!prisma.country || !prisma.state) {
      console.error('[API] Prisma client missing Country or State models');
      return NextResponse.json(
        { 
          error: 'Database models not available',
          details: 'Please restart the server and regenerate Prisma client',
          locations: ['Remote', 'United States', 'Malaysia', 'Singapore', 'Canada', 'Australia']
        },
        { status: 200 } // Return 200 with fallback data instead of 500
      );
    }
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    console.log('[API] Query:', query, 'Limit:', limit);

    // If query is empty or less than 2 characters, return popular locations (countries and major states)
    if (!query || query.length < 2) {
      console.log('[API] Fetching popular locations...');
      
      // Fetch specific US states (California, New York, Illinois, Texas, Alabama, Alaska, Arizona, Arkansas)
      const usStateCodes = ['CA', 'NY', 'IL', 'TX', 'AL', 'AK', 'AZ', 'AR'];
      const popularStates = await prisma.state.findMany({
        where: {
          country: {
            code: 'US',
          },
          code: {
            in: usStateCodes,
          },
        },
        include: { country: true },
        orderBy: [
          // Order by the specified order in usStateCodes
          { code: 'asc' },
        ],
      });

      // Sort states to match the desired order
      const stateOrder = ['CA', 'NY', 'IL', 'TX', 'AL', 'AK', 'AZ', 'AR'];
      const sortedStates = stateOrder
        .map(code => popularStates.find(s => s.code === code))
        .filter(Boolean) as typeof popularStates;

      const locations: string[] = [];
      
      // Add "Any location" option at the top
      locations.push('Any location');
      
      // Add popular US states only
      for (const state of sortedStates) {
        locations.push(`${state.name}, ${state.country.name}`);
      }

      console.log('[API] Returning popular locations:', locations.length);
      return NextResponse.json({ locations: locations.slice(0, limit) });
    }

    // Search for matching locations
    console.log('[API] Searching for locations matching:', query);
    const lowerQuery = query.toLowerCase().trim();
    const upperQuery = query.toUpperCase().trim();

    // Search in countries - search by name, code, and code3
    const countries = await prisma.country.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: upperQuery, mode: 'insensitive' } },
          { code3: { contains: upperQuery, mode: 'insensitive' } },
        ],
      },
      take: 50, // Increased limit to get more results
      orderBy: { name: 'asc' },
    });

    // Search in states (with country) - search by state name, state code, and country name/code
    const states = await prisma.state.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: upperQuery, mode: 'insensitive' } },
          { country: { name: { contains: query, mode: 'insensitive' } } },
          { country: { code: { contains: upperQuery, mode: 'insensitive' } } },
          { country: { code3: { contains: upperQuery, mode: 'insensitive' } } },
        ],
      },
      include: { country: true },
      take: 50, // Increased limit
      orderBy: [
        { name: 'asc' },
        { country: { name: 'asc' } },
      ],
    });

    // Format results: states as "State, Country", countries as just "Country"
    const locations: string[] = [];

    // Add "Any location" option at the top if query doesn't match it
    if (!lowerQuery.includes('any location') && !lowerQuery.includes('any')) {
      locations.push('Any location');
    }

    // Sort and prioritize results
    // 1. Exact matches first
    // 2. Starts with matches
    // 3. Contains matches
    
    const exactCountryMatches: string[] = [];
    const startsWithCountryMatches: string[] = [];
    const containsCountryMatches: string[] = [];
    
    const includedCountries = new Set(states.map(s => s.country.name));
    
    for (const country of countries) {
      if (includedCountries.has(country.name)) continue;
      
      const countryNameLower = country.name.toLowerCase();
      if (countryNameLower === lowerQuery || country.code.toLowerCase() === lowerQuery || country.code3?.toLowerCase() === lowerQuery) {
        exactCountryMatches.push(country.name);
      } else if (countryNameLower.startsWith(lowerQuery) || country.code.toLowerCase().startsWith(lowerQuery)) {
        startsWithCountryMatches.push(country.name);
      } else {
        containsCountryMatches.push(country.name);
      }
    }
    
    // Add countries in priority order
    locations.push(...exactCountryMatches);
    locations.push(...startsWithCountryMatches);
    locations.push(...containsCountryMatches);

    // Sort states similarly
    const exactStateMatches: string[] = [];
    const startsWithStateMatches: string[] = [];
    const containsStateMatches: string[] = [];
    
    for (const state of states) {
      const stateNameLower = state.name.toLowerCase();
      const countryNameLower = state.country.name.toLowerCase();
      const locationStr = `${state.name}, ${state.country.name}`;
      
      if (stateNameLower === lowerQuery || 
          countryNameLower === lowerQuery ||
          state.code.toLowerCase() === lowerQuery ||
          state.country.code.toLowerCase() === lowerQuery) {
        exactStateMatches.push(locationStr);
      } else if (stateNameLower.startsWith(lowerQuery) || 
                 countryNameLower.startsWith(lowerQuery) ||
                 state.code.toLowerCase().startsWith(lowerQuery)) {
        startsWithStateMatches.push(locationStr);
      } else {
        containsStateMatches.push(locationStr);
      }
    }
    
    // Add states in priority order
    locations.push(...exactStateMatches);
    locations.push(...startsWithStateMatches);
    locations.push(...containsStateMatches);

    // Add "Remote" option if query matches
    if (lowerQuery.includes('remote') || lowerQuery.includes('rem')) {
      // Insert Remote after "Any location" if it exists
      const anyLocationIndex = locations.indexOf('Any location');
      if (anyLocationIndex >= 0) {
        locations.splice(anyLocationIndex + 1, 0, 'Remote');
      } else {
        locations.unshift('Remote');
      }
    }

    // Return results - don't limit too aggressively
    const maxResults = Math.max(limit, 50); // Return more results
    return NextResponse.json({ 
      locations: locations.slice(0, maxResults),
      count: locations.length 
    });
  } catch (error) {
    console.error('[API] Error fetching locations:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Return fallback data even on error to prevent UI breaking
    return NextResponse.json(
      { 
        locations: ['Remote', 'United States', 'Malaysia', 'Singapore', 'Canada', 'Australia'],
        error: 'Failed to fetch locations from database',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 200 } // Return 200 with fallback data
    );
  }
}

