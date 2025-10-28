import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[Register] Starting registration process...');
    const { name, email, password, userType } = await request.json();
    console.log('[Register] Received data:', { name, email, userType });

    // Validate input
    if (!name || !email || !password) {
      console.log('[Register] Validation failed: missing fields');
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      console.log('[Register] Validation failed: password too short');
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('[Register] Checking for existing user...');
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('[Register] User already exists');
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('[Register] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    console.log('[Register] Creating user in database...');
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userType: userType || 'INDIVIDUAL',
      },
    });
    console.log('[Register] User created successfully:', user.id);

    // If user is registering as an organization type, create an organization
    const organizationTypes = ['CORPORATE', 'NGO', 'SCHOOL', 'HEALTHCARE'];
    if (userType && organizationTypes.includes(userType)) {
      console.log('[Register] Creating organization for', userType, 'user...');
      
      try {
        // Create organization
        const organization = await prisma.organization.create({
          data: {
            name: name,
            type: userType,
            email: email,
            tier: 'IMPACT_STARTER',
            subscriptionTier: 'IMPACT_STARTER',
            subscriptionStatus: 'active',
          },
        });
        console.log('[Register] Organization created:', organization.id);

        // Add user as admin member of the organization
        await prisma.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId: user.id,
            role: 'admin',
            status: 'active',
          },
        });
        console.log('[Register] User added as admin member of organization');
      } catch (orgError) {
        console.error('[Register] Error creating organization:', orgError);
        // Don't fail the registration if organization creation fails
        // User can still sign in and create organization later
      }
    }

    // Return success (don't include password in response)
    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
