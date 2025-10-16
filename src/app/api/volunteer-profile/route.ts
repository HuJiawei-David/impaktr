import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadToS3 } from '@/lib/aws';

const updateVolunteerProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  availability: z.string().max(200).optional(),
  resumeUrl: z.string().url().optional(),
  portfolioUrls: z.array(z.string().url()).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || session.user.id;

    // Check if user is requesting their own profile or a public profile
    const isOwnProfile = userId === session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        volunteerProfile: true,
        participations: {
          include: {
            event: {
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  }
                }
              }
            }
          },
          orderBy: { joinedAt: 'desc' },
          take: 10
        },
        badges: {
          include: {
            badge: true
          },
          orderBy: { earnedAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            participations: true,
            followers: true,
            following: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if profile is public or if user is viewing their own profile
    if (!isOwnProfile && !user.isPublic && !user.volunteerProfile?.isPublic) {
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
    }

    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      city: user.city,
      country: user.country,
      tier: user.tier,
      impactScore: user.impactScore,
      createdAt: user.createdAt,
      volunteerProfile: user.volunteerProfile,
      stats: {
        totalParticipations: user._count.participations,
        followers: user._count.followers,
        following: user._count.following,
        badgesEarned: user.badges.length,
      },
      recentParticipations: user.participations.map(p => ({
        id: p.id,
        event: {
          id: p.event.id,
          title: p.event.title,
          startDate: p.event.startDate,
          organization: p.event.organization,
        },
        status: p.status,
        hours: p.hours,
        joinedAt: p.joinedAt,
      })),
      recentBadges: user.badges.map(ub => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        tier: ub.badge.tier,
        earnedAt: ub.earnedAt,
      })),
    };

    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error('Error fetching volunteer profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const validatedData = updateVolunteerProfileSchema.parse({
      bio: formData.get('bio'),
      skills: formData.get('skills') ? JSON.parse(formData.get('skills') as string) : undefined,
      interests: formData.get('interests') ? JSON.parse(formData.get('interests') as string) : undefined,
      availability: formData.get('availability'),
      resumeUrl: formData.get('resumeUrl'),
      portfolioUrls: formData.get('portfolioUrls') ? JSON.parse(formData.get('portfolioUrls') as string) : undefined,
      isPublic: formData.get('isPublic') === 'true',
    });

    // Handle resume file upload
    let resumeUrl = validatedData.resumeUrl;
    const resumeFile = formData.get('resume') as File;
    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const fileName = `resumes/${session.user.id}/${Date.now()}-${resumeFile.name}`;
      resumeUrl = await uploadToS3(buffer, fileName, resumeFile.type);
    }

    // Handle portfolio file uploads
    let portfolioUrls = validatedData.portfolioUrls || [];
    const portfolioFiles = formData.getAll('portfolio') as File[];
    for (const file of portfolioFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `portfolio/${session.user.id}/${Date.now()}-${file.name}`;
        const url = await uploadToS3(buffer, fileName, file.type);
        portfolioUrls.push(url);
      }
    }

    // Create or update volunteer profile
    const volunteerProfile = await prisma.volunteerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        bio: validatedData.bio,
        skills: validatedData.skills || [],
        interests: validatedData.interests || [],
        availability: validatedData.availability,
        resumeUrl,
        portfolioUrls,
        isPublic: validatedData.isPublic ?? true,
      },
      update: {
        bio: validatedData.bio,
        skills: validatedData.skills,
        interests: validatedData.interests,
        availability: validatedData.availability,
        resumeUrl,
        portfolioUrls,
        isPublic: validatedData.isPublic,
      },
    });

    return NextResponse.json({ volunteerProfile });
  } catch (error) {
    console.error('Error updating volunteer profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete volunteer profile
    await prisma.volunteerProfile.delete({
      where: { userId: session.user.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting volunteer profile:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}

