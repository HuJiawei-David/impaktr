// home/ubuntu/impaktrweb/src/app/api/events/[id]/participate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ParticipationStatus } from '@prisma/client';

const participateSchema = z.object({
  hoursCommitted: z.number().positive().optional(),
  notes: z.string().optional(),
  motivation: z.string().optional(),
  skills: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
});

const updateParticipationSchema = z.object({
  hoursActual: z.number().positive().optional(),
  notes: z.string().optional(),
  proofImages: z.array(z.string()).optional(),
  qualityRating: z.number().min(0.5).max(1.5).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { hoursCommitted, notes, motivation, skills, emergencyContact } = participateSchema.parse(body);
    
    // Store registration info as structured JSON in feedback field
    // This allows us to parse it later for display in admin approval section
    const registrationInfo: {
      motivation?: string;
      skills?: string;
      notes?: string;
      hoursCommitted?: number;
      emergencyContact?: {
        name?: string;
        phone?: string;
        relationship?: string;
      };
    } = {};
    
    if (motivation) registrationInfo.motivation = motivation;
    if (skills) registrationInfo.skills = skills;
    if (notes) registrationInfo.notes = notes;
    if (hoursCommitted) registrationInfo.hoursCommitted = hoursCommitted;
    if (emergencyContact) registrationInfo.emergencyContact = emergencyContact;
    
    // Store as JSON string for structured parsing, fallback to old format for backward compatibility
    const feedback = Object.keys(registrationInfo).length > 0 
      ? JSON.stringify(registrationInfo) 
      : ([notes, motivation, skills].filter(Boolean).join(' | ') || undefined);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Allow registration for ACTIVE and UPCOMING events
    if (event.status !== 'ACTIVE' && event.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Event is not accepting registrations. Only ACTIVE and UPCOMING events can be registered for.' },
        { status: 400 }
      );
    }

    // Check if event has reached max participants (only count CONFIRMED participants)
    if (event.maxParticipants) {
      const confirmedParticipants = await prisma.participation.count({
        where: { 
          eventId: id,
          status: 'CONFIRMED'
        }
      });

      if (confirmedParticipants >= event.maxParticipants) {
        return NextResponse.json(
          { error: 'Event has reached maximum participants' },
          { status: 400 }
        );
      }
    }

    // Check if user is already participating
    const existingParticipation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: id,
        }
      }
    });

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'User is already participating in this event' },
        { status: 400 }
      );
    }

    // Check if user has required skills (if event has skills requirements)
    if (event.skills && event.skills.length > 0) {
      const volunteerProfile = await prisma.volunteerProfile.findUnique({
        where: { userId: user.id },
        select: { skills: true },
      });

      const userSkills = volunteerProfile?.skills || [];
      const missingSkills = event.skills.filter((skill: string) => !userSkills.includes(skill));

      if (missingSkills.length > 0) {
        return NextResponse.json(
          { 
            error: 'Missing required skills',
            message: `This event requires the following skills: ${missingSkills.join(', ')}. Please update your profile with these skills to register.`,
            missingSkills 
          },
          { status: 400 }
        );
      }
    }

    // Determine skill multiplier based on event skills and user skills
    // This would normally check against user's verified skills
    const skillMultiplier = 1.0; // Default for now

    // derive hours from event totalHours if not provided
    let derivedHours = typeof event?.totalHours === 'number' ? event.totalHours : 0;
    const finalHours = typeof hoursCommitted === 'number' && hoursCommitted > 0 
      ? hoursCommitted 
      : (derivedHours > 0 ? derivedHours : null);

    const participation = await prisma.participation.create({
      data: {
        userId: user.id,
        eventId: id,
        hours: finalHours,
        feedback: feedback || null,
        status: ParticipationStatus.PENDING,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            status: true,
            organizerId: true,
            organizationId: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Add user to group chat if it exists, or create it
    try {
      let groupChat = await prisma.groupChat.findUnique({
        where: { eventId: id },
        include: {
          members: {
            select: { userId: true }
          }
        }
      });

      if (!groupChat) {
        // Create group chat if it doesn't exist
        const isOrganizer = event.organizerId === user.id;
        const isAdmin = event.organizationId ? await prisma.organizationMember.findFirst({
          where: {
            organizationId: event.organizationId,
            userId: user.id,
            role: { in: ['admin', 'owner'] }
          }
        }) : null;

        // Get all participants to add as members
        const participants = await prisma.participation.findMany({
          where: {
            eventId: id,
            status: { in: ['REGISTERED', 'PENDING', 'CONFIRMED', 'ATTENDED', 'VERIFIED'] }
          },
          select: { userId: true }
        });

        // Get organization admins
        const orgAdmins = event.organizationId ? await prisma.organizationMember.findMany({
          where: {
            organizationId: event.organizationId,
            role: { in: ['admin', 'owner'] },
            status: 'active'
          },
          select: { userId: true }
        }) : [];

        // Build members list
        const memberIds = new Set<string>();
        const membersToCreate: Array<{ userId: string; role: string }> = [];

        // Add current user
        if (!memberIds.has(user.id)) {
          membersToCreate.push({
            userId: user.id,
            role: (isOrganizer || isAdmin) ? 'ADMIN' : 'MEMBER'
          });
          memberIds.add(user.id);
        }

        // Add organizer if not already added
        if (event.organizerId && !memberIds.has(event.organizerId)) {
          membersToCreate.push({
            userId: event.organizerId,
            role: 'ADMIN'
          });
          memberIds.add(event.organizerId);
        }

        // Add all participants
        for (const participant of participants) {
          if (!memberIds.has(participant.userId)) {
            const isParticipantOrganizer = participant.userId === event.organizerId;
            const isParticipantAdmin = event.organizationId ? orgAdmins.some(a => a.userId === participant.userId) : false;
            
            membersToCreate.push({
              userId: participant.userId,
              role: (isParticipantOrganizer || isParticipantAdmin) ? 'ADMIN' : 'MEMBER'
            });
            memberIds.add(participant.userId);
          }
        }

        // Add organization admins
        for (const admin of orgAdmins) {
          if (!memberIds.has(admin.userId)) {
            membersToCreate.push({
              userId: admin.userId,
              role: 'ADMIN'
            });
            memberIds.add(admin.userId);
          }
        }

        groupChat = await prisma.groupChat.create({
          data: {
            eventId: id,
            name: `${event.title} - Group Chat`,
            description: `Group chat for ${event.title}`,
            members: {
              create: membersToCreate
            }
          },
          include: {
            members: {
              select: { userId: true }
            }
          }
        });
      } else {
        // Add user to existing group chat if not already a member
        const existingMemberIds = new Set(groupChat.members.map(m => m.userId));
        
        if (!existingMemberIds.has(user.id)) {
          const isOrganizer = event.organizerId === user.id;
          const isAdmin = event.organizationId ? await prisma.organizationMember.findFirst({
            where: {
              organizationId: event.organizationId,
              userId: user.id,
              role: { in: ['admin', 'owner'] }
            }
          }) : null;

          await prisma.groupChatMember.create({
            data: {
              groupChatId: groupChat.id,
              userId: user.id,
              role: (isOrganizer || isAdmin) ? 'ADMIN' : 'MEMBER'
            }
          });
        }

        // Ensure organizer is a member (ADMIN)
        if (event.organizerId && !existingMemberIds.has(event.organizerId)) {
          await prisma.groupChatMember.create({
            data: {
              groupChatId: groupChat.id,
              userId: event.organizerId,
              role: 'ADMIN'
            }
          }).catch(err => {
            // Ignore unique constraint errors
            if (!err?.message?.includes('Unique constraint') && err?.code !== 'P2002') {
              console.error('Error adding organizer to group chat:', err);
            }
          });
        }

        // Ensure organization admins are members (ADMIN)
        if (event.organizationId) {
          const orgAdmins = await prisma.organizationMember.findMany({
            where: {
              organizationId: event.organizationId,
              role: { in: ['admin', 'owner'] },
              status: 'active'
            },
            select: { userId: true }
          });

          for (const admin of orgAdmins) {
            if (!existingMemberIds.has(admin.userId)) {
              await prisma.groupChatMember.create({
                data: {
                  groupChatId: groupChat.id,
                  userId: admin.userId,
                  role: 'ADMIN'
                }
              }).catch(err => {
                // Ignore unique constraint errors
                if (!err?.message?.includes('Unique constraint') && err?.code !== 'P2002') {
                  console.error('Error adding org admin to group chat:', err);
                }
              });
            }
          }
        }

        // Ensure all existing participants are members
        const allParticipants = await prisma.participation.findMany({
          where: {
            eventId: id,
            status: { in: ['REGISTERED', 'PENDING', 'CONFIRMED', 'ATTENDED', 'VERIFIED'] }
          },
          select: { userId: true }
        });

        for (const participant of allParticipants) {
          if (!existingMemberIds.has(participant.userId)) {
            const isParticipantOrganizer = participant.userId === event.organizerId;
            const isParticipantAdmin = event.organizationId ? await prisma.organizationMember.findFirst({
              where: {
                organizationId: event.organizationId,
                userId: participant.userId,
                role: { in: ['admin', 'owner'] }
              }
            }) : null;

            await prisma.groupChatMember.create({
              data: {
                groupChatId: groupChat.id,
                userId: participant.userId,
                role: (isParticipantOrganizer || isParticipantAdmin) ? 'ADMIN' : 'MEMBER'
              }
            }).catch(err => {
              // Ignore unique constraint errors
              if (!err?.message?.includes('Unique constraint') && err?.code !== 'P2002') {
                console.error('Error adding participant to group chat:', err);
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error adding user to group chat:', error);
      // Don't fail the participation creation if group chat addition fails
    }

    // Don't increment participant count here - only count CONFIRMED participants
    // Count will be updated when admin confirms the registration

    return NextResponse.json({ participation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating participation:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateParticipationSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: id,
        }
      },
      include: { event: true }
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // compute hours from event dates if not provided
    let newHours = validatedData.hoursActual;
    if (newHours === undefined && typeof participation.event?.totalHours === 'number') {
      newHours = participation.event.totalHours;
    }

    const updatedParticipation = await prisma.participation.update({
      where: { id: participation.id },
      data: {
        feedback: validatedData.notes, // notes field doesn't exist, using feedback instead
        hours: newHours ?? 0, // use derived hours if available
        // proofImages and qualityRating fields don't exist in Participation model
      },
      include: {
        event: true,
        user: true,
        // verifications field doesn't exist in Participation model
      }
    });

    return NextResponse.json({ participation: updatedParticipation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating participation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: id,
        }
      }
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    if (participation.status === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Cannot cancel verified participation' },
        { status: 400 }
      );
    }

    // Only decrement participant count if status was CONFIRMED or ATTENDED
    // PENDING and REGISTERED registrations don't count toward currentParticipants
    const shouldDecrement = participation.status === 'CONFIRMED' || participation.status === 'ATTENDED';

    await prisma.participation.delete({
      where: { id: participation.id },
    });

    // Update event current participants count only if needed
    if (shouldDecrement) {
      await prisma.event.update({
        where: { id: id },
        data: {
          currentParticipants: {
            decrement: 1,
          }
        }
      });
    }

    return NextResponse.json({ message: 'Participation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling participation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}