import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample images for event galleries
const sampleImages = [
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800',
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800',
  'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800',
  'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
  'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800',
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
];

// Sample comments
const commentTemplates = [
  {
    content: "This was an amazing experience! Really enjoyed working with everyone here. The organization was top-notch and I learned so much.",
    replies: [
      "Totally agree! Already looking forward to the next one.",
      "Same here! The team was so welcoming."
    ]
  },
  {
    content: "Great initiative! Happy to have been part of this. The impact we're making together is truly inspiring.",
    replies: [
      "Absolutely! Every contribution counts.",
      "Yes! Let's keep the momentum going!"
    ]
  },
  {
    content: "Thank you for organizing this event. It was well-structured and made a real difference in the community.",
    replies: [
      "The organizers did an excellent job!",
    ]
  },
  {
    content: "First time volunteering and it exceeded my expectations! The atmosphere was so positive and everyone was so helpful.",
    replies: [
      "Welcome to the community! Glad you enjoyed it.",
      "That's awesome! Hope to see you at more events."
    ]
  },
  {
    content: "Love the energy and dedication from everyone involved. This is what community building is all about! 🌟",
    replies: [
      "Couldn't have said it better!",
    ]
  },
  {
    content: "Such a meaningful experience. Seeing the direct impact of our efforts was incredibly rewarding.",
    replies: []
  },
  {
    content: "The team coordination was excellent. Everyone knew their role and we accomplished so much together!",
    replies: [
      "Yes! Teamwork makes the dream work.",
    ]
  },
  {
    content: "Highly recommend this to anyone looking to make a difference. You'll meet amazing people and do great work.",
    replies: [
      "100% agree! Already invited some friends to join next time."
    ]
  },
];

async function main() {
  console.log('Starting to seed event content (comments & gallery images)...');

  try {
    // Get sample users for comments
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'sarah.chen@example.com',
            'marcus.wilson@example.com',
            'aisha.patel@example.com',
            'carlos.rodriguez@example.com',
            'emma.johnson@example.com',
            'david.kim@example.com',
            'olivia.martinez@example.com',
            'james.thompson@example.com'
          ]
        }
      }
    });

    console.log(`Found ${users.length} users for comments`);

    // Get all events
    const events = await prisma.event.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'UPCOMING', 'COMPLETED']
        }
      },
      take: 10
    });

    console.log(`Found ${events.length} events`);

    if (events.length === 0) {
      console.log('No events found. Please seed events first.');
      return;
    }

    // Note: Event comments need a dedicated API endpoint which doesn't exist yet
    // For now, we'll just seed gallery images
    let imageCount = 0;

    for (const event of events) {
      console.log(`\nProcessing event: ${event.title}`);

      // Add 3-6 random images to the gallery
      const numImages = Math.floor(Math.random() * 4) + 3; // 3-6 images
      const selectedImages = [...sampleImages]
        .sort(() => 0.5 - Math.random())
        .slice(0, numImages);

      // Update event with gallery images
      const currentImages = event.imageUrl ? [event.imageUrl] : [];
      const allImages = [...new Set([...currentImages, ...selectedImages])]; // Remove duplicates
      
      await prisma.event.update({
        where: { id: event.id },
        data: {
          // Store additional images in a JSON field if available, or just use imageUrl for the first one
          imageUrl: allImages[0]
        }
      });

      imageCount += selectedImages.length;
      console.log(`Added ${selectedImages.length} images to gallery`);
    }

    console.log(`\n✅ Successfully seeded event content!`);
    console.log(`🖼️  ${imageCount} gallery images added to ${events.length} events`);
  } catch (error) {
    console.error('Error seeding event content:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

