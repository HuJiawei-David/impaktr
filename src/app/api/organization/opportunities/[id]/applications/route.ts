import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: opportunityId } = await params;

    // Verify the opportunity belongs to the user's organization
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        organization: {
          members: {
            some: {
              userId: session.user.id,
              role: {
                in: ['OWNER', 'ADMIN']
              }
            }
          }
        }
      }
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found or access denied' }, { status: 404 });
    }

    // Fetch applications with detailed user information
    const applications = await prisma.application.findMany({
      where: { opportunityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            city: true,
            country: true,
            impactScore: true,
            volunteerProfile: {
              select: {
                bio: true,
                skills: true,
                interests: true,
              }
            },
            badges: {
              select: {
                earnedAt: true,
                badge: {
                  select: {
                    name: true,
                    category: true
                  }
                }
              },
              orderBy: { earnedAt: 'desc' },
              take: 5
            },
            participations: {
              where: { status: 'VERIFIED' },
              select: {
                hours: true
              }
            }
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    // Format the response
    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      message: app.message,
      resumeUrl: app.resumeUrl,
      appliedAt: app.appliedAt,
      reviewedAt: app.reviewedAt,
      user: {
        id: app.user.id,
        name: app.user.name,
        email: app.user.email,
        image: app.user.image,
        city: app.user.city,
        country: app.user.country,
        bio: app.user.volunteerProfile?.bio,
        skills: app.user.volunteerProfile?.skills || [],
        interests: app.user.volunteerProfile?.interests || [],
        impaktrScore: app.user.impactScore,
        totalHoursVolunteered: app.user.participations.reduce((sum, p) => sum + (p.hours || 0), 0),
        totalActivitiesCompleted: app.user.participations.length,
        recentBadges: app.user.badges.map(b => ({
          name: b.badge.name,
          type: b.badge.category,
          earnedAt: b.earnedAt
        }))
      }
    }));

    return NextResponse.json({ applications: formattedApplications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

