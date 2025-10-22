// Check what tables exist
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('Checking tables...\n');
    
    // Check event_comments table
    try {
      const comments = await prisma.eventComment.findMany({ take: 1 });
      console.log('✅ event_comments table exists, found', comments.length, 'comments (showing first)');
    } catch (error) {
      console.log('❌ event_comments table missing:', error.message);
    }
    
    // Check event_images table
    try {
      const images = await prisma.eventImage.findMany({ take: 1 });
      console.log('✅ event_images table exists, found', images.length, 'images (showing first)');
    } catch (error) {
      console.log('❌ event_images table missing:', error.message);
    }
    
    // Check event_bookmarks table
    try {
      const bookmarks = await prisma.eventBookmark.findMany({ take: 1 });
      console.log('✅ event_bookmarks table exists, found', bookmarks.length, 'bookmarks (showing first)');
    } catch (error) {
      console.log('❌ event_bookmarks table missing:', error.message);
    }
    
    // Check event_comment_likes table
    try {
      const likes = await prisma.eventCommentLike.findMany({ take: 1 });
      console.log('✅ event_comment_likes table exists');
    } catch (error) {
      console.log('❌ event_comment_likes table missing:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
