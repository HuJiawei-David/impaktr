import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json'; // json, pdf, html
    const userId = url.searchParams.get('userId') || session.user.id;

    // Check if user is requesting their own transcript or has permission
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this transcript' }, { status: 403 });
    }

    // Get comprehensive user data
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
                    description: true,
                  }
                }
              }
            }
          },
          orderBy: { joinedAt: 'desc' }
        },
        badges: {
          include: {
            badge: true
          },
          orderBy: { earnedAt: 'desc' }
        },
        achievements: {
          orderBy: { createdAt: 'desc' }
        },
        scoreHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20
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

    // Calculate statistics
    const totalHours = user.participations.reduce((sum, p) => sum + (p.hours || 0), 0);
    const verifiedHours = user.participations.filter(p => p.status === 'VERIFIED').reduce((sum, p) => sum + (p.hours || 0), 0);
    const eventsCompleted = user.participations.filter(p => p.status === 'VERIFIED').length;
    const organizationsWorkedWith = new Set(user.participations.map(p => p.event.organizationId)).size;
    const sdgsContributedTo = new Set(user.participations.map(p => p.event.sdg).filter(Boolean)).size;

    // Group participations by organization
    const participationsByOrg = user.participations.reduce((acc: any, p: any) => {
      const orgId = p.event.organizationId;
      if (orgId && !acc[orgId]) {
        acc[orgId] = {
          organization: p.event.organization,
          participations: [],
          totalHours: 0,
          eventsCount: 0,
        };
      }
      if (orgId) {
        acc[orgId].participations.push(p);
        acc[orgId].totalHours += p.hours || 0;
        acc[orgId].eventsCount += 1;
      }
      return acc;
    }, {} as any);

    // Group participations by SDG
    const participationsBySDG = user.participations.reduce((acc, p) => {
      const sdg = p.event.sdg;
      if (sdg) {
        if (!acc[sdg]) {
          acc[sdg] = {
            sdg,
            participations: [],
            totalHours: 0,
            eventsCount: 0,
          };
        }
        acc[sdg].participations.push(p);
        acc[sdg].totalHours += p.hours || 0;
        acc[sdg].eventsCount += 1;
      }
      return acc;
    }, {} as any);

    // Create transcript data
    const transcript = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        city: user.city,
        country: user.country,
        tier: user.tier,
        impactScore: user.impactScore,
        joinedAt: user.createdAt,
      },
      volunteerProfile: user.volunteerProfile,
      summary: {
        totalHours,
        verifiedHours,
        eventsCompleted,
        organizationsWorkedWith,
        sdgsContributedTo,
        badgesEarned: user.badges.length,
        achievementsEarned: user.achievements.length,
        followers: user._count.followers,
        following: user._count.following,
        currentTier: user.tier,
        impactScore: user.impactScore,
      },
      participationsByOrganization: Object.values(participationsByOrg),
      participationsBySDG: Object.values(participationsBySDG),
      recentParticipations: user.participations.slice(0, 10).map(p => ({
        id: p.id,
        event: {
          id: p.event.id,
          title: p.event.title,
          description: p.event.description,
          startDate: p.event.startDate,
          endDate: p.event.endDate,
          location: p.event.location,
          sdg: p.event.sdg,
          type: p.event.type,
        },
        organization: p.event.organization,
        status: p.status,
        hours: p.hours,
        impactPoints: p.impactPoints,
        joinedAt: p.joinedAt,
        verifiedAt: p.verifiedAt,
      })),
      badges: user.badges.map(ub => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        tier: ub.badge.tier,
        category: ub.badge.category,
        earnedAt: ub.earnedAt,
      })),
      achievements: user.achievements.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type,
        createdAt: a.createdAt,
      })),
      scoreHistory: user.scoreHistory.map(sh => ({
        id: sh.id,
        oldScore: sh.oldScore,
        newScore: sh.newScore,
        change: sh.change,
        createdAt: sh.createdAt,
      })),
      generatedAt: new Date().toISOString(),
      generatedBy: 'Impaktr Platform',
    };

    if (format === 'pdf') {
      // TODO: Generate PDF using a library like puppeteer or jsPDF
      return NextResponse.json({ error: 'PDF generation not implemented yet' }, { status: 501 });
    } else if (format === 'html') {
      // Generate HTML transcript
      const html = generateHTMLTranscript(transcript);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="volunteer-transcript-${user.name}-${new Date().toISOString().split('T')[0]}.html"`
        }
      });
    } else {
      // Return JSON transcript
      return NextResponse.json({ transcript });
    }
  } catch (error) {
    console.error('Error generating volunteer transcript:', error);
    return NextResponse.json({ error: 'Failed to generate transcript' }, { status: 500 });
  }
}

function generateHTMLTranscript(transcript: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volunteer Transcript - ${transcript.user.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 2.5em;
        }
        .header h2 {
            color: #6b7280;
            margin: 10px 0 0 0;
            font-weight: normal;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #3b82f6;
        }
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #3b82f6;
            font-size: 2em;
        }
        .stat-card p {
            margin: 0;
            color: #6b7280;
            font-weight: 500;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h3 {
            color: #3b82f6;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .participation-item {
            background: #f8fafc;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        .badge-item {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 5px 15px;
            margin: 5px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Volunteer Transcript</h1>
            <h2>${transcript.user.name}</h2>
            <p>Generated on ${new Date(transcript.generatedAt).toLocaleDateString()}</p>
        </div>

        <div class="summary">
            <div class="stat-card">
                <h3>${transcript.summary.totalHours}</h3>
                <p>Total Hours</p>
            </div>
            <div class="stat-card">
                <h3>${transcript.summary.eventsCompleted}</h3>
                <p>Events Completed</p>
            </div>
            <div class="stat-card">
                <h3>${transcript.summary.organizationsWorkedWith}</h3>
                <p>Organizations</p>
            </div>
            <div class="stat-card">
                <h3>${transcript.summary.sdgsContributedTo}</h3>
                <p>SDGs Contributed To</p>
            </div>
            <div class="stat-card">
                <h3>${transcript.summary.badgesEarned}</h3>
                <p>Badges Earned</p>
            </div>
            <div class="stat-card">
                <h3>${transcript.summary.impactScore}</h3>
                <p>Impact Score</p>
            </div>
        </div>

        <div class="section">
            <h3>Recent Volunteer Activities</h3>
            ${transcript.recentParticipations.map((p: any) => `
                <div class="participation-item">
                    <h4>${p.event.title}</h4>
                    <p><strong>Organization:</strong> ${p.organization.name}</p>
                    <p><strong>Date:</strong> ${new Date(p.event.startDate).toLocaleDateString()}</p>
                    <p><strong>Hours:</strong> ${p.hours || 0}</p>
                    <p><strong>Status:</strong> ${p.status}</p>
                    ${p.event.sdg ? `<p><strong>SDG:</strong> ${p.event.sdg}</p>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h3>Badges Earned</h3>
            ${transcript.badges.map((badge: any) => `
                <span class="badge-item">${badge.name}</span>
            `).join('')}
        </div>

        <div class="footer">
            <p>This transcript was generated by the Impaktr Platform</p>
            <p>For verification, contact: support@impaktr.com</p>
        </div>
    </div>
</body>
</html>
  `;
}
