// Test gallery API
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGalleryAPI() {
  try {
    console.log('Testing gallery API...');
    
    // Get first event ID
    const event = await prisma.event.findFirst({
      select: { id: true, title: true }
    });
    
    if (!event) {
      console.log('No events found');
      return;
    }
    
    console.log(`Testing with event: ${event.title} (${event.id})`);
    
    // Test the gallery query
    const images = await prisma.eventImage.findMany({
      where: {
        eventId: event.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${images.length} images`);
    
    if (images.length > 0) {
      console.log('Sample image:', {
        id: images[0].id,
        url: images[0].url,
        caption: images[0].caption,
        user: images[0].user
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testGalleryAPI();
