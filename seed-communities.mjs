import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating sample communities with Meetup-style data...');

  // First, find an existing user to use as creator
  const existingUser = await prisma.user.findFirst({
    select: { id: true, name: true }
  });

  if (!existingUser) {
    console.log('No users found in database. Please create a user first.');
    return;
  }

  console.log(`Using user: ${existingUser.name} (${existingUser.id})`);

  // Create sample communities with the new fields
  const sampleCommunities = [
    {
      name: 'Climate Action Warriors',
      description: 'Join us in fighting climate change through sustainable practices and environmental advocacy.',
      category: 'Environment',
      sdgFocus: [13, 15, 12],
      primarySDG: 13,
      locationData: { city: 'Kuala Lumpur', country: 'Malaysia' },
      rating: 4.8,
      memberAvatars: [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
      ],
      tags: ['Climate', 'Sustainability', 'Environment'],
      privacy: 'PUBLIC',
      isPublic: true,
      createdBy: existingUser.id
    },
    {
      name: 'Education for All',
      description: 'Promoting quality education and equal learning opportunities for children worldwide.',
      category: 'Education',
      sdgFocus: [4, 10, 1],
      primarySDG: 4,
      locationData: { city: 'Petaling Jaya', country: 'Malaysia' },
      rating: 4.9,
      memberAvatars: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
      ],
      tags: ['Education', 'Children', 'Learning'],
      privacy: 'PUBLIC',
      isPublic: true,
      createdBy: existingUser.id
    },
    {
      name: 'Health & Wellness Champions',
      description: 'Building healthier communities through healthcare initiatives and wellness programs.',
      category: 'Healthcare',
      sdgFocus: [3, 6, 11],
      primarySDG: 3,
      locationData: { city: 'Kuala Lumpur', country: 'Malaysia' },
      rating: 4.6,
      memberAvatars: [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
      ],
      tags: ['Health', 'Wellness', 'Healthcare'],
      privacy: 'PUBLIC',
      isPublic: true,
      createdBy: existingUser.id
    }
  ];

  for (const communityData of sampleCommunities) {
    try {
      // Check if community already exists
      const existing = await prisma.community.findFirst({
        where: { name: communityData.name }
      });

      if (!existing) {
        const community = await prisma.community.create({
          data: communityData
        });
        console.log(`Created community: ${community.name}`);
      } else {
        console.log(`Community already exists: ${communityData.name}`);
      }
    } catch (error) {
      console.error(`Error creating community ${communityData.name}:`, error);
    }
  }

  console.log('Sample communities created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });