// home/ubuntu/impaktrweb/src/app/api/users/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToS3 } from '@/lib/aws';
import { z } from 'zod';
import { UserType } from '@prisma/client';

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
  website: z.string().url().optional().or(z.literal('')),
  showEmail: z.string().transform((str) => str === 'true'),
  isPublic: z.string().transform((str) => str === 'true'),
  sdgFocus: z.string().transform((str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }).pipe(z.array(z.number())).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Registration API called');
    const session = await getSession();
    console.log('Session:', session);
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract and validate form data
    const formDataObj: any = {};
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
      include: { profile: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle profile picture upload
    let avatarUrl = existingUser.profile?.avatar || null;
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

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        userType: UserType.INDIVIDUAL,
        profile: {
          upsert: {
            create: {
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              displayName: `${validatedData.firstName} ${validatedData.lastName}`,
              bio: validatedData.bio,
              avatar: avatarUrl,
              website: validatedData.website || null,
              location: {
                city: validatedData.city,
                state: validatedData.state,
                country: validatedData.country,
              },
              languages: validatedData.languages,
              dateOfBirth: validatedData.dateOfBirth,
              gender: validatedData.gender,
              nationality: validatedData.nationality,
              occupation: validatedData.occupation,
              organization: validatedData.organization,
              isPublic: validatedData.isPublic,
              showEmail: validatedData.showEmail,
              sdgFocus: validatedData.sdgFocus,
              notifications: {
                email: true,
                push: true,
                badges: true,
                events: true,
                verifications: true,
              },
            },
            update: {
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              displayName: `${validatedData.firstName} ${validatedData.lastName}`,
              bio: validatedData.bio,
              avatar: avatarUrl,
              website: validatedData.website || null,
              location: {
                city: validatedData.city,
                state: validatedData.state,
                country: validatedData.country,
              },
              languages: validatedData.languages,
              dateOfBirth: validatedData.dateOfBirth,
              gender: validatedData.gender,
              nationality: validatedData.nationality,
              occupation: validatedData.occupation,
              organization: validatedData.organization,
              isPublic: validatedData.isPublic,
              showEmail: validatedData.showEmail,
              sdgFocus: validatedData.sdgFocus,
              updatedAt: new Date(),
            }
          }
        }
      },
      include: {
        profile: true,
      }
    });

    // Initialize user badges for all SDGs
    const badges = await prisma.badge.findMany({
      where: { tier: 'SUPPORTER' }, // Initialize with supporter level badges
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
          progress: 0,
        },
        update: {}, // Do nothing if already exists
      });
    }

    // Create initial score history entry
    await prisma.scoreHistory.create({
      data: {
        userId: updatedUser.id,
        oldScore: 0,
        newScore: 0,
        change: 0,
        reason: 'account_created',
        hoursComponent: 0,
        intensityComponent: 0,
        skillComponent: 0,
        qualityComponent: 0,
        verificationComponent: 0,
        locationComponent: 1.0,
      }
    });

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