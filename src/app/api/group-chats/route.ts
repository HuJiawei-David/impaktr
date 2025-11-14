import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to ensure all relevant members are added to a group chat
async function ensureGroupChatMembers(
  groupChatId: string,
  event: { id: string; organizerId: string | null; organizationId: string | null }
) {
  try {
    // Get all existing members
    const existingMembers = await prisma.groupChatMember.findMany({
      where: { groupChatId },
      select: { userId: true, role: true }
    });
    const existingMemberIds = new Set(existingMembers.map(m => m.userId));

    // 1. Ensure organizer is a member (ADMIN)
    if (event.organizerId && !existingMemberIds.has(event.organizerId)) {
      // Verify user exists before adding
      const organizerExists = await prisma.user.findUnique({
        where: { id: event.organizerId },
        select: { id: true }
      });
      
      if (organizerExists) {
        await prisma.groupChatMember.create({
          data: {
            groupChatId,
            userId: event.organizerId,
            role: 'ADMIN'
          }
        }).catch(err => {
          // Ignore unique constraint errors (member already exists)
          if (!err.message?.includes('Unique constraint')) {
            console.error('Error adding organizer to group chat:', err);
          }
        });
      }
    }

    // 2. Ensure all participants are members (MEMBER)
    const participants = await prisma.participation.findMany({
      where: {
        eventId: event.id,
        status: { in: ['REGISTERED', 'PENDING', 'CONFIRMED', 'ATTENDED', 'VERIFIED'] }
      },
      select: { userId: true }
    });

    // Validate all participant user IDs exist before processing
    const participantUserIds = participants.map(p => p.userId);
    const existingParticipantUsers = await prisma.user.findMany({
      where: { id: { in: participantUserIds } },
      select: { id: true }
    });
    const existingParticipantUserIds = new Set(existingParticipantUsers.map(u => u.id));

    for (const participant of participants) {
      if (!existingMemberIds.has(participant.userId) && existingParticipantUserIds.has(participant.userId)) {
        // Check if user is organizer or admin
        const isOrganizer = participant.userId === event.organizerId;
        const isAdmin = event.organizationId ? await prisma.organizationMember.findFirst({
          where: {
            organizationId: event.organizationId,
            userId: participant.userId,
            role: { in: ['admin', 'owner'] }
          }
        }) : null;

        await prisma.groupChatMember.create({
          data: {
            groupChatId,
            userId: participant.userId,
            role: (isOrganizer || isAdmin) ? 'ADMIN' : 'MEMBER'
          }
        }).catch(err => {
          // Ignore unique constraint errors (member already exists)
          if (!err.message?.includes('Unique constraint')) {
            console.error('Error adding participant to group chat:', err);
          }
        });
      }
    }

    // 3. Ensure organization admins are members (ADMIN)
    if (event.organizationId) {
      const orgAdmins = await prisma.organizationMember.findMany({
        where: {
          organizationId: event.organizationId,
          role: { in: ['admin', 'owner'] },
          status: 'active'
        },
        select: { userId: true }
      });

      // Validate all org admin user IDs exist before processing
      const orgAdminUserIds = orgAdmins.map(a => a.userId);
      const existingOrgAdminUsers = await prisma.user.findMany({
        where: { id: { in: orgAdminUserIds } },
        select: { id: true }
      });
      const existingOrgAdminUserIds = new Set(existingOrgAdminUsers.map(u => u.id));

      for (const admin of orgAdmins) {
        if (!existingMemberIds.has(admin.userId) && existingOrgAdminUserIds.has(admin.userId)) {
          await prisma.groupChatMember.create({
            data: {
              groupChatId,
              userId: admin.userId,
              role: 'ADMIN'
            }
          }).catch(err => {
            // Ignore unique constraint errors (member already exists)
            if (!err.message?.includes('Unique constraint')) {
              console.error('Error adding org admin to group chat:', err);
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring group chat members:', error);
    // Don't throw - this is a best-effort operation
  }
}

// Get all group chats for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all events where user is a participant, organizer, or admin
    const participations = await prisma.participation.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['REGISTERED', 'PENDING', 'CONFIRMED', 'ATTENDED', 'VERIFIED'] }
      },
      select: {
        eventId: true
      }
    });

    const eventIds = participations.map(p => p.eventId);

    // Get events where user is organizer
    const organizedEvents = await prisma.event.findMany({
      where: {
        organizerId: session.user.id
      },
      select: {
        id: true
      }
    });

    const organizedEventIds = organizedEvents.map(e => e.id);

    // Get events where user is admin
    const adminEvents = await prisma.organizationMember.findMany({
      where: {
        userId: session.user.id,
        role: { in: ['admin', 'owner'] },
        status: 'active'
      },
      include: {
        organization: {
          include: {
            events: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    const adminEventIds = adminEvents.flatMap(m => 
      m.organization.events.map(e => e.id)
    );

    // Combine all event IDs
    const allEventIds = [...new Set([...eventIds, ...organizedEventIds, ...adminEventIds])];

    if (allEventIds.length === 0) {
      return NextResponse.json({ groupChats: [] });
    }

    // Get all events with their details
    const events = await prisma.event.findMany({
      where: {
        id: { in: allEventIds }
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        organizerId: true,
        organizationId: true
      }
    });

    // Get all group chats for these events, or create them if they don't exist
    const groupChats = await Promise.all(
      events.map(async (event) => {
        try {
          // Get or create group chat
          let groupChat = await prisma.groupChat.findUnique({
            where: { eventId: event.id },
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                  organizerId: true,
                  organizationId: true
                }
              },
              members: {
                where: { userId: session.user.id },
                select: {
                  role: true
                }
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  sender: {
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
                  members: true,
                  messages: true
                }
              }
            }
          });

        // Create group chat if it doesn't exist
        if (!groupChat) {
          const isOrganizer = event.organizerId === session.user.id;
          const isAdmin = event.organizationId ? await prisma.organizationMember.findFirst({
            where: {
              organizationId: event.organizationId,
              userId: session.user.id,
              role: { in: ['admin', 'owner'] }
            }
          }) : null;

          // Get all participants to add as members
          const participants = await prisma.participation.findMany({
            where: {
              eventId: event.id,
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

          // Validate that all user IDs exist before creating group chat
          if (membersToCreate.length > 0) {
            const userIdsToCheck = membersToCreate.map(m => m.userId);
            const existingUsers = await prisma.user.findMany({
              where: { id: { in: userIdsToCheck } },
              select: { id: true }
            });
            const existingUserIds = new Set(existingUsers.map(u => u.id));
            
            // Filter out invalid user IDs
            const validMembersToCreate = membersToCreate.filter(m => existingUserIds.has(m.userId));
            
            if (validMembersToCreate.length === 0) {
              // If no valid members, skip creating this group chat
              console.warn(`No valid members found for event ${event.id}, skipping group chat creation`);
              return null;
            }

            groupChat = await prisma.groupChat.create({
              data: {
                eventId: event.id,
                name: `${event.title} - Group Chat`,
                description: `Group chat for ${event.title}`,
                members: {
                  create: validMembersToCreate
                }
              },
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                  organizerId: true,
                  organizationId: true
                }
              },
              members: {
                where: { userId: session.user.id },
                select: {
                  role: true
                }
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  sender: {
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
                  members: true,
                  messages: true
                }
              }
            }
          });
          } else {
            // No members to add, create group chat without members
            groupChat = await prisma.groupChat.create({
              data: {
                eventId: event.id,
                name: `${event.title} - Group Chat`,
                description: `Group chat for ${event.title}`
              },
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                    organizerId: true,
                    organizationId: true
                  }
                },
                members: {
                  where: { userId: session.user.id },
                  select: {
                    role: true
                  }
                },
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  include: {
                    sender: {
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
                    members: true,
                    messages: true
                  }
                }
              }
            });
          }
        } else {
          // If group chat has no members, ensure all members are added
          const allMembers = await prisma.groupChatMember.findMany({
            where: { groupChatId: groupChat.id },
            select: { userId: true }
          });
          const existingMemberIds = new Set(allMembers.map(m => m.userId));

          // If no members exist, add all necessary members
          if (existingMemberIds.size === 0) {
            // Get all participants
            const participants = await prisma.participation.findMany({
              where: {
                eventId: event.id,
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

            const membersToCreate: Array<{ userId: string; role: string }> = [];

            // Add organizer
            if (event.organizerId) {
              membersToCreate.push({
                userId: event.organizerId,
                role: 'ADMIN'
              });
              existingMemberIds.add(event.organizerId);
            }

            // Add all participants
            for (const participant of participants) {
              if (!existingMemberIds.has(participant.userId)) {
                const isParticipantOrganizer = participant.userId === event.organizerId;
                const isParticipantAdmin = event.organizationId ? orgAdmins.some(a => a.userId === participant.userId) : false;
                
                membersToCreate.push({
                  userId: participant.userId,
                  role: (isParticipantOrganizer || isParticipantAdmin) ? 'ADMIN' : 'MEMBER'
                });
                existingMemberIds.add(participant.userId);
              }
            }

            // Add organization admins
            for (const admin of orgAdmins) {
              if (!existingMemberIds.has(admin.userId)) {
                membersToCreate.push({
                  userId: admin.userId,
                  role: 'ADMIN'
                });
                existingMemberIds.add(admin.userId);
              }
            }

            // Validate that all user IDs exist before creating members
            if (membersToCreate.length > 0) {
              const userIdsToCheck = membersToCreate.map(m => m.userId);
              const existingUsers = await prisma.user.findMany({
                where: { id: { in: userIdsToCheck } },
                select: { id: true }
              });
              const existingUserIds = new Set(existingUsers.map(u => u.id));
              
              // Filter out invalid user IDs
              const validMembersToCreate = membersToCreate.filter(m => existingUserIds.has(m.userId));
              
              if (validMembersToCreate.length > 0 && groupChat) {
                const groupChatId = groupChat.id;
                await prisma.groupChatMember.createMany({
                  data: validMembersToCreate.map(m => ({
                    groupChatId: groupChatId,
                    userId: m.userId,
                    role: m.role
                  }))
                });
              }
            }

            // Refresh group chat
            groupChat = await prisma.groupChat.findUnique({
              where: { id: groupChat.id },
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                    organizerId: true,
                    organizationId: true
                  }
                },
                members: {
                  where: { userId: session.user.id },
                  select: {
                    role: true
                  }
                },
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  include: {
                    sender: {
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
                    members: true,
                    messages: true
                  }
                }
              }
            });
          } else {
            // Ensure current user is a member
            if (!existingMemberIds.has(session.user.id)) {
              const isOrganizer = event.organizerId === session.user.id;
              const isAdmin = event.organizationId ? await prisma.organizationMember.findFirst({
                where: {
                  organizationId: event.organizationId,
                  userId: session.user.id,
                  role: { in: ['admin', 'owner'] }
                }
              }) : null;

              await prisma.groupChatMember.create({
                data: {
                  groupChatId: groupChat.id,
                  userId: session.user.id,
                  role: (isOrganizer || isAdmin) ? 'ADMIN' : 'MEMBER'
                }
              });
            }
          }
        }

          // Ensure groupChat exists before proceeding
          if (!groupChat) {
            return null;
          }

          // Ensure organizer and all participants are members
          await ensureGroupChatMembers(groupChat.id, event);

          // Refresh group chat to get updated member count
          groupChat = await prisma.groupChat.findUnique({
            where: { id: groupChat.id },
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                  organizerId: true,
                  organizationId: true
                }
              },
              members: {
                where: { userId: session.user.id },
                select: {
                  role: true
                }
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  sender: {
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
                  members: true,
                  messages: true
                }
              }
            }
          });

          return groupChat!;
        } catch (error) {
          console.error(`Error processing group chat for event ${event.id}:`, error);
          // Return null to filter out failed group chats
          return null;
        }
      })
    );

    // Filter out null group chats and sort by last message time (most recent first)
    // This ensures group chats with the most recent messages appear at the top
    const validGroupChats = groupChats
      .filter((gc): gc is NonNullable<typeof gc> => gc !== null)
      .sort((a, b) => {
        // Sort by last message time if available, otherwise use updatedAt
        const timeA = a.messages[0]?.createdAt 
          ? new Date(a.messages[0].createdAt).getTime()
          : new Date(a.updatedAt).getTime();
        const timeB = b.messages[0]?.createdAt
          ? new Date(b.messages[0].createdAt).getTime()
          : new Date(b.updatedAt).getTime();
        return timeB - timeA; // Descending order (newest first)
      });

    const result = validGroupChats.map(groupChat => ({
      id: groupChat.id,
      name: groupChat.name,
      description: groupChat.description,
      eventId: groupChat.eventId,
      event: {
        id: groupChat.event.id,
        title: groupChat.event.title,
        imageUrl: groupChat.event.imageUrl,
      },
      role: groupChat.members[0]?.role || 'MEMBER',
      lastMessage: groupChat.messages[0] || null,
      memberCount: groupChat._count.members,
      messageCount: groupChat._count.messages,
      updatedAt: groupChat.updatedAt,
    }));

    return NextResponse.json({ groupChats: result });
  } catch (error) {
    console.error('Error fetching group chats:', error);
    return NextResponse.json({ error: 'Failed to fetch group chats' }, { status: 500 });
  }
}
