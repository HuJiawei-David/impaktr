import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed event comments and gallery images...');

  // Get all events
  const events = await prisma.event.findMany({
    take: 10,
    include: {
      participations: {
        where: { status: 'VERIFIED' },
        include: { user: true },
        take: 5
      }
    }
  });

  console.log(`📊 Found ${events.length} events to seed`);

  const sampleComments = [
    "Great event! Really enjoyed volunteering here.",
    "This was such a meaningful experience. Thank you for organizing!",
    "Amazing initiative! Looking forward to the next one.",
    "Proud to be part of this wonderful cause!",
    "The organizers did an excellent job. Well planned!",
    "This event made a real difference in our community.",
    "Learned so much and met amazing people!",
    "Highly recommend joining these events!",
    "The impact we made together was incredible.",
    "Can't wait for the next volunteer opportunity!"
  ];

  const sampleReplies = [
    "Thank you for your participation!",
    "Glad you enjoyed it!",
    "Thanks for the kind words!",
    "We appreciate your dedication!",
    "Looking forward to seeing you at the next event!"
  ];

  const sampleImageUrls = [
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800",
    "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800",
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800",
    "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800",
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800"
  ];

  const sampleCaptions = [
    "Amazing turnout today!",
    "Making a difference together",
    "Great team effort",
    "Proud of what we accomplished",
    "Community coming together",
    "Beautiful day for volunteering"
  ];

  let commentsCreated = 0;
  let repliesCreated = 0;
  let imagesCreated = 0;

  for (const event of events) {
    const participants = event.participations;
    
    if (participants.length === 0) continue;

    // Add 2-4 comments per event
    const numComments = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numComments && i < participants.length; i++) {
      const participant = participants[i];
      const commentContent = sampleComments[Math.floor(Math.random() * sampleComments.length)];
      
      try {
        const comment = await prisma.eventComment.create({
          data: {
            content: commentContent,
            eventId: event.id,
            userId: participant.userId
          }
        });
        
        commentsCreated++;
        
        // 50% chance to add a reply
        if (Math.random() > 0.5 && participants.length > 1) {
          const replier = participants[Math.floor(Math.random() * participants.length)];
          const replyContent = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];
          
          await prisma.eventComment.create({
            data: {
              content: replyContent,
              eventId: event.id,
              userId: replier.userId,
              parentId: comment.id
            }
          });
          
          repliesCreated++;
        }
        
        // 30% chance to add a like
        if (Math.random() > 0.7 && participants.length > 1) {
          const liker = participants[Math.floor(Math.random() * participants.length)];
          
          try {
            await prisma.eventCommentLike.create({
              data: {
                commentId: comment.id,
                userId: liker.userId
              }
            });
          } catch (error) {
            // Ignore duplicate like errors
          }
        }
      } catch (error) {
        console.error(`Error creating comment for event ${event.id}:`, error);
      }
    }

    // Add 1-3 gallery images per event
    const numImages = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numImages && i < participants.length; i++) {
      const participant = participants[i];
      const imageUrl = sampleImageUrls[Math.floor(Math.random() * sampleImageUrls.length)];
      const caption = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)];
      
      try {
        await prisma.eventImage.create({
          data: {
            url: imageUrl,
            caption: caption,
            category: 'general',
            eventId: event.id,
            userId: participant.userId
          }
        });
        
        imagesCreated++;
      } catch (error) {
        console.error(`Error creating image for event ${event.id}:`, error);
      }
    }
  }

  console.log(`✅ Created ${commentsCreated} comments`);
  console.log(`✅ Created ${repliesCreated} replies`);
  console.log(`✅ Created ${imagesCreated} gallery images`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding comments and gallery:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

