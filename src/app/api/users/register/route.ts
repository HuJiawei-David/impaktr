// home/ubuntu/impaktrweb/src/app/api/users/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToS3 } from '@/lib/aws';
import { z } from 'zod';
import { UserType } from '@/types/enums';
import { prisma } from '@/lib/prisma';

const registrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.string().optional(),
  nationality: z.string().min(1, 'Nationality is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  organization: z.string().optional(),
  occupation: z.string().optional(),
  bio: z.string().optional(),
  languages: z.string().transform((str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }).pipe(z.array(z.string())),
  website: z.string().optional().refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
    message: 'Invalid url'
  }),
  showEmail: z.string().transform((str) => str === 'true'),
  isPublic: z.string().transform((str) => str === 'true'),
  sdgFocus: z.string().optional().transform((str) => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }).pipe(z.array(z.number())),
  skills: z.string().optional().transform((str) => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }).pipe(z.array(z.string())),
});

export async function POST(request: NextRequest) {
  try {
    console.log('User registration API called');
    const session = await getSession();
    console.log('Session:', session);
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract and validate form data
    const formDataObj: Record<string, FormDataEntryValue> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'profilePicture') {
        formDataObj[key] = value;
      }
    }

    console.log('Form data received:', formDataObj);
    
    const validatedData = registrationSchema.parse(formDataObj);
    console.log('Validation successful:', validatedData);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      // include: { profile: true }, // profile relation doesn't exist
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle profile picture upload
    let avatarUrl = existingUser.image || null;
    const profilePicture = formData.get('profilePicture') as File;
    
    if (profilePicture && profilePicture.size > 0) {
      try {
        const buffer = await profilePicture.arrayBuffer();
        const key = `avatars/${existingUser.id}/${Date.now()}-${profilePicture.name}`;
        avatarUrl = await uploadToS3(Buffer.from(buffer), key, profilePicture.type);
      } catch (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        // Continue without avatar rather than failing completely
      }
    }

    // Update user profile with all the collected data
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        // Basic info
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        displayName: `${validatedData.firstName} ${validatedData.lastName}`,
        bio: validatedData.bio,
        image: avatarUrl,
        
        // Personal details
        dateOfBirth: validatedData.dateOfBirth,
        gender: validatedData.gender,
        nationality: validatedData.nationality,
        
        // Location
        city: validatedData.city,
        state: validatedData.state,
        country: validatedData.country,
        location: `${validatedData.city}, ${validatedData.state}, ${validatedData.country}`,
        
        // Professional
        occupation: validatedData.occupation,
        organization: validatedData.organization,
        
        // Additional fields
        languages: validatedData.languages,
        website: validatedData.website || null,
        sdgFocus: validatedData.sdgFocus,
        
        // Privacy settings
        showEmail: validatedData.showEmail,
        isPublic: validatedData.isPublic,
        
        // User type
        userType: 'INDIVIDUAL',
        
        updatedAt: new Date(),
      },
    });

    // Create or update VolunteerProfile with skills
    await prisma.volunteerProfile.upsert({
      where: { userId: updatedUser.id },
      create: {
        userId: updatedUser.id,
        skills: validatedData.skills || [],
      },
      update: {
        skills: validatedData.skills || [],
      },
    });

    // Initialize user badges for all SDGs
    const badges = await prisma.badge.findMany({
      where: { rarity: 'SUPPORTER' }, // Initialize with supporter level badges
    });

    for (const badge of badges) {
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId: updatedUser.id,
            badgeId: badge.id,
          }
        },
        create: {
          userId: updatedUser.id,
          badgeId: badge.id,
          // progress: 0, // progress field doesn't exist
        },
        update: {}, // Do nothing if already exists
      });
    }

    // Note: ScoreHistory model doesn't exist in the schema
    // Initial score tracking would need to be implemented if required

    return NextResponse.json({ 
      success: true,
      user: updatedUser,
      message: 'Profile created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid data', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    console.error('Error in user registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to validate file types
function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

// Helper function to validate file size (max 5MB)
function isValidFileSize(file: File): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSize;
}