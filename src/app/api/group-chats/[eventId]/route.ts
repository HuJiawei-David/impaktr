import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get group chat for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    // Check if user is a participant or admin of the event
    const participation = await prisma.participation.findFirst({
      where: {
        eventId,
        userId: session.user.id,
        status: { in: ['REGISTERED', 'CONFIRMED', 'ATTENDED', 'VERIFIED'] }
      }
    });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: { in: ['admin', 'owner'] }
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is organizer, admin, or participant
    const isOrganizer = event.organizerId === session.user.id;
    const isAdmin = event.organization?.members && event.organization.members.length > 0;
    const isParticipant = !!participation;

    if (!isOrganizer && !isAdmin && !isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get or create group chat
    let groupChat = await prisma.groupChat.findUnique({
      where: { eventId },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        _count: {
          select: {
            messages: true,
            members: true
          }
        }
      }
    });

    // Create group chat if it doesn't exist
    if (!groupChat) {
      // Get all participants to add as members
      const participants = await prisma.participation.findMany({
        where: {
          eventId,
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
      if (!memberIds.has(session.user.id)) {
        membersToCreate.push({
          userId: session.user.id,
          role: (isOrganizer || isAdmin) ? 'ADMIN' : 'MEMBER'
        });
        memberIds.add(session.user.id);
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
          eventId,
          name: `${event.title} - Group Chat`,
          description: `Group chat for ${event.title}`,
          members: {
            create: membersToCreate
          }
        },
        include: {
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          },
          _count: {
            select: {
              messages: true,
              members: true
            }
          }
        }
      });
    } else {
      // Ensure all relevant members are added
      const existingMemberIds = new Set(groupChat.members.map(m => m.userId));
      
      // Add current user if not already a member
      if (!existingMemberIds.has(session.user.id)) {
        await prisma.groupChatMember.create({
          data: {
            groupChatId: groupChat.id,
            userId: session.user.id,
            role: (isOrganizer || isAdmin) ? 'ADMIN' : 'MEMBER'
          }
        });
        existingMemberIds.add(session.user.id);
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

      // Ensure all participants are members
      const participants = await prisma.participation.findMany({
        where: {
          eventId,
          status: { in: ['REGISTERED', 'PENDING', 'CONFIRMED', 'ATTENDED', 'VERIFIED'] }
        },
        select: { userId: true }
      });

      for (const participant of participants) {
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

      // Refresh group chat data to get updated members
      groupChat = await prisma.groupChat.findUnique({
        where: { id: groupChat.id },
        include: {
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          },
          _count: {
            select: {
              messages: true,
              members: true
            }
          }
        }
      });
    }

    return NextResponse.json({ groupChat });
  } catch (error) {
    console.error('Error fetching group chat:', error);
    return NextResponse.json({ error: 'Failed to fetch group chat' }, { status: 500 });
  }
}

