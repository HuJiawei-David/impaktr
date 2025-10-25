import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function seedOrganizationPosts() {
  try {
    console.log('🌱 Seeding organization posts...');

    // Get the first organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ No organizations found. Please seed organizations first.');
      return;
    }

    // Get a user to be the author
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    // Create sample organization posts
    const posts = [
      {
        organizationId: organization.id,
        authorId: user.id,
        content: "🌱 Exciting news! We just completed our largest beach cleanup event of the year with over 200 volunteers! Together, we collected 2.5 tons of plastic waste and marine debris. This incredible effort directly supports SDG 14 (Life Below Water) and SDG 15 (Life on Land). Thank you to all our amazing volunteers who made this possible! 🙌",
        postType: 'EVENT_RECAP',
        images: [
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=400&fit=crop',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop'
        ],
        location: 'Marina Bay, Singapore',
        sdgs: [14, 15],
        tags: ['beach cleanup', 'marine conservation', 'volunteer event'],
        hoursReported: 800,
        peopleReached: 200,
        volunteersCount: 200,
        visibility: 'PUBLIC',
        isPinned: true,
        likes: 45,
        shares: 12,
        kudos: 28
      },
      {
        organizationId: organization.id,
        authorId: user.id,
        content: "📅 Join us for our upcoming 'Green City Initiative' workshop this Saturday! We'll be teaching sustainable urban gardening techniques and distributing free seed packets to community members. Perfect for beginners and families! 🌿",
        postType: 'EVENT_ANNOUNCE',
        images: [
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop'
        ],
        location: 'Community Garden, Kuala Lumpur',
        sdgs: [11, 15],
        tags: ['workshop', 'urban gardening', 'sustainability', 'community'],
        visibility: 'PUBLIC',
        likes: 23,
        shares: 8,
        kudos: 15
      },
      {
        organizationId: organization.id,
        authorId: user.id,
        content: "🎉 We're thrilled to announce that we've reached a major milestone: 10,000 volunteer hours contributed to environmental causes this year! This achievement represents the dedication of our incredible community of changemakers. Every hour counts towards building a more sustainable future. 🌍",
        postType: 'MILESTONE',
        images: [
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=400&fit=crop'
        ],
        sdgs: [13, 15],
        tags: ['milestone', 'volunteer hours', 'achievement'],
        hoursReported: 10000,
        visibility: 'PUBLIC',
        isPinned: true,
        likes: 67,
        shares: 25,
        kudos: 42
      },
      {
        organizationId: organization.id,
        authorId: user.id,
        content: "🤝 We're excited to announce our new partnership with Tech for Good Foundation! Together, we'll be launching a digital literacy program for underserved communities, combining technology education with environmental awareness. This collaboration will help bridge the digital divide while promoting sustainable practices. 💻🌱",
        postType: 'PARTNERSHIP',
        images: [
          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop'
        ],
        sdgs: [4, 10, 17],
        tags: ['partnership', 'digital literacy', 'technology', 'education'],
        visibility: 'PUBLIC',
        likes: 34,
        shares: 18,
        kudos: 22
      },
      {
        organizationId: organization.id,
        authorId: user.id,
        content: "📊 Our latest impact report is here! In the past quarter, we've successfully planted 5,000 trees across 3 cities, educated 1,200 students about climate change, and supported 15 local environmental initiatives. These numbers represent real change happening in our communities. Thank you for being part of this journey! 📈",
        postType: 'IMPACT_STORY',
        images: [
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop'
        ],
        sdgs: [13, 15],
        tags: ['impact report', 'trees planted', 'education', 'climate action'],
        hoursReported: 2500,
        peopleReached: 1200,
        volunteersCount: 150,
        visibility: 'PUBLIC',
        likes: 56,
        shares: 21,
        kudos: 35
      }
    ];

    // Create the posts
    for (const postData of posts) {
      const post = await prisma.organizationPost.create({
        data: postData
      });
      console.log(`✅ Created post: ${post.content.substring(0, 50)}...`);
    }

    console.log('🎉 Successfully seeded organization posts!');

  } catch (error) {
    console.error('❌ Error seeding organization posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOrganizationPosts();
