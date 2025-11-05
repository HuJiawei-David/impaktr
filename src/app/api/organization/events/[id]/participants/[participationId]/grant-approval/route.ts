import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import type { NotificationType } from '@prisma/client';
import { z } from 'zod';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';
import { notificationService } from '@/lib/notification-service';
import { emitToUser } from '@/lib/socket';

const grantApprovalSchema = z.object({
  certificateName: z.string().optional(),
  certificateContent: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participationId: string }> }
) {
  try {
    const { id: eventId, participationId } = await params;
    
    console.log(`[Grant Approval] Starting for event: ${eventId}, participation: ${participationId}`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Grant Approval] No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { certificateName, certificateContent } = grantApprovalSchema.parse(body);
    
    console.log(`[Grant Approval] Certificate config: name=${certificateName}, hasContent=${!!certificateContent}`);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizationMemberships: {
          include: { organization: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      console.error('[Grant Approval] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find organizations where user is admin or owner
    const adminMemberships = user.organizationMemberships.filter(
      (m) => ['admin', 'owner'].includes(m.role)
    );

    if (adminMemberships.length === 0) {
      console.error('[Grant Approval] User has no admin access');
      return NextResponse.json({ error: 'No organization admin access' }, { status: 403 });
    }

    // Get organization IDs that user has admin access to
    const organizationIds = adminMemberships.map(m => m.organization.id);
    console.log(`[Grant Approval] Admin org IDs:`, organizationIds);

    // Verify the participation belongs to an event owned by this organization
    const participation = await prisma.participation.findFirst({
      where: {
        id: participationId,
        event: {
          id: eventId,
          organizationId: { in: organizationIds }
        }
      },
      include: {
        user: true,
        event: true,
        verifications: true
      }
    });

    if (!participation) {
      console.error('[Grant Approval] Participation not found or access denied');
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    console.log(`[Grant Approval] Current participation status: ${participation.status}`);

    // Check if already verified
    if (participation.status === 'VERIFIED') {
      console.warn('[Grant Approval] Participant already verified');
      return NextResponse.json({ error: 'Participant already verified' }, { status: 400 });
    }

    // Update participation status to APPROVED_PENDING (waiting for participant confirmation)
    console.log('[Grant Approval] Updating participation status');
    const updatedParticipation = await prisma.participation.update({
      where: { id: participationId },
      data: {
        status: 'ATTENDED', // Keep as ATTENDED until participant confirms
        verifiedAt: new Date()
      }
    });

    // Create a verification record
    console.log('[Grant Approval] Creating verification record');
    await prisma.verification.create({
      data: {
        userId: participation.userId,
        participationId,
        type: 'ORGANIZER',
        status: 'APPROVED',
        rating: 1.0, // Default rating
        reviewerId: user.id
      }
    });

    // Re-fetch participation to include the newly created verification
    const participationWithVerification = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        user: true,
        event: true,
        verifications: {
          where: { status: 'APPROVED' }
        }
      }
    });

    if (!participationWithVerification) {
      console.error('[Grant Approval] Failed to refetch participation with verification');
      return NextResponse.json({ error: 'Failed to process participation' }, { status: 500 });
    }

    // Calculate and update user's Impaktr Score
    const participantId = participation.userId;
    const oldScore = participation.user.impactScore || 0;
    console.log('[Grant Approval] Calculating impact score with temporary participation');
    
    // Temporary function to calculate score including current participation (even if ATTENDED)
    async function calculateScoreWithPendingParticipation(userId: string, currentParticipation: any): Promise<number> {
      // Get all VERIFIED participations
      const verifiedParticipations = await prisma.participation.findMany({
        where: {
          userId,
          status: 'VERIFIED',
        },
        include: {
          event: true,
          verifications: {
            where: { status: 'APPROVED' }
          }
        },
      });

      // Get user info for scoring calculations
      const participantUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          volunteerProfile: true
        },
      });

      if (!participantUser) return 0;

      // Import scoring helper functions (inline implementation based on scoring.ts)
      const getEventIntensity = (event: any): number => {
        if (event.intensity && event.intensity !== 1.0) return event.intensity;
        const intensityMap: { [key: string]: number } = {
          'VOLUNTEERING': 1.0,
          'WORKSHOP': 1.1,
          'FUNDRAISER': 1.2,
          'CLEANUP': 0.9,
          'AWARENESS': 1.0,
          'OTHER': 1.0
        };
        return intensityMap[event.type] || 1.0;
      };

      const getSkillMultiplier = (participation: any, user: any): number => {
        let multiplier = 1.0;
        if (user.volunteerProfile?.skills && user.volunteerProfile.skills.length > 0) {
          multiplier += 0.2;
        }
        if (participation.event.skills && participation.event.skills.length > 0) {
          multiplier += 0.2;
          if (user.volunteerProfile?.skills) {
            const matchingSkills = user.volunteerProfile.skills.filter((skill: string) =>
              participation.event.skills.some((eventSkill: string) =>
                eventSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(eventSkill.toLowerCase())
              )
            );
            if (matchingSkills.length > 0) multiplier += 0.1;
          }
        }
        return Math.min(multiplier, 1.4);
      };

      const getQualityRating = (participation: any): number => {
        if (participation.verifications && participation.verifications.length > 0) {
          const verification = participation.verifications.find((v: any) => v.status === 'APPROVED');
          if (verification?.rating) {
            return Math.max(0.5, Math.min(verification.rating, 1.5));
          }
        }
        return 1.0;
      };

      const getVerificationFactor = (participation: any): number => {
        const verificationMap: { [key: string]: number } = {
          'SELF': 0.8,
          'ORGANIZER': 1.1,
          'PEER': 1.0,
          'GPS': 1.05
        };
        if (participation.verifications && participation.verifications.length > 0) {
          const verification = participation.verifications.find((v: any) => v.status === 'APPROVED');
          if (verification?.type) {
            return verificationMap[verification.type] || 1.0;
          }
        }
        return 1.0;
      };

      const getLocationMultiplier = (country?: string): number => {
        if (!country) return 1.0;
        const countryMultipliers: { [key: string]: number } = {
          'Malaysia': 1.1,
          'Thailand': 1.1,
          'Indonesia': 1.2,
          'Philippines': 1.2,
          'Vietnam': 1.2,
          'India': 1.2,
          'Bangladesh': 1.3,
          'Pakistan': 1.3,
          'Nigeria': 1.3,
          'Kenya': 1.3,
          'Ghana': 1.3,
        };
        return countryMultipliers[country] || 1.0;
      };

      let totalScore = 0;

      // Calculate score for all VERIFIED participations
      for (const p of verifiedParticipations) {
        const hours = p.hours || 0;
        const H = Math.log10(hours + 1) * 100;
        const I = getEventIntensity(p.event);
        const S = getSkillMultiplier(p, participantUser);
        const Q = getQualityRating(p);
        const V = getVerificationFactor(p);
        const L = getLocationMultiplier(participantUser.country || undefined);
        const participationScore = (H * I * S * Q * V) * L;
        totalScore += participationScore;
      }

      // Temporarily include current participation (even if ATTENDED)
      // This gives us the projected score after confirmation
      const hours = currentParticipation.hours || 0;
      const H = Math.log10(hours + 1) * 100;
      const I = getEventIntensity(currentParticipation.event);
      const S = getSkillMultiplier(currentParticipation, participantUser);
      const Q = getQualityRating(currentParticipation);
      const V = getVerificationFactor(currentParticipation);
      const L = getLocationMultiplier(participantUser.country || undefined);
      const currentParticipationScore = (H * I * S * Q * V) * L;
      totalScore += currentParticipationScore;

      // Apply diminishing returns
      const finalScore = Math.min(totalScore * 0.1, 1000);
      const roundedScore = Math.round(finalScore * 10) / 10;

      return roundedScore;
    }

    // Calculate projected score including current participation
    let newScore: number;
    try {
      newScore = await calculateScoreWithPendingParticipation(participantId, participationWithVerification);
      console.log(`[Grant Approval] Projected score: ${oldScore} -> ${newScore}`);
      
      // Validate newScore is a valid finite number
      if (!Number.isFinite(newScore) || newScore < 0) {
        console.warn(`[Grant Approval] Invalid newScore: ${newScore}, using oldScore: ${oldScore}`);
        newScore = oldScore;
      }
    } catch (scoreError) {
      console.error('[Grant Approval] Error calculating projected score:', scoreError);
      console.warn('[Grant Approval] Using oldScore as fallback');
      newScore = oldScore;
    }

    // Update user score with error handling
    // Validate newScore is a valid finite number before updating
    if (Number.isFinite(newScore) && !isNaN(newScore) && newScore >= 0) {
      try {
        await prisma.user.update({
          where: { id: participantId },
          data: { impactScore: newScore }
        });
        console.log(`[Grant Approval] User score updated to ${newScore}`);
      } catch (updateError) {
        console.error('[Grant Approval] Error updating user score:', updateError);
        console.warn('[Grant Approval] Continuing without score update - certificate will still be created');
        // Don't fail the whole operation if score update fails
      }
    } else {
      console.warn(`[Grant Approval] Invalid newScore calculated: ${newScore}, keeping existing score`);
      newScore = oldScore; // Use old score as fallback
    }

    // Check and award badges
    console.log('[Grant Approval] Checking badges');
    try {
      await checkAndAwardBadges(participantId);
    } catch (badgeError) {
      console.error('[Grant Approval] Error checking badges:', badgeError);
      // Don't fail the whole operation
    }

    // Create score history entry
    console.log('[Grant Approval] Creating score history');
    try {
      await prisma.scoreHistory.create({
        data: {
          userId: participantId,
          oldScore,
          newScore,
          change: newScore - oldScore,
          reason: 'participation_granted_approval',
          hoursComponent: participation.hours || 0,
          intensityComponent: 1.0, // Default intensity
          skillComponent: 1.0, // Default skill
          qualityComponent: 1.0,
          verificationComponent: 1.1, // Organization verification bonus
          locationComponent: 1.0, // Default location
          eventId: participation.eventId,
          participationId,
        }
      });
    } catch (historyError) {
      console.error('[Grant Approval] Error creating score history:', historyError);
      // Don't fail the whole operation
    }

    // Generate certificate
    console.log('[Grant Approval] Generating certificate');
    let certificate;
    try {
      // Get the event details for certificate
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organization: true
        }
      });

      if (!event) {
        console.error('[Grant Approval] Event not found for certificate generation');
        console.error(`[Grant Approval] EventId: ${eventId} does not exist`);
        throw new Error(`Event ${eventId} not found - cannot create certificate without valid event`);
      }

      // Verify event has organization relationship
      if (!event.organization) {
        console.warn(`[Grant Approval] Event ${eventId} has no organization relationship`);
        // Try to fetch organization separately
        const participationEvent = await prisma.event.findUnique({
          where: { id: eventId },
          include: { organization: true }
        });
        if (participationEvent?.organization) {
          event.organization = participationEvent.organization;
        } else {
          console.warn('[Grant Approval] Event organization relationship missing, but proceeding with certificate creation');
        }
      }

      // Prepare certificate data
      const issueDate = new Date();
      const certificateTitle = certificateName || event.title;
      const certificateDescription = certificateContent || `${participation.user.name} successfully completed ${event.title}`;

      console.log(`[Grant Approval] Creating certificate: ${certificateTitle}`);
      console.log(`[Grant Approval] EventId: ${eventId}, Event has organization: ${!!event.organization}`);
      
      // Create certificate record
      certificate = await prisma.certificate.create({
        data: {
          userId: participantId,
          eventId, // This should always be valid since we verified it exists
          type: 'PARTICIPATION',
          title: certificateTitle,
          description: certificateDescription,
          issuedAt: issueDate,
          issuedBy: user.id,
          metadata: {
            firstName: participation.user.firstName || '',
            lastName: participation.user.lastName || '',
            age: participation.user.dateOfBirth 
              ? new Date().getFullYear() - new Date(participation.user.dateOfBirth).getFullYear() 
              : null,
            hours: participation.hours || 0,
            impactScore: newScore,
            joinDate: participation.joinedAt,
            issuedDay: issueDate.toISOString(),
            eventTitle: event.title,
            eventDate: event.startDate,
            organizationName: event.organization?.name || 'Impaktr',
            pendingConfirmation: true, // Flag to track if participant needs to confirm
          }
        }
      });
      console.log(`[Grant Approval] Certificate created: ${certificate.id}`);

      // Verify certificate was created correctly with event relationship
      try {
        const verifyCertificate = await prisma.certificate.findUnique({
          where: { id: certificate.id },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                    logo: true
                  }
                }
              }
            }
          }
        });
        
        if (!verifyCertificate) {
          console.error(`[Grant Approval] Failed to verify certificate ${certificate.id} was created`);
        } else if (!verifyCertificate.event) {
          console.warn(`[Grant Approval] Certificate ${certificate.id} created but event relationship is missing`);
        } else {
          console.log(`[Grant Approval] Certificate ${certificate.id} verified with event ${verifyCertificate.event.id}`);
          if (!verifyCertificate.event.organization) {
            console.warn(`[Grant Approval] Certificate event has no organization relationship`);
          }
        }
      } catch (verifyError) {
        console.error('[Grant Approval] Error verifying certificate:', verifyError);
        // Don't fail the operation, but log the issue
      }

      // Send notification to participant about certificate and impact score
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        // Use certificate page URL for better UX
        const certificateUrl = `${baseUrl}/profile/certificates/${participationId}`;
        const confirmUrl = `${baseUrl}/api/participants/confirm-certificate/${certificate.id}`;
        
        console.log('[Grant Approval] Sending notification to participant');
        console.log('[Grant Approval] Notification data:', {
          certificateId: certificate.id,
          eventTitle: event.title,
          impactScore: newScore,
          scoreIncrease: newScore - oldScore,
          requiresConfirmation: true,
          confirmUrl: confirmUrl
        });
        
        // Create an in-app notification with action buttons
        const notificationData = {
          actionUrl: certificateUrl,
          eventTitle: event.title,
          certificateId: certificate.id,
          impactScore: newScore,
          scoreIncrease: newScore - oldScore,
          requiresConfirmation: true,
          confirmUrl: confirmUrl,
        };
        
        // Create in-app notification - ONLY CREATE ONCE
        let createdNotification;
        try {
          createdNotification = await prisma.notification.create({
            data: {
              userId: participantId,
              type: 'CERTIFICATE_ISSUED' as NotificationType,
              title: '🎉 Certificate & Impact Score Received!',
              message: `You've received a certificate for ${event.title} and your impact score has been updated! Please confirm to complete the process.`,
              isRead: false,
              data: notificationData
            }
          });
          console.log('[Grant Approval] Notification created successfully:', {
            id: createdNotification.id,
            type: createdNotification.type,
            userId: createdNotification.userId,
            hasData: !!createdNotification.data,
            dataKeys: createdNotification.data ? Object.keys(createdNotification.data as object) : []
          });
        } catch (notificationCreateError) {
          // Log detailed error information
          console.error('[Grant Approval] FAILED to create notification:', {
            error: notificationCreateError instanceof Error ? notificationCreateError.message : String(notificationCreateError),
            stack: notificationCreateError instanceof Error ? notificationCreateError.stack : undefined,
            participantId: participantId,
            notificationData: notificationData
          });
          // Re-throw the error to prevent continuing - notification creation is critical
          throw new Error(`Failed to create notification: ${notificationCreateError instanceof Error ? notificationCreateError.message : String(notificationCreateError)}`);
        }
        
        // Send real-time notification via socket
        try {
          const socketNotification = {
            type: 'certificate_issued',
            title: '🎉 Certificate & Impact Score Received!',
            message: `You've received a certificate for ${event.title} and your impact score has been updated! Please confirm to complete the process.`,
            data: notificationData
          };
          console.log('[Grant Approval] Sending socket notification:', socketNotification);
          emitToUser(participantId, 'notification', socketNotification);
          console.log('[Grant Approval] Real-time notification sent via socket');
        } catch (socketError) {
          console.error('[Grant Approval] Error sending socket notification:', socketError);
          // Don't fail if socket fails - the notification is still in the database
        }
        
        // Send email notification separately (do NOT call notifyCertificateIssued as it creates duplicate notification)
        try {
          const participantUser = await prisma.user.findUnique({
            where: { id: participantId },
            select: { email: true, name: true }
          });

          if (participantUser?.email) {
            // Send email directly without creating another notification
            const emailSent = await notificationService.sendEmail({
              to: participantUser.email,
              templateType: 'certificateIssued',
              data: {
                eventTitle: event.title,
                organizationName: event.organization?.name || 'Impaktr',
                organizationLogo: event.organization?.logo || undefined,
                hoursContributed: participation.hours || 0,
                certificateUrl: certificateUrl,
                linkedInShareUrl: `${baseUrl}/certificates/share/${certificate.id}`,
                recipientName: participantUser.name || 'User',
                recipientEmail: participantUser.email
              }
            });
            if (emailSent) {
              console.log('[Grant Approval] Email notification sent successfully');
            } else {
              console.warn('[Grant Approval] Email notification failed to send, but notification was created');
            }
          } else {
            console.warn('[Grant Approval] Participant user not found or has no email, skipping email notification');
          }
        } catch (emailError) {
          console.error('[Grant Approval] Error sending email notification:', emailError);
          // Don't fail if email fails - the notification is still in the database
        }
      } catch (notifyError) {
        console.error('[Grant Approval] Error sending certificate notification:', notifyError);
        // Don't fail the whole operation if notification fails
      }
    } catch (certError) {
      console.error('[Grant Approval] Error creating certificate:', certError);
      console.error('[Grant Approval] Certificate error stack:', certError instanceof Error ? certError.stack : 'No stack trace');
      // Don't fail the whole operation if certificate creation fails
    }

    console.log('[Grant Approval] Operation completed successfully');
    return NextResponse.json({ 
      success: true,
      participation: updatedParticipation,
      newImpactScore: newScore,
      certificateId: certificate?.id,
      message: 'Approval granted! Participant will be notified to confirm receipt.'
    });

  } catch (error) {
    console.error('[Grant Approval] ERROR:', error);
    console.error('[Grant Approval] ERROR Type:', error?.constructor?.name || typeof error);
    console.error('[Grant Approval] ERROR Message:', error instanceof Error ? error.message : String(error));
    console.error('[Grant Approval] ERROR Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors,
          message: 'Invalid request data: ' + error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      error: 'Internal server error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.stack : String(error))
        : 'An error occurred while processing your request. Please try again later.'
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}

