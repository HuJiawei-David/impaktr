// home/ubuntu/impaktrweb/src/app/api/certificates/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCertificatePDF } from '@/lib/certificate-generator';
import { uploadToS3 } from '@/lib/aws';

// Certificate data types
interface BaseCertificateData {
  recipientName: string;
  recipientEmail: string;
  issueDate: Date;
}

interface ParticipationCertificateData extends BaseCertificateData {
  type: 'Event Participation';
  eventName: string;
  eventDate: Date;
  hoursContributed: number;
  organizationName: string;
  sdg: string | null;
}

interface BadgeCertificateData extends BaseCertificateData {
  type: 'Badge Achievement';
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  earnedDate: Date;
}

interface AchievementCertificateData extends BaseCertificateData {
  type: 'Milestone Achievement';
  achievementName: string;
  achievementDescription: string;
  achievementDate: Date;
  achievementData: { points: number };
}

interface RankCertificateData extends BaseCertificateData {
  type: 'Rank Achievement';
  rankTitle: string;
  impaktrScore: number;
  achievementDate: Date;
}

type CertificateData = ParticipationCertificateData | BadgeCertificateData | AchievementCertificateData | RankCertificateData;

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
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let certificateData: CertificateData = {
      recipientName: user.name || user.email,
      recipientEmail: user.email,
      issueDate: new Date(),
    } as CertificateData;

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
          eventName: participation.event.title,
          eventDate: participation.event.startDate,
          hoursContributed: participation.hours || 0,
          organizationName: participation.event.organization?.name || 'Event Organizer',
          sdg: participation.event.sdg
        } as ParticipationCertificateData;
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

        title = `${userBadge.badge.name || 'Unknown'} Badge Certificate`;
        description = `Certificate for earning the ${userBadge.badge.name || 'Unknown'} badge`;
        certificateData = {
          ...certificateData,
          type: 'Badge Achievement',
          badgeName: userBadge.badge.name || 'Unknown',
          badgeDescription: userBadge.badge.description,
          badgeIcon: userBadge.badge.icon,
          earnedDate: userBadge.earnedAt
        } as BadgeCertificateData;
        break;

      case 'rank':
        title = `${user.tier} Rank Achievement`;
        description = `Certificate for achieving ${user.tier} rank`;
        certificateData = {
          ...certificateData,
          type: 'Rank Achievement',
          rankTitle: user.tier,
          impaktrScore: user.impactScore,
          achievementDate: new Date()
        } as RankCertificateData;
        break;

      case 'milestone':
        if (!achievementId) throw new Error('Achievement ID required');
        
        const achievement = await prisma.achievement.findUnique({
          where: { id: achievementId }
        });

        if (!achievement) throw new Error('Achievement not found');

        title = `${achievement.title || 'Unknown'} Achievement`;
        description = achievement.description || 'Achievement completed';
        certificateData = {
          ...certificateData,
          type: 'Milestone Achievement',
          achievementName: achievement.title || 'Unknown',
          achievementDescription: achievement.description || 'Achievement completed',
          achievementDate: achievement.verifiedAt || achievement.createdAt,
          achievementData: { points: achievement.points || 0 }
        } as AchievementCertificateData;
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
        // badgeId field doesn't exist in Certificate model
        // achievementId field doesn't exist in Certificate model
        eventId,
        // participationId, certificateUrl, shareUrl fields don't exist in Certificate model
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