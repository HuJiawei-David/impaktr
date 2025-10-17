import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a production environment, you might want to:
    // 1. Soft delete (mark as deleted but keep data)
    // 2. Schedule deletion after a grace period
    // 3. Send confirmation email
    // 4. Delete all related data in proper order
    
    // For now, we'll do a soft delete by updating the user status
    // Note: You may need to add a 'deleted' or 'status' field to your schema
    
    // Delete user's related data first (or use cascade)
    await prisma.$transaction(async (tx) => {
      // Delete user posts
      await tx.post.deleteMany({ where: { userId: session.user.id } });
      
      // Delete user comments
      await tx.comment.deleteMany({ where: { userId: session.user.id } });
      
      // Delete user participations
      await tx.participation.deleteMany({ where: { userId: session.user.id } });
      
      // Delete user badges
      await tx.userBadge.deleteMany({ where: { userId: session.user.id } });
      
      // Delete user achievements
      await tx.achievement.deleteMany({ where: { userId: session.user.id } });
      
      // Delete user score history
      await tx.scoreHistory.deleteMany({ where: { userId: session.user.id } });
      
      // Delete saved items
      await tx.save.deleteMany({ where: { userId: session.user.id } });
      
      // Delete notifications
      await tx.notification.deleteMany({ where: { userId: session.user.id } });
      
      // Finally, delete the user
      await tx.user.delete({ where: { id: session.user.id } });
    });

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

