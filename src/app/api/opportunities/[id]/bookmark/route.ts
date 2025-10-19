import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if opportunity exists
    const opportunity = await prisma.opportunity.findUnique({
      where: { id }
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.opportunityBookmark.findUnique({
      where: {
        userId_opportunityId: {
          userId: session.user.id,
          opportunityId: id
        }
      }
    });

    if (existingBookmark) {
      return NextResponse.json({ error: 'Already bookmarked' }, { status: 400 });
    }

    // Create bookmark
    await prisma.opportunityBookmark.create({
      data: {
        userId: session.user.id,
        opportunityId: id
      }
    });

    return NextResponse.json({ message: 'Bookmarked successfully' });
  } catch (error) {
    console.error('Error bookmarking opportunity:', error);
    return NextResponse.json({ error: 'Failed to bookmark opportunity' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete bookmark
    await prisma.opportunityBookmark.deleteMany({
      where: {
        userId: session.user.id,
        opportunityId: id
      }
    });

    return NextResponse.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
  }
}
