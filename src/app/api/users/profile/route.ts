// /home/ubuntu/impaktrweb/src/app/api/users/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        // profile: true, // profile relation doesn't exist
        badges: {
          include: {
            badge: true,
          },
        },
        achievements: true,
        participations: {
          include: {
            event: true,
          },
        },
        scoreHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            participations: {
              where: { status: 'VERIFIED' }
            },
            // certificates: true, // certificates field doesn't exist
            followers: true,
            // follows: true, // follows field doesn't exist
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate stats
    const totalHours = user.participations?.reduce((sum, p) => sum + (p.hours || 0), 0) || 0;
    const verifiedHours = user.participations?.filter(p => p.status === 'VERIFIED').reduce((sum, p) => sum + (p.hours || 0), 0) || 0;
    const eventsJoined = user.participations?.length || 0;
    const badgesEarned = user.badges?.length || 0;
    const certificates = 0; // TODO: Calculate actual certificates
    const followers = user._count?.followers || 0;
    const following = 0; // TODO: Calculate actual following count

    // Transform user data to match frontend expectations
    const profileData = {
      ...user,
      stats: {
        totalHours,
        verifiedHours,
        eventsJoined,
        badgesEarned,
        certificates,
        followers,
        following,
      },
      impaktrScore: user.impactScore || 0,
      currentRank: user.tier || 'BRONZE',
      joinedAt: user.createdAt,
      sdgFocus: user.sdgFocus || [],
      recentActivity: user.scoreHistory?.map(entry => ({
        id: entry.id,
        type: 'score_update',
        title: 'Score Updated',
        description: `Score increased by ${entry.change}`,
        date: entry.createdAt,
        points: entry.change,
      })) || [],
    };

    return NextResponse.json({ user: profileData });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}