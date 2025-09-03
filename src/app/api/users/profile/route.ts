// /home/ubuntu/impaktrweb/src/app/api/users/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).optional(),
  languages: z.array(z.string()).optional(),
  dateOfBirth: z.string().transform((str) => new Date(str)).optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  organization: z.string().optional(),
  sdgFocus: z.array(z.number().min(1).max(17)).optional(),
  isPublic: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  notifications: z.object({}).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
      include: {
        profile: true,
        badges: {
          include: {
            badge: true,
          },
        },
        achievements: true,
        scoreHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            participations: {
              where: { status: 'VERIFIED' }
            },
            certificates: true,
            followers: true,
            follows: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}