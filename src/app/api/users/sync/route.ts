// home/ubuntu/impaktrweb/src/app/api/users/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { auth0Id, email, name, picture } = body;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          userType: UserType.INDIVIDUAL, // Default, will be updated during onboarding
          profile: {
            create: {
              firstName: name?.split(' ')[0] || '',
              lastName: name?.split(' ').slice(1).join(' ') || '',
              displayName: name || '',
              avatar: picture || null,
            }
          }
        },
        include: { profile: true }
      });
    } else {
      // Update existing user's last active time and profile if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastActiveAt: new Date(),
          profile: {
            update: {
              avatar: picture || user.profile?.avatar,
            }
          }
        },
        include: { profile: true }
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}