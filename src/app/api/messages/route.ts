import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadToS3 } from '@/lib/aws';

type MessageType = 'TEXT' | 'IMAGE' | 'FILE';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

const sendMessageSchema = z.object({
  receiverId: z.string(),
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const receiverIdValue = formData.get('receiverId');

      if (!receiverIdValue || typeof receiverIdValue !== 'string') {
        return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
      }

      const receiverId = receiverIdValue;
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId }
      });

      if (!receiver) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

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
        const objectKey = `messages/${session.user.id}/${Date.now()}-${sanitizedFileName}`;
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

      const message = await prisma.message.create({
        data: {
          senderId: session.user.id,
          receiverId,
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
          },
          receiver: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      });

      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'MESSAGE',
          title: 'New Message',
          message: `${session.user.name} sent you a message`,
          data: {
            messageId: message.id,
            senderId: session.user.id,
          }
        }
      });

      return NextResponse.json({ message }, { status: 201 });
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    const receiver = await prisma.user.findUnique({
      where: { id: validatedData.receiverId }
    });

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: validatedData.receiverId,
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
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId: validatedData.receiverId,
        type: 'MESSAGE',
        title: 'New Message',
        message: `${session.user.name} sent you a message`,
        data: {
          messageId: message.id,
          senderId: session.user.id,
        }
      }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: conversationId },
            { senderId: conversationId, receiverId: session.user.id }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          receiver: {
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

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          receiverId: session.user.id,
          senderId: conversationId,
          isRead: false
        },
        data: { isRead: true }
      });

      return NextResponse.json({ messages: messages.reverse() });
    } else {
      // Get all conversations
      const conversations = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Group by conversation partner
      const conversationMap = new Map();
      
      conversations.forEach(message => {
        const partnerId = message.senderId === session.user.id ? message.receiverId : message.senderId;
        const partner = message.senderId === session.user.id ? message.receiver : message.sender;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partner,
            lastMessage: message,
            unreadCount: 0
          });
        }
        
        if (message.receiverId === session.user.id && !message.isRead) {
          conversationMap.get(partnerId).unreadCount++;
        }
      });

      const conversationsList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

      return NextResponse.json({ conversations: conversationsList });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

