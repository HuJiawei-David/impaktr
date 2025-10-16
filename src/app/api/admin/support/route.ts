import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.enum(['TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT', 'GENERAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  attachments: z.array(z.string()).default([]),
});

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  response: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | null;
    const category = url.searchParams.get('category') as 'TECHNICAL' | 'BILLING' | 'FEATURE_REQUEST' | 'BUG_REPORT' | 'GENERAL' | null;
    const priority = url.searchParams.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
    const assignedTo = url.searchParams.get('assignedTo');
    const userId = url.searchParams.get('userId');

    // Check if user is admin or support agent
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const isAdmin = user?.role === 'ADMIN';
    const isSupport = user?.role === 'SUPPORT';

    let where: any = {};

    if (!isAdmin && !isSupport) {
      // Regular users can only see their own tickets
      where.userId = session.user.id;
    } else {
      // Admins and support can see all tickets with filters
      if (status) where.status = status;
      if (category) where.category = category;
      if (priority) where.priority = priority;
      if (assignedTo) where.assignedTo = assignedTo;
      if (userId) where.userId = userId;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            responses: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        status: 'OPEN',
        ticketNumber: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    // Create notification for support team
    const supportUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPPORT'] }
      },
      select: { id: true }
    });

    await Promise.all(
      supportUsers.map(user =>
        prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SUPPORT_TICKET',
            title: 'New Support Ticket',
            message: `New ${validatedData.category.toLowerCase()} ticket: ${validatedData.subject}`,
            data: {
              ticketId: ticket.id,
              ticketNumber: ticket.ticketNumber,
              priority: validatedData.priority,
            }
          }
        })
      )
    );

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const ticketId = url.searchParams.get('id');

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateTicketSchema.parse(body);

    // Get ticket details
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: true
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const isAdmin = user?.role === 'ADMIN';
    const isSupport = user?.role === 'SUPPORT';
    const isOwner = ticket.userId === session.user.id;

    if (!isAdmin && !isSupport && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized to update ticket' }, { status: 403 });
    }

    // Update ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    // Add response if provided
    if (validatedData.response) {
      await prisma.supportResponse.create({
        data: {
          ticketId,
          userId: session.user.id,
          message: validatedData.response,
          isInternal: isAdmin || isSupport,
        }
      });

      // Create notification for ticket owner
      if (ticket.userId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: ticket.userId,
            type: 'SUPPORT_RESPONSE',
            title: 'Support Ticket Update',
            message: `Your support ticket "${ticket.subject}" has been updated.`,
            data: {
              ticketId,
              ticketNumber: ticket.ticketNumber,
            }
          }
        });
      }
    }

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update support ticket' }, { status: 500 });
  }
}

