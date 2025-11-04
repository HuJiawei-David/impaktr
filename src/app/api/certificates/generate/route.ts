// home/ubuntu/impaktrweb/src/app/api/certificates/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCertificatePDF, generateParticipantCertificatePDF } from '@/lib/certificate-generator';
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
            user: true,
            event: {
              include: {
                organization: true
              }
            }
          }
        });

        if (!participation) throw new Error('Participation not found');

        // Check if user has access to this participation
        if (participation.userId !== user.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get certificate config if available (stored as JSON field in events table)
        let certificateConfig: { certificateName?: string; certificateContent?: string } | null = null;
        try {
          const result = await prisma.$queryRawUnsafe<Array<{ certificateConfig: any }>>(
            `SELECT "certificateConfig" FROM "events" WHERE id = $1`,
            participation.eventId
          );

          if (result && result.length > 0 && result[0].certificateConfig) {
            const parsed = typeof result[0].certificateConfig === 'string' 
              ? JSON.parse(result[0].certificateConfig) 
              : result[0].certificateConfig;
            certificateConfig = {
              certificateName: parsed.certificateName,
              certificateContent: parsed.certificateContent
            };
          }
        } catch (e) {
          // Certificate config column may not exist, continue without it
          console.log('Certificate config column may not exist, using defaults');
        }

        // Check if certificate already exists (to use same title/description)
        const existingCertificate = await prisma.certificate.findFirst({
          where: {
            userId: participation.userId,
            eventId: participation.eventId
          }
        });

        // Helper functions to extract name parts - matches preview page exactly
        const getFirstName = (): string => {
          if (participation.user.firstName) return participation.user.firstName;
          if (participation.user.name) {
            const parts = participation.user.name.trim().split(/\s+/);
            if (parts.length > 1) {
              return parts.slice(0, -1).join(' ') || '-';
            }
            return parts[0] || '-';
          }
          return '-';
        };

        const getLastName = (): string => {
          if (participation.user.lastName) return participation.user.lastName;
          if (participation.user.name) {
            const parts = participation.user.name.trim().split(/\s+/);
            if (parts.length > 1) {
              return parts[parts.length - 1] || '-';
            }
          }
          return '-';
        };

        const calculateAge = (): string => {
          if (!participation.user.dateOfBirth) return '';
          try {
            const birthDate = new Date(participation.user.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            return age.toString();
          } catch (e) {
            return '';
          }
        };

        // Use same title/description logic as preview page - matches page.tsx exactly
        const certificateTitle = existingCertificate?.title || certificateConfig?.certificateName || participation.event.title || 'Certificate Name';
        const certificateContent = existingCertificate?.description || certificateConfig?.certificateContent || 'This certificate is awarded to recognize your participation and contribution to this event.';
        
        title = certificateTitle;
        description = certificateContent;
        
        let certificate;
        
        // If certificate already exists, use it (match page display logic)
        if (existingCertificate) {
          certificate = existingCertificate;
          
          // If PDF already exists, return it directly
          if (existingCertificate.certificateUrl) {
            return NextResponse.json({ 
              certificate: existingCertificate,
              downloadUrl: existingCertificate.certificateUrl
            }, { status: 200 });
          }
        } else {
          // Create new certificate record to get unique ID
          certificate = await prisma.certificate.create({
            data: {
              userId: user.id,
              type: 'participation',
              title,
              description,
              eventId: participation.eventId,
              issuedAt: new Date()
            }
          });
        }

        // Generate participant certificate PDF matching preview page exactly
        // Use the same data extraction logic as the preview page (page.tsx)
        // Include the unique certificate ID in the PDF (matches page.tsx line 345-354)
        const participantCertData = {
          certificateTitle: certificateTitle,
          certificateContent: certificateContent,
          firstName: getFirstName(),
          lastName: getLastName(),
          age: calculateAge(),
          hours: participation.hours || 0,
          impactScore: participation.user.impactScore || 0,
          joinDate: participation.joinedAt || participation.createdAt,
          issuedDate: certificate.issuedAt || new Date(),
          certificateId: certificate.id // Include unique certificate ID (matches page.tsx line 351)
        };

        const pdfBuffer = await generateParticipantCertificatePDF(participantCertData);
        
        // Upload to S3
        const s3Key = `certificates/${user.id}/${certificate.id}-participation.pdf`;
        const certificateUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');

        // Update certificate record with PDF URL
        const updatedCertificate = await prisma.certificate.update({
          where: { id: certificate.id },
          data: {
            certificateUrl: certificateUrl
          }
        });

        return NextResponse.json({ 
          certificate: updatedCertificate,
          downloadUrl: certificateUrl
        }, { status: existingCertificate ? 200 : 201 });

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
        
        // Create certificate record first to get unique ID
        const badgeCertificate = await prisma.certificate.create({
          data: {
            userId: user.id,
            type: 'badge',
            title,
            description,
            issuedAt: new Date()
          }
        });
        
        certificateData = {
          ...certificateData,
          type: 'Badge Achievement',
          badgeName: userBadge.badge.name || 'Unknown',
          badgeDescription: userBadge.badge.description,
          badgeIcon: userBadge.badge.icon,
          earnedDate: userBadge.earnedAt,
          certificateId: badgeCertificate.id
        } as BadgeCertificateData & { certificateId: string };
        
        // Generate PDF certificate with certificate ID
        const badgePdfBuffer = await generateCertificatePDF(certificateData);
        
        // Upload to S3
        const badgeS3Key = `certificates/${user.id}/${badgeCertificate.id}-badge.pdf`;
        const badgeCertificateUrl = await uploadToS3(badgePdfBuffer, badgeS3Key, 'application/pdf');

        // Update certificate record with PDF URL
        const updatedBadgeCertificate = await prisma.certificate.update({
          where: { id: badgeCertificate.id },
          data: {
            certificateUrl: badgeCertificateUrl
          }
        });

        return NextResponse.json({ 
          certificate: updatedBadgeCertificate,
          downloadUrl: badgeCertificateUrl
        }, { status: 201 });

      case 'rank':
        title = `${user.tier} Rank Achievement`;
        description = `Certificate for achieving ${user.tier} rank`;
        
        // Create certificate record first to get unique ID
        const rankCertificate = await prisma.certificate.create({
          data: {
            userId: user.id,
            type: 'rank',
            title,
            description,
            issuedAt: new Date()
          }
        });
        
        certificateData = {
          ...certificateData,
          type: 'Rank Achievement',
          rankTitle: user.tier,
          impaktrScore: user.impactScore,
          achievementDate: new Date(),
          certificateId: rankCertificate.id
        } as RankCertificateData & { certificateId: string };
        
        // Generate PDF certificate with certificate ID
        const rankPdfBuffer = await generateCertificatePDF(certificateData);
        
        // Upload to S3
        const rankS3Key = `certificates/${user.id}/${rankCertificate.id}-rank.pdf`;
        const rankCertificateUrl = await uploadToS3(rankPdfBuffer, rankS3Key, 'application/pdf');

        // Update certificate record with PDF URL
        const updatedRankCertificate = await prisma.certificate.update({
          where: { id: rankCertificate.id },
          data: {
            certificateUrl: rankCertificateUrl
          }
        });

        return NextResponse.json({ 
          certificate: updatedRankCertificate,
          downloadUrl: rankCertificateUrl
        }, { status: 201 });

      case 'milestone':
        if (!achievementId) throw new Error('Achievement ID required');
        
        const achievement = await prisma.achievement.findUnique({
          where: { id: achievementId }
        });

        if (!achievement) throw new Error('Achievement not found');

        title = `${achievement.title || 'Unknown'} Achievement`;
        description = achievement.description || 'Achievement completed';
        
        // Create certificate record first to get unique ID
        const milestoneCertificate = await prisma.certificate.create({
          data: {
            userId: user.id,
            type: 'milestone',
            title,
            description,
            issuedAt: new Date()
          }
        });
        
        certificateData = {
          ...certificateData,
          type: 'Milestone Achievement',
          achievementName: achievement.title || 'Unknown',
          achievementDescription: achievement.description || 'Achievement completed',
          achievementDate: achievement.verifiedAt || achievement.createdAt,
          achievementData: { points: achievement.points || 0 },
          certificateId: milestoneCertificate.id
        } as AchievementCertificateData & { certificateId: string };
        
        // Generate PDF certificate with certificate ID
        const milestonePdfBuffer = await generateCertificatePDF(certificateData);
        
        // Upload to S3
        const milestoneS3Key = `certificates/${user.id}/${milestoneCertificate.id}-milestone.pdf`;
        const milestoneCertificateUrl = await uploadToS3(milestonePdfBuffer, milestoneS3Key, 'application/pdf');

        // Update certificate record with PDF URL
        const updatedMilestoneCertificate = await prisma.certificate.update({
          where: { id: milestoneCertificate.id },
          data: {
            certificateUrl: milestoneCertificateUrl
          }
        });

        return NextResponse.json({ 
          certificate: updatedMilestoneCertificate,
          downloadUrl: milestoneCertificateUrl
        }, { status: 201 });

      default:
        throw new Error('Invalid certificate type');
    }

  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}