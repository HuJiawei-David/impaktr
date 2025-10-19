require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find Jimmy University organization
    const organization = await prisma.organization.findFirst({
      where: {
        name: 'Jimmy University'
      },
      include: {
        members: {
          where: {
            role: 'owner'
          }
        }
      }
    });

    if (!organization) {
      console.log('❌ Jimmy University organization not found. Please run organization seed first.');
      return;
    }

    console.log('✅ Found organization:', organization.name);
    console.log('Organization ID:', organization.id);

    const ownerId = organization.members[0]?.userId;
    if (!ownerId) {
      console.log('❌ No owner found for organization');
      return;
    }

    console.log('Owner ID:', ownerId);

    // Delete existing events for this organization
    await prisma.participation.deleteMany({
      where: {
        event: {
          organizationId: organization.id
        }
      }
    });

    await prisma.event.deleteMany({
      where: {
        organizationId: organization.id
      }
    });

    console.log('🗑️  Cleared existing events');

    // Create diverse events
    const events = [
      {
        title: 'Beach Cleanup Drive - Pantai Cenang',
        description: 'Join us for a community beach cleanup to protect marine life and preserve our beautiful coastlines. We will provide all necessary equipment including gloves, bags, and refreshments. This is a great opportunity to meet like-minded individuals and make a tangible impact on our environment.',
        type: 'WORKSHOP',
        status: 'UPCOMING',
        startDate: new Date('2025-11-15T09:00:00Z'),
        endDate: new Date('2025-11-15T12:00:00Z'),
        registrationDeadline: new Date('2025-11-10T23:59:59Z'),
        registrationDeadline: new Date('2025-11-10T23:59:59Z'),
        location: JSON.stringify({
          address: 'Pantai Cenang Beach',
          city: 'Langkawi',
          state: 'Kedah',
          country: 'Malaysia',
          postalCode: '07000',
          isVirtual: false,
          coordinates: { lat: 6.2936, lng: 99.7263 }
        }),
        maxParticipants: 50,
        imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800',
        sdg: JSON.stringify([14, 15, 13]), // Life Below Water, Life on Land, Climate Action
        skills: ['Environmental Awareness', 'Teamwork', 'Physical Activity'],
        intensity: 1.2,
        verificationType: 'PHOTO',
        requiresApproval: false,
        autoIssueCertificates: true,
        eventInstructions: 'Please wear comfortable clothing and closed-toe shoes. Bring sunscreen and a water bottle. Meeting point is at the main beach entrance.',
        materialsNeeded: ['Gloves (provided)', 'Trash bags (provided)', 'Water bottle', 'Sunscreen', 'Hat'],
        emergencyContact: JSON.stringify({
          name: 'Sarah Lee',
          phone: '+60-12-345-6789',
          email: 'sarah@jimmyuni.edu'
        }),
        organizerId: ownerId,
        organizationId: organization.id
      },
      {
        title: 'Food Distribution for Homeless - KL City Center',
        description: 'Help distribute nutritious meals to homeless individuals in the city center. We partner with local restaurants to provide hot meals every weekend. This is a meaningful way to give back to the community and learn about food security issues.',
        type: 'VOLUNTEERING',
        status: 'UPCOMING',
        startDate: new Date('2025-11-20T18:00:00Z'),
        endDate: new Date('2025-11-20T21:00:00Z'),
        registrationDeadline: new Date('2025-11-18T23:59:59Z'),
        location: JSON.stringify({
          address: 'Masjid Jamek LRT Station',
          city: 'Kuala Lumpur',
          state: 'Federal Territory of Kuala Lumpur',
          country: 'Malaysia',
          postalCode: '50050',
          isVirtual: false,
          coordinates: { lat: 3.1478, lng: 101.6953 }
        }),
        maxParticipants: 30,
        imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800',
        sdg: JSON.stringify([1, 2, 3]), // No Poverty, Zero Hunger, Good Health
        skills: ['Community Service', 'Empathy', 'Communication'],
        intensity: 1.0,
        verificationType: 'CHECK_IN',
        requiresApproval: true,
        autoIssueCertificates: true,
        eventInstructions: 'Please arrive 15 minutes early for briefing. We will divide into teams for efficient distribution.',
        materialsNeeded: ['Face mask', 'Hand sanitizer', 'Comfortable shoes'],
        emergencyContact: JSON.stringify({
          name: 'Ahmad Hassan',
          phone: '+60-11-234-5678',
          email: 'ahmad@jimmyuni.edu'
        }),
        organizerId: ownerId,
        organizationId: organization.id
      },
      {
        title: 'Tree Planting Campaign - Taman Tugu',
        description: 'Join our massive tree planting initiative to combat climate change and restore urban green spaces. We aim to plant 500 trees in one day! Experienced foresters will guide you through proper planting techniques.',
        type: 'WORKSHOP',
        status: 'UPCOMING',
        startDate: new Date('2025-12-01T07:00:00Z'),
        endDate: new Date('2025-12-01T13:00:00Z'),
        registrationDeadline: new Date('2025-11-25T23:59:59Z'),
        location: JSON.stringify({
          address: 'Taman Tugu KL',
          city: 'Kuala Lumpur',
          state: 'Federal Territory of Kuala Lumpur',
          country: 'Malaysia',
          postalCode: '50480',
          isVirtual: false,
          coordinates: { lat: 3.1667, lng: 101.7000 }
        }),
        maxParticipants: 100,
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
        sdg: JSON.stringify([13, 15, 11]), // Climate Action, Life on Land, Sustainable Cities
        skills: ['Environmental Stewardship', 'Physical Labor', 'Teamwork'],
        intensity: 1.5,
        verificationType: 'ORGANIZER',
        requiresApproval: false,
        autoIssueCertificates: true,
        eventInstructions: 'Wear old clothes that can get dirty. Bring gardening gloves if you have them. Lunch will be provided.',
        materialsNeeded: ['Old clothes', 'Gardening gloves (optional)', 'Water bottle', 'Sun protection'],
        emergencyContact: JSON.stringify({
          name: 'David Chen',
          phone: '+60-13-456-7890',
          email: 'david@jimmyuni.edu'
        }),
        organizerId: ownerId,
        organizationId: organization.id
      },
      {
        title: 'Digital Literacy Workshop for Seniors',
        description: 'Teach elderly community members essential digital skills including smartphone usage, video calls, online banking safety, and social media basics. Make a real difference in bridging the digital divide.',
        type: 'WORKSHOP',
        status: 'UPCOMING',
        startDate: new Date('2025-11-25T14:00:00Z'),
        endDate: new Date('2025-11-25T17:00:00Z'),
        location: JSON.stringify({
          address: 'Jimmy University Community Center',
          city: 'Petaling Jaya',
          state: 'Selangor',
          country: 'Malaysia',
          postalCode: '46150',
          isVirtual: false,
          coordinates: { lat: 3.0738, lng: 101.5183 }
        }),
        maxParticipants: 20,
        imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800',
        sdg: JSON.stringify([4, 10, 9]), // Quality Education, Reduced Inequalities, Industry & Innovation
        skills: ['Teaching', 'Patience', 'Technology', 'Communication'],
        intensity: 0.8,
        verificationType: 'ORGANIZER',
        requiresApproval: true,
        autoIssueCertificates: true,
        eventInstructions: 'Bring your own device to demonstrate. Be patient and speak clearly. We will provide printed handouts.',
        materialsNeeded: ['Laptop or tablet', 'Charger', 'Patience'],
        emergencyContact: JSON.stringify({
          name: 'Lisa Wong',
          phone: '+60-12-567-8901',
          email: 'lisa@jimmyuni.edu'
        }),
        organizerId: ownerId,
        organizationId: organization.id
      },
      {
        title: 'Community Garden Setup - Urban Farming Initiative',
        description: 'Help build a community garden from scratch! Learn about sustainable urban farming, composting, and growing your own food. This is a long-term project that will benefit the local community for years to come.',
        type: 'VOLUNTEERING',
        status: 'UPCOMING',
        startDate: new Date('2025-12-10T08:00:00Z'),
        endDate: new Date('2025-12-10T15:00:00Z'),
        location: JSON.stringify({
          address: 'Taman Paramount Community Space',
          city: 'Petaling Jaya',
          state: 'Selangor',
          country: 'Malaysia',
          postalCode: '46000',
          isVirtual: false,
          coordinates: { lat: 3.0952, lng: 101.6063 }
        }),
        maxParticipants: 40,
        imageUrl: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=800',
        sdg: JSON.stringify([2, 11, 12]), // Zero Hunger, Sustainable Cities, Responsible Consumption
        skills: ['Gardening', 'Construction', 'Planning', 'Physical Labor'],
        intensity: 1.8,
        verificationType: 'PHOTO',
        requiresApproval: false,
        autoIssueCertificates: true,
        eventInstructions: 'Bring work gloves and wear sturdy shoes. Tools will be provided. Lunch included.',
        materialsNeeded: ['Work gloves', 'Sturdy shoes', 'Water bottle', 'Sun hat'],
        emergencyContact: JSON.stringify({
          name: 'Michael Tan',
          phone: '+60-14-678-9012',
          email: 'michael@jimmyuni.edu'
        }),
        organizerId: ownerId,
        organizationId: organization.id
      },
      {
        title: 'Mental Health Awareness Workshop',
        description: 'Interactive workshop on mental health awareness, stress management, and supporting peers. Led by certified counselors. Learn to recognize signs of distress and provide appropriate support.',
        type: 'WORKSHOP',
        status: 'UPCOMING',
        startDate: new Date('2025-11-28T19:00:00Z'),
        endDate: new Date('2025-11-28T21:00:00Z'),
        location: JSON.stringify({
          address: 'Jimmy University Auditorium',
          city: 'Petaling Jaya',
          state: 'Selangor',
          country: 'Malaysia',
          postalCode: '46150',
          isVirtual: false,
          coordinates: { lat: 3.0738, lng: 101.5183 }
        }),
        maxParticipants: 80,
        imageUrl: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
        sdg: JSON.stringify([3, 4, 10]), // Good Health, Quality Education, Reduced Inequalities
        skills: ['Active Listening', 'Empathy', 'Communication'],
        intensity: 0.5,
        verificationType: 'CHECK_IN',
        requiresApproval: false,
        autoIssueCertificates: true,
        eventInstructions: 'This is a safe space. Please be respectful and maintain confidentiality.',
        materialsNeeded: ['Open mind', 'Notebook (optional)'],
        emergencyContact: JSON.stringify({
          name: 'Dr. Priya Kumar',
          phone: '+60-12-789-0123',
          email: 'priya@jimmyuni.edu'
        }),
        organizerId: ownerId,
        organizationId: organization.id
      },
      {
        title: 'Virtual Coding Bootcamp for Underprivileged Youth',
        description: 'Teach basic coding skills to underprivileged youth online. Help bridge the digital divide and open up new career opportunities. No prior teaching experience needed - training provided.',
        type: 'WORKSHOP',
        status: 'UPCOMING',
        startDate: new Date('2025-12-05T15:00:00Z'),
        endDate: new Date('2025-12-05T18:00:00Z'),
        location: JSON.stringify({
          address: 'Online via Zoom',
          city: 'Online',
          state: 'Online',
          country: 'Malaysia',
          isVirtual: true
        }),
        maxParticipants: 50,
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        sdg: JSON.stringify([4, 8, 10]), // Quality Education, Decent Work, Reduced Inequalities
        skills: ['Programming', 'Teaching', 'Mentoring', 'Patience'],
        intensity: 1.0,
        verificationType: 'ATTENDANCE',
        requiresApproval: true,
        autoIssueCertificates: true,
        eventInstructions: 'Zoom link will be sent 24 hours before. Test your audio/video beforehand.',
        materialsNeeded: ['Computer', 'Stable internet', 'Zoom app', 'Teaching materials (provided)'],
        emergencyContact: JSON.stringify({
          name: 'Kevin Ng',
          phone: '+60-11-890-1234',
          email: 'kevin@jimmyuni.edu'
        }),
        organizerId: ownerId,
        organizationId: organization.id
      },
      {
        title: 'River Cleanup & Water Quality Testing',
        description: 'Scientific river cleanup combining environmental action with citizen science. Learn to test water quality while removing pollution. Data will be shared with environmental agencies.',
        type: 'VOLUNTEERING',
        status: 'UPCOMING',
        startDate: new Date('2025-12-15T08:00:00Z'),
        endDate: new Date('2025-12-15T13:00:00Z'),
        location: JSON.stringify({
          address: 'Sungai Klang Riverbank',
          city: 'Kuala Lumpur',
          state: 'Federal Territory of Kuala Lumpur',
          country: 'Malaysia',
          postalCode: '50050',
          isVirtual: false,
          coordinates: { lat: 3.1390, lng: 101.6869 }
        }),
        maxParticipants: 35,
        imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800',
        sdg: JSON.stringify([6, 14, 15]), // Clean Water, Life Below Water, Life on Land
        skills: ['Environmental Science', 'Data Collection', 'Teamwork'],
        intensity: 1.3,
        verificationType: 'PHOTO',
        requiresApproval: false,
        autoIssueCertificates: true,
        eventInstructions: 'Wear waterproof shoes and clothes that can get wet. All equipment provided.',
        materialsNeeded: ['Waterproof shoes', 'Change of clothes', 'Towel', 'Water bottle'],
        emergencyContact: JSON.stringify({
          name: 'Dr. Siti Rahman',
          phone: '+60-13-901-2345',
          email: 'siti@jimmyuni.edu'
        }),
        organizerId: ownerId,
        organizationId: organization.id
      }
    ];

    // Create all events
    let createdCount = 0;
    for (const eventData of events) {
      const event = await prisma.event.create({
        data: eventData
      });
      createdCount++;
      console.log(`✅ Created event: ${event.title}`);
    }

    console.log(`\n🎉 Successfully created ${createdCount} events for ${organization.name}!`);
    console.log('\n📊 Event Summary:');
    console.log(`- Organization: ${organization.name}`);
    console.log(`- Total Events: ${createdCount}`);
    console.log(`- Event Types: ${events.map(e => e.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`);
    console.log(`- SDGs Covered: ${[...new Set(events.flatMap(e => JSON.parse(e.sdg)))].sort((a, b) => a - b).join(', ')}`);

  } catch (error) {
    console.error('❌ Error seeding events:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

