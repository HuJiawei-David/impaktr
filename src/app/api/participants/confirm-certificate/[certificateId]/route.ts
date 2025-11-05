import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { calculateImpaktrScore } from '@/lib/scoring';
import { checkAndAwardBadges } from '@/lib/badges';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await params;
    
    console.log(`[Confirm Certificate] Starting for certificate: ${certificateId}`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Confirm Certificate] No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.error('[Confirm Certificate] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId }
    });

    if (!certificate) {
      console.error('[Confirm Certificate] Certificate not found');
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Check if user owns this certificate
    if (certificate.userId !== user.id) {
      console.error('[Confirm Certificate] User does not own this certificate');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already confirmed
    const metadata = certificate.metadata as any;
    if (metadata?.pendingConfirmation === false) {
      console.warn('[Confirm Certificate] Certificate already confirmed');
      return NextResponse.json({ 
        success: true, 
        message: 'Certificate already confirmed' 
      });
    }

    console.log('[Confirm Certificate] Updating certificate metadata');
    // Update certificate metadata to remove pending confirmation flag
    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        metadata: {
          ...metadata,
          pendingConfirmation: false,
          confirmedAt: new Date().toISOString()
        }
      }
    });

    // Find the participation directly using eventId and userId for better accuracy
    if (certificate.eventId) {
      const participation = await prisma.participation.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: certificate.eventId
          }
        }
      });

      if (participation) {
        console.log(`[Confirm Certificate] Updating participation ${participation.id} to VERIFIED`);
        
        // Get old score before updating
        const oldScore = user.impactScore;
        
        await prisma.participation.update({
          where: { id: participation.id },
          data: {
            status: 'VERIFIED'
          }
        });

        // Recalculate impact score now that participation is VERIFIED
        console.log('[Confirm Certificate] Recalculating impact score');
        let calculatedScore = await calculateImpaktrScore(user.id);
        
        // Validate calculatedScore is a valid finite number
        let newScore = calculatedScore;
        if (!Number.isFinite(calculatedScore) || isNaN(calculatedScore) || calculatedScore < 0) {
          console.warn(`[Confirm Certificate] Invalid calculatedScore: ${calculatedScore}, using oldScore: ${oldScore}`);
          newScore = oldScore;
        }
        
        // Update user score if valid
        if (newScore !== oldScore && Number.isFinite(newScore) && !isNaN(newScore) && newScore >= 0) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { impactScore: newScore }
            });
          } catch (updateError) {
            console.error('[Confirm Certificate] Error updating user score:', updateError);
            // Continue without updating score, use old score
            newScore = oldScore;
          }
        }

        // Check and award badges
        try {
          await checkAndAwardBadges(user.id);
        } catch (badgeError) {
          console.error('[Confirm Certificate] Error checking badges:', badgeError);
          // Don't fail the whole operation
        }

        // Create score history entry if score changed
        if (oldScore !== newScore && Number.isFinite(newScore) && !isNaN(newScore)) {
          await prisma.scoreHistory.create({
            data: {
              userId: user.id,
              oldScore,
              newScore,
              change: newScore - oldScore,
              reason: 'certificate_confirmed',
              hoursComponent: participation.hours || 0,
              intensityComponent: 1.0,
              skillComponent: 1.0,
              qualityComponent: 1.0,
              verificationComponent: 1.1,
              locationComponent: 1.0,
              eventId: certificate.eventId,
              participationId: participation.id,
            }
          });
        }

        // Mark the notification as read
        // Find notifications for this certificate using raw query or findMany + update
        const notificationsToUpdate = await prisma.notification.findMany({
          where: {
            userId: user.id,
            type: 'CERTIFICATE_ISSUED',
            isRead: false
          }
        });
        
        // Filter notifications that match this certificateId in their data
        const matchingNotifications = notificationsToUpdate.filter(notif => {
          const notifData = notif.data as any;
          return notifData?.certificateId === certificateId;
        });
        
        // Update matching notifications
        if (matchingNotifications.length > 0) {
          await prisma.notification.updateMany({
            where: {
              id: { in: matchingNotifications.map(n => n.id) }
            },
            data: {
              isRead: true
            }
          });
        }

        console.log('[Confirm Certificate] Operation completed successfully');
        return NextResponse.json({ 
          success: true,
          message: 'Certificate confirmed! Your participation has been fully verified.',
          participation: participation,
          newImpactScore: newScore,
          scoreIncrease: newScore - oldScore
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Certificate confirmed!'
    });

  } catch (error) {
    console.error('[Confirm Certificate] ERROR:', error);
    console.error('[Confirm Certificate] ERROR Stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

