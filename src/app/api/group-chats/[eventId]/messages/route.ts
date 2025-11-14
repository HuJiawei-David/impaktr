import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadToS3 } from '@/lib/aws';
import { emitToUser } from '@/lib/socket';

type MessageType = 'TEXT' | 'IMAGE' | 'FILE';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
});

const getFileExtension = (fileName: string) => {
  const index = fileName.lastIndexOf('.');
  if (index === -1) {
    return '';
  }
  return fileName.slice(index).toLowerCase();
};

const isSupportedFileType = (mimeType: string, extension: string) => {
  if (mimeType.startsWith('image/')) {
    return true;
  }

  if (ALLOWED_MIME_TYPES.has(mimeType)) {
    return true;
  }

  if (extension && ALLOWED_EXTENSIONS.has(extension)) {
    return true;
  }

  return false;
};

const deriveMimeType = (file: File) => {
  if (file.type) {
    return file.type;
  }

  const extension = getFileExtension(file.name);
  switch (extension) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
};

const determineMessageType = (mimeType: string): MessageType => {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  }
  return 'FILE';
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^\w.-]/g, '-').replace(/-+/g, '-');

// Get messages for a group chat
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
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get group chat
    let groupChat = await prisma.groupChat.findUnique({
      where: { eventId },
      include: {
        members: {
          where: { userId: session.user.id }
        },
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
            organizationId: true
          }
        }
      }
    });

    if (!groupChat) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // Check if user is a member, if not, check access and add them
    const isMember = groupChat.members.length > 0;
    
    if (!isMember) {
      // Check if user should have access
      const participation = await prisma.participation.findFirst({
        where: {
          eventId,
          userId: session.user.id,
          status: { in: ['REGISTERED', 'PENDING', 'CONFIRMED', 'ATTENDED', 'VERIFIED'] }
        }
      });

      const isOrganizer = groupChat.event.organizerId === session.user.id;
      const isAdmin = groupChat.event.organizationId ? await prisma.organizationMember.findFirst({
        where: {
          organizationId: groupChat.event.organizationId,
          userId: session.user.id,
          role: { in: ['admin', 'owner'] }
        }
      }) : null;

      if (!participation && !isOrganizer && !isAdmin) {
        return NextResponse.json({ error: 'Access denied. You must be a participant, organizer, or admin to view messages.' }, { status: 403 });
      }

      // Add user to group chat
      try {
        await prisma.groupChatMember.create({
          data: {
            groupChatId: groupChat.id,
            userId: session.user.id,
            role: (isOrganizer || isAdmin) ? 'ADMIN' : 'MEMBER'
          }
        });
      } catch (err: any) {
        // Ignore unique constraint errors (member already exists)
        if (!err?.message?.includes('Unique constraint') && err?.code !== 'P2002') {
          console.error('Error adding user to group chat:', err);
        }
      }
    }

    // Get messages
    const messages = await prisma.groupChatMessage.findMany({
      where: { groupChatId: groupChat.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching group chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// Send a message to a group chat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    // Get group chat
    let groupChat = await prisma.groupChat.findUnique({
      where: { eventId },
      include: {
        members: {
          where: { userId: session.user.id }
        },
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
            organizationId: true
          }
        }
      }
    });

    if (!groupChat) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 });
    }

    // Check if user is a member, if not, check access and add them
    const isMember = groupChat.members.length > 0;
    
    if (!isMember) {
      // Check if user should have access
      const participation = await prisma.participation.findFirst({
        where: {
          eventId,
          userId: session.user.id,
          status: { in: ['REGISTERED', 'PENDING', 'CONFIRMED', 'ATTENDED', 'VERIFIED'] }
        }
      });

      const isOrganizer = groupChat.event.organizerId === session.user.id;
      const isAdmin = groupChat.event.organizationId ? await prisma.organizationMember.findFirst({
        where: {
          organizationId: groupChat.event.organizationId,
          userId: session.user.id,
          role: { in: ['admin', 'owner'] }
        }
      }) : null;

      if (!participation && !isOrganizer && !isAdmin) {
        return NextResponse.json({ error: 'Access denied. You must be a participant, organizer, or admin to send messages.' }, { status: 403 });
      }

      // Add user to group chat
      try {
        await prisma.groupChatMember.create({
          data: {
            groupChatId: groupChat.id,
            userId: session.user.id,
            role: (isOrganizer || isAdmin) ? 'ADMIN' : 'MEMBER'
          }
        });
      } catch (err: any) {
        // Ignore unique constraint errors (member already exists)
        if (!err?.message?.includes('Unique constraint') && err?.code !== 'P2002') {
          console.error('Error adding user to group chat:', err);
          return NextResponse.json({ error: 'Failed to add user to group chat' }, { status: 500 });
        }
      }
    }

    // Double-check user is a member before allowing message send
    const memberCheck = await prisma.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: groupChat.id,
          userId: session.user.id
        }
      }
    });

    if (!memberCheck) {
      return NextResponse.json({ error: 'You must be a member of this group chat to send messages.' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const rawContent = formData.get('content');
      const textContent =
        typeof rawContent === 'string' ? rawContent.trim().slice(0, 1000) : '';
      const fileEntry = formData.get('file');
      let messageType: MessageType = 'TEXT';
      let storedContent = textContent;

      if (fileEntry && typeof fileEntry === 'object' && 'arrayBuffer' in fileEntry) {
        const file = fileEntry as File;

        if (!file || file.size === 0) {
          return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: 'File is too large. Maximum size is 10MB.' },
            { status: 400 }
          );
        }

        const extension = getFileExtension(file.name);
        const mimeType = deriveMimeType(file);

        if (!isSupportedFileType(mimeType, extension)) {
          return NextResponse.json(
            { error: 'Unsupported file type. Only PDFs, Word documents, and images are allowed.' },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const sanitizedFileName = sanitizeFileName(file.name);
        const objectKey = `group-chat-messages/${groupChat.id}/${Date.now()}-${sanitizedFileName}`;
        const fileUrl = await uploadToS3(buffer, objectKey, mimeType);

        messageType = determineMessageType(mimeType);
        storedContent = JSON.stringify({
          text: textContent || undefined,
          url: fileUrl,
          name: file.name,
          mimeType,
          size: file.size,
        });
      } else if (!textContent) {
        return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
      }

      const message = await prisma.groupChatMessage.create({
        data: {
          groupChatId: groupChat.id,
          senderId: session.user.id,
          content: storedContent,
          type: messageType,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      });

      // Notify all members except sender
      const members = await prisma.groupChatMember.findMany({
        where: {
          groupChatId: groupChat.id,
          userId: { not: session.user.id }
        },
        select: { userId: true }
      });

      await Promise.all(
        members.map(member =>
          prisma.notification.create({
            data: {
              userId: member.userId,
              type: 'MESSAGE',
              title: 'New Group Chat Message',
              message: `${session.user.name} sent a message in ${groupChat.name}`,
              data: {
                groupChatId: groupChat.id,
                eventId,
                messageId: message.id,
                senderId: session.user.id,
              }
            }
          })
        )
      );

      // Emit real-time events to all members except sender to move group chat to top
      members.forEach(member => {
        emitToUser(member.userId, 'new-message', {
          message: {
            id: message.id,
            content: message.content,
            type: message.type,
            isRead: false,
            createdAt: message.createdAt.toISOString(),
            sender: message.sender,
            receiver: message.sender, // Group chats don't have receiver
          },
          eventId: eventId,
          senderId: session.user.id,
        });
      });

      return NextResponse.json({ message }, { status: 201 });
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    const message = await prisma.groupChatMessage.create({
      data: {
        groupChatId: groupChat.id,
        senderId: session.user.id,
        content: validatedData.content.trim(),
        type: validatedData.type,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    // Notify all members except sender
    const members = await prisma.groupChatMember.findMany({
      where: {
        groupChatId: groupChat.id,
        userId: { not: session.user.id }
      },
      select: { userId: true }
    });

    await Promise.all(
      members.map(member =>
        prisma.notification.create({
          data: {
            userId: member.userId,
            type: 'MESSAGE',
            title: 'New Group Chat Message',
            message: `${session.user.name} sent a message in ${groupChat.name}`,
            data: {
              groupChatId: groupChat.id,
              eventId,
              messageId: message.id,
              senderId: session.user.id,
            }
          }
        })
      )
    );

    // Emit real-time events to all members except sender to move group chat to top
    members.forEach(member => {
      emitToUser(member.userId, 'new-message', {
        message: {
          id: message.id,
          content: message.content,
          type: message.type,
          isRead: false,
          createdAt: message.createdAt.toISOString(),
          sender: message.sender,
          receiver: message.sender, // Group chats don't have receiver
        },
        eventId: eventId,
        senderId: session.user.id,
      });
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending group chat message:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

