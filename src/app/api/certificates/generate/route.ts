// home/ubuntu/impaktrweb/src/app/api/certificates/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCertificatePDF } from '@/lib/certificate-generator';
import { uploadToS3 } from '@/lib/aws';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, participationId, badgeId, achievementId, eventId } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let certificateData: any = {
      recipientName: user.profile?.displayName || `${user.profile?.firstName} ${user.profile?.lastName}`.trim(),
      recipientEmail: user.email,
      issueDate: new Date(),
    };

    let title = '';
    let description = '';

    // Generate certificate based on type
    switch (type) {
      case 'participation':
        if (!participationId) throw new Error('Participation ID required');
        
        const participation = await prisma.participation.findUnique({
          where: { id: participationId },
          include: { 
            event: {
              include: {
                creator: { include: { profile: true } },
                organization: true
              }
            }
          }
        });

        if (!participation) throw new Error('Participation not found');

        title = `${participation.event.title} - Participation Certificate`;
        description = `Certificate of participation in "${participation.event.title}"`;
        certificateData = {
          ...certificateData,
          type: 'Event Participation',
          eventTitle: participation.event.title,
          eventDate: participation.event.startDate,
          hoursContributed: participation.hoursActual || participation.hoursCommitted,
          organizer: participation.event.organization?.name || participation.event.creator.profile?.displayName,
          sdgTags: participation.event.sdgTags,
          verificationMethod: participation.event.verificationType
        };
        break;

      case 'badge':
        if (!badgeId) throw new Error('Badge ID required');
        
        const userBadge = await prisma.userBadge.findUnique({
          where: { 
            userId_badgeId: {
              userId: user.id,
              badgeId: badgeId
            }
          },
          include: { badge: true }
        });

        if (!userBadge || !userBadge.earnedAt) throw new Error('Badge not earned');

        title = `${userBadge.badge.name} Badge Certificate`;
        description = `Certificate for earning the ${userBadge.badge.name} badge`;
        certificateData = {
          ...certificateData,
          type: 'SDG Badge Achievement',
          badgeName: userBadge.badge.name,
          sdgNumber: userBadge.badge.sdgNumber,
          tier: userBadge.badge.tier,
          earnedDate: userBadge.earnedAt
        };
        break;

      case 'rank':
        title = `${user.currentRank} Rank Achievement`;
        description = `Certificate for achieving ${user.currentRank} rank`;
        certificateData = {
          ...certificateData,
          type: 'Rank Achievement',
          rankTitle: user.currentRank,
          impaktrScore: user.impaktrScore,
          achievementDate: new Date()
        };
        break;

      case 'milestone':
        if (!achievementId) throw new Error('Achievement ID required');
        
        const achievement = await prisma.achievement.findUnique({
          where: { id: achievementId }
        });

        if (!achievement) throw new Error('Achievement not found');

        title = `${achievement.name} Achievement`;
        description = achievement.description;
        certificateData = {
          ...certificateData,
          type: 'Milestone Achievement',
          achievementName: achievement.name,
          achievementDescription: achievement.description,
          achievementDate: achievement.earnedAt,
          achievementData: achievement.data
        };
        break;

      default:
        throw new Error('Invalid certificate type');
    }

    // Generate PDF certificate
    const pdfBuffer = await generateCertificatePDF(certificateData);
    
    // Upload to S3
    const s3Key = `certificates/${user.id}/${Date.now()}-${type}.pdf`;
    const certificateUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');

    // Generate shareable URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${user.id}/${certificateData.type.toLowerCase().replace(/\s+/g, '-')}`;

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        type,
        title,
        description,
        badgeId,
        achievementId,
        eventId,
        participationId,
        certificateUrl,
        shareUrl,
        issuedAt: new Date()
      }
    });

    return NextResponse.json({ 
      certificate,
      downloadUrl: certificateUrl
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}