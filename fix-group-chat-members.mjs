import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

/**
 * Fix Group Chat Members
 * 
 * This script ensures that all Group Chats have the correct members:
 * 1. Organizer (ADMIN)
 * 2. All participants (MEMBER or ADMIN if they're organizer/admin)
 * 3. Organization admins (ADMIN)
 */
async function fixGroupChatMembers() {
  try {
    console.log('Starting Group Chat members fix...');

    // Get all group chats
    const groupChats = await prisma.groupChat.findMany({
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
            organizationId: true,
            title: true
          }
        },
        members: {
          select: {
            userId: true,
            role: true
          }
        }
      }
    });

    console.log(`Found ${groupChats.length} group chats`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const groupChat of groupChats) {
      try {
        const event = groupChat.event;
        const existingMemberIds = new Set(groupChat.members.map(m => m.userId));
        let addedMembers = 0;

        // 1. Ensure organizer is a member (ADMIN)
        if (event.organizerId && !existingMemberIds.has(event.organizerId)) {
          await prisma.groupChatMember.create({
            data: {
              groupChatId: groupChat.id,
              userId: event.organizerId,
              role: 'ADMIN'
            }
          });
          existingMemberIds.add(event.organizerId);
          addedMembers++;
          console.log(`  ✓ Added organizer ${event.organizerId} to group chat ${groupChat.id}`);
        }

        // 2. Ensure all participants are members
        const participants = await prisma.participation.findMany({
          where: {
            eventId: event.id,
            status: { in: ['REGISTERED', 'PENDING', 'CONFIRMED', 'ATTENDED', 'VERIFIED'] }
          },
          select: { userId: true }
        });

        for (const participant of participants) {
          if (!existingMemberIds.has(participant.userId)) {
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
                groupChatId: groupChat.id,
                userId: participant.userId,
                role: (isOrganizer || isAdmin) ? 'ADMIN' : 'MEMBER'
              }
            });
            existingMemberIds.add(participant.userId);
            addedMembers++;
            console.log(`  ✓ Added participant ${participant.userId} to group chat ${groupChat.id}`);
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

          for (const admin of orgAdmins) {
            if (!existingMemberIds.has(admin.userId)) {
              await prisma.groupChatMember.create({
                data: {
                  groupChatId: groupChat.id,
                  userId: admin.userId,
                  role: 'ADMIN'
                }
              });
              existingMemberIds.add(admin.userId);
              addedMembers++;
              console.log(`  ✓ Added org admin ${admin.userId} to group chat ${groupChat.id}`);
            }
          }
        }

        if (addedMembers > 0) {
          fixedCount++;
          console.log(`  ✓ Fixed group chat ${groupChat.id} (${event.title}): added ${addedMembers} members`);
        } else {
          console.log(`  - Group chat ${groupChat.id} (${event.title}): already has all members`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error fixing group chat ${groupChat.id}:`, error.message);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total group chats: ${groupChats.length}`);
    console.log(`Fixed group chats: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('Group Chat members fix completed!');
  } catch (error) {
    console.error('Error fixing group chat members:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixGroupChatMembers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

