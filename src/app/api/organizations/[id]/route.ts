import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch organization with related data
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          take: 10,
          orderBy: { joinedAt: 'desc' }
        },
        events: {
          where: {
            status: { in: ['UPCOMING', 'ONGOING', 'COMPLETED'] }
          },
          orderBy: { startDate: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            status: true,
            imageUrl: true,
            sdg: true,
            organization: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        },
        opportunities: {
          where: {
            status: 'OPEN'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        corporateBadges: {
          include: {
            badge: true
          }
        },
        _count: {
          select: {
            members: true,
            events: true,
            opportunities: true
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get total volunteer hours from all members' participations
    const totalHours = await prisma.participation.aggregate({
      where: {
        userId: {
          in: organization.members.map(m => m.userId)
        },
        status: 'VERIFIED'
      },
      _sum: {
        hours: true
      }
    });

    // Get top volunteers by hours
    const topVolunteersData = await prisma.user.findMany({
      where: {
        id: {
          in: organization.members.map(m => m.userId)
        }
      },
      select: {
        id: true,
        name: true,
        image: true,
        participations: {
          where: {
            status: 'VERIFIED'
          },
          select: {
            hours: true
          }
        }
      }
    });

    // Calculate hours for each volunteer and sort
    const topVolunteers = topVolunteersData
      .map(user => ({
        id: user.id,
        name: user.name,
        image: user.image,
        avatar: user.image,
        impactScore: Math.floor(Math.random() * 1000) + 100, // Mock impact score
        totalHours: user.participations.reduce((sum, p) => sum + (p.hours || 0), 0),
        hours: user.participations.reduce((sum, p) => sum + (p.hours || 0), 0)
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Get recent events (upcoming ones for sidebar)
    const recentEvents = organization.events.filter(event => event.status === 'UPCOMING').slice(0, 3);

    // Calculate additional stats
    const memberCount = organization._count.members;
    const eventCount = organization._count.events;
    const impactScore = Math.floor((totalHours._sum.hours || 0) * 1.5) + Math.floor(Math.random() * 500);

    // Add computed fields to organization
    const organizationWithComputed = {
      ...organization,
      totalHours: totalHours._sum.hours || 0,
      memberCount,
      eventCount,
      impactScore,
      topVolunteers,
      recentEvents,
      badges: organization.corporateBadges?.map(cb => cb.badge) || [],
      sdgs: [1, 4, 8, 11, 13, 17] // Mock SDGs for now
    };

    return NextResponse.json({ organization: organizationWithComputed });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
