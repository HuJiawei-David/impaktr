import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🗑️  Clearing existing data...');
    
    // Clear all data in correct order (respecting foreign key constraints)
    await prisma.eventBookmark.deleteMany();
    await prisma.opportunityBookmark.deleteMany();
    await prisma.application.deleteMany();
    await prisma.participation.deleteMany();
    await prisma.event.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Database cleared');

    // Create individual user (friedman@test.com)
    const individualUser = await prisma.user.create({
      data: {
        name: 'Friedman Chen',
        email: 'friedman@test.com',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        bio: 'Passionate about environmental conservation and community impact.',
        city: 'Kuala Lumpur',
        country: 'Malaysia'
      }
    });

    // Create volunteer profile for individual user
    await prisma.volunteerProfile.create({
      data: {
        userId: individualUser.id,
        bio: 'Passionate about environmental conservation and community impact.',
        interests: ['Environmental Conservation', 'Community Development', 'Education'],
        skills: ['Leadership', 'Project Management', 'Public Speaking', 'Data Analysis'],
        availability: 'PART_TIME'
      }
    });
    console.log('✅ Created individual user: Friedman Chen');

    // Create organization user (juni@test.com)
    const organizationUser = await prisma.user.create({
      data: {
        name: 'Juni Ahmad',
        email: 'juni@test.com',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
        bio: 'Environmental activist and community organizer.',
        city: 'Petaling Jaya',
        country: 'Malaysia'
      }
    });

    // Create volunteer profile for organization user
    await prisma.volunteerProfile.create({
      data: {
        userId: organizationUser.id,
        bio: 'Environmental activist and community organizer.',
        interests: ['Climate Action', 'Social Justice', 'Youth Development'],
        skills: ['Community Organizing', 'Event Planning', 'Social Media', 'Fundraising'],
        availability: 'FULL_TIME'
      }
    });
    console.log('✅ Created organization user: Juni Ahmad');

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: 'Green Impact Malaysia',
        description: 'Leading environmental organization focused on climate action and community development in Malaysia.',
        website: 'https://greenimpactmalaysia.org',
        email: 'info@greenimpactmalaysia.org',
        phone: '+60 3-1234-5678',
        address: '123 Environmental Street, Kuala Lumpur, Malaysia',
        city: 'Kuala Lumpur',
        country: 'Malaysia',
        industry: 'ENVIRONMENTAL',
        companySize: 'MEDIUM',
        subscriptionTier: 'PROFESSIONAL',
        logo: 'https://images.unsplash.com/photo-1569163139394-de446b5a5b2e?w=200&h=200&fit=crop&crop=center',
        type: 'NGO'
      }
    });
    console.log('✅ Created organization: Green Impact Malaysia');

    // Create organization membership
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: organizationUser.id,
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: new Date()
      }
    });
    console.log('✅ Created organization membership');

    // Create events
    const events = [
      {
        title: 'Beach Cleanup Drive - Pantai Cenang',
        description: 'Join us for a community beach cleanup to protect marine life and preserve our beautiful coastlines. We will provide all necessary equipment including gloves, bags, and refreshments. This is a great opportunity to meet like-minded individuals and make a tangible impact on our environment.',
        type: 'WORKSHOP',
        status: 'UPCOMING',
        startDate: new Date('2025-11-15T09:00:00Z'),
        endDate: new Date('2025-11-15T12:00:00Z'),
        registrationDeadline: new Date('2025-11-10T23:59:59Z'),
        location: JSON.stringify({
          address: 'Pantai Cenang, Langkawi',
          city: 'Langkawi',
          coordinates: { lat: 6.3000, lng: 99.8000 }
        }),
        sdg: JSON.stringify(['14', '15']),
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
        maxParticipants: 50,
        isPublic: true,
        organizerId: organizationUser.id,
        organizationId: organization.id,
        skills: ['Environmental Awareness', 'Teamwork', 'Community Service'],
        intensity: 1.2,
        verificationType: 'CHECK_IN',
        eventInstructions: 'Please bring water, sunscreen, and wear comfortable clothes. We will provide all cleanup equipment.',
        materialsNeeded: ['Gloves', 'Trash bags', 'Water bottles'],
        emergencyContact: {
          name: 'Juni Ahmad',
          phone: '+60 12-345-6789',
          email: 'juni@test.com'
        },
        requiresApproval: false,
        autoIssueCertificates: true
      },
      {
        title: 'Urban Gardening Workshop',
        description: 'Learn sustainable gardening techniques for urban environments. Perfect for beginners who want to start their own green space at home.',
        type: 'WORKSHOP',
        status: 'UPCOMING',
        startDate: new Date('2025-11-20T14:00:00Z'),
        endDate: new Date('2025-11-20T17:00:00Z'),
        registrationDeadline: new Date('2025-11-15T23:59:59Z'),
        location: JSON.stringify({
          address: 'Community Center, KL',
          city: 'Kuala Lumpur',
          coordinates: { lat: 3.1390, lng: 101.6869 }
        }),
        sdg: JSON.stringify(['11', '12', '15']),
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
        maxParticipants: 30,
        isPublic: true,
        organizerId: organizationUser.id,
        organizationId: organization.id,
        skills: ['Gardening', 'Sustainability', 'Teaching'],
        intensity: 1.0,
        verificationType: 'ORGANIZER',
        eventInstructions: 'Bring a notebook and pen. We will provide all gardening materials.',
        materialsNeeded: ['Seeds', 'Pots', 'Soil', 'Watering cans'],
        emergencyContact: {
          name: 'Juni Ahmad',
          phone: '+60 12-345-6789',
          email: 'juni@test.com'
        },
        requiresApproval: false,
        autoIssueCertificates: true
      },
      {
        title: 'Climate Change Awareness Campaign',
        description: 'Help us spread awareness about climate change through street outreach and educational materials distribution.',
        type: 'AWARENESS',
        status: 'UPCOMING',
        startDate: new Date('2025-11-25T10:00:00Z'),
        endDate: new Date('2025-11-25T16:00:00Z'),
        registrationDeadline: new Date('2025-11-20T23:59:59Z'),
        location: JSON.stringify({
          address: 'Central Market, KL',
          city: 'Kuala Lumpur',
          coordinates: { lat: 3.1440, lng: 101.6969 }
        }),
        sdg: JSON.stringify(['13', '4']),
        imageUrl: 'https://images.unsplash.com/photo-1569163139394-de446b5a5b2e?w=800&h=600&fit=crop',
        maxParticipants: 25,
        isPublic: true,
        organizerId: organizationUser.id,
        organizationId: organization.id,
        skills: ['Communication', 'Public Speaking', 'Education'],
        intensity: 1.5,
        verificationType: 'PHOTO',
        eventInstructions: 'Dress in our organization t-shirt (provided). Bring a positive attitude and willingness to engage with the public.',
        materialsNeeded: ['Flyers', 'Banners', 'T-shirts'],
        emergencyContact: {
          name: 'Juni Ahmad',
          phone: '+60 12-345-6789',
          email: 'juni@test.com'
        },
        requiresApproval: true,
        autoIssueCertificates: false
      },
      {
        title: 'Tree Planting Initiative',
        description: 'Join us in planting 100 native trees to restore local forest areas and combat climate change.',
        type: 'VOLUNTEERING',
        status: 'UPCOMING',
        startDate: new Date('2025-12-01T08:00:00Z'),
        endDate: new Date('2025-12-01T12:00:00Z'),
        registrationDeadline: new Date('2025-11-26T23:59:59Z'),
        location: JSON.stringify({
          address: 'Taman Tugu, KL',
          city: 'Kuala Lumpur',
          coordinates: { lat: 3.1500, lng: 101.7000 }
        }),
        sdg: JSON.stringify(['13', '15']),
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
        maxParticipants: 40,
        isPublic: true,
        organizerId: organizationUser.id,
        organizationId: organization.id,
        skills: ['Physical Work', 'Environmental Conservation', 'Teamwork'],
        intensity: 1.8,
        verificationType: 'GPS',
        eventInstructions: 'Wear long pants and closed-toe shoes. Bring water and snacks. We will provide all tools.',
        materialsNeeded: ['Shovels', 'Saplings', 'Mulch', 'Water'],
        emergencyContact: {
          name: 'Juni Ahmad',
          phone: '+60 12-345-6789',
          email: 'juni@test.com'
        },
        requiresApproval: false,
        autoIssueCertificates: true
      },
      {
        title: 'Environmental Education for Kids',
        description: 'Teach children about environmental conservation through fun activities and games.',
        type: 'WORKSHOP',
        status: 'UPCOMING',
        startDate: new Date('2025-12-05T09:00:00Z'),
        endDate: new Date('2025-12-05T15:00:00Z'),
        registrationDeadline: new Date('2025-11-30T23:59:59Z'),
        location: JSON.stringify({
          address: 'Elementary School, PJ',
          city: 'Petaling Jaya',
          coordinates: { lat: 3.1000, lng: 101.6500 }
        }),
        sdg: JSON.stringify(['4', '13', '15']),
        imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
        maxParticipants: 20,
        isPublic: true,
        organizerId: organizationUser.id,
        organizationId: organization.id,
        skills: ['Teaching', 'Childcare', 'Environmental Education'],
        intensity: 1.0,
        verificationType: 'ORGANIZER',
        eventInstructions: 'Experience with children preferred. We will provide all educational materials.',
        materialsNeeded: ['Educational games', 'Craft supplies', 'Snacks'],
        emergencyContact: {
          name: 'Juni Ahmad',
          phone: '+60 12-345-6789',
          email: 'juni@test.com'
        },
        requiresApproval: true,
        autoIssueCertificates: true
      }
    ];

    // Create all events
    let createdEvents = 0;
    for (const eventData of events) {
      const event = await prisma.event.create({
        data: eventData
      });
      createdEvents++;
      console.log(`✅ Created event: ${event.title}`);
    }

    // Create opportunities
    const opportunities = [
      {
        title: 'Beach Cleanup Coordinator',
        description: 'Lead and coordinate weekly beach cleanup initiatives. Manage volunteer teams, organize equipment, and track environmental impact data. This is a 6-month position with potential for extension.',
        requirements: ['2+ years environmental experience', 'Leadership skills', 'Available weekends', 'Valid driver\'s license'],
        spots: 2,
        deadline: new Date('2025-12-01T23:59:59Z'),
        location: 'Langkawi, Malaysia',
        isRemote: false,
        skills: ['Environmental Management', 'Team Leadership', 'Data Analysis', 'Communication'],
        sdg: '14',
        organizationId: organization.id
      },
      {
        title: 'Social Media Manager',
        description: 'Manage social media presence for our environmental initiatives. Create engaging content, run campaigns, and grow our online community. Remote position with flexible hours.',
        requirements: ['Social media experience', 'Content creation skills', 'Available 20 hours/week', 'Portfolio required'],
        spots: 1,
        deadline: new Date('2025-11-25T23:59:59Z'),
        location: 'Remote',
        isRemote: true,
        skills: ['Social Media Marketing', 'Content Creation', 'Graphic Design', 'Analytics'],
        sdg: '13',
        organizationId: organization.id
      },
      {
        title: 'Research Assistant - Climate Data',
        description: 'Assist in climate research projects, analyze environmental data, and contribute to scientific publications. Work with our research team on cutting-edge environmental studies.',
        requirements: ['Bachelor\'s in Environmental Science', 'Data analysis experience', 'Research methodology knowledge', 'Available 30 hours/week'],
        spots: 3,
        deadline: new Date('2025-12-15T23:59:59Z'),
        location: 'Kuala Lumpur, Malaysia',
        isRemote: false,
        skills: ['Data Analysis', 'Research', 'Climate Science', 'Statistics'],
        sdg: '13',
        organizationId: organization.id
      },
      {
        title: 'Community Outreach Coordinator',
        description: 'Build relationships with local communities, organize educational workshops, and promote environmental awareness. This role involves both office work and field visits.',
        requirements: ['Community engagement experience', 'Public speaking skills', 'Bilingual (English/Malay)', 'Flexible schedule'],
        spots: 2,
        deadline: new Date('2025-11-30T23:59:59Z'),
        location: 'Petaling Jaya, Malaysia',
        isRemote: false,
        skills: ['Community Engagement', 'Public Speaking', 'Event Planning', 'Education'],
        sdg: '4',
        organizationId: organization.id
      },
      {
        title: 'Grant Writing Specialist',
        description: 'Research and write grant proposals to secure funding for environmental projects. Work with program managers to develop compelling funding applications.',
        requirements: ['Grant writing experience', 'Research skills', 'Writing portfolio', 'Available 15 hours/week'],
        spots: 1,
        deadline: new Date('2025-12-10T23:59:59Z'),
        location: 'Remote',
        isRemote: true,
        skills: ['Grant Writing', 'Research', 'Technical Writing', 'Project Management'],
        sdg: '17',
        organizationId: organization.id
      }
    ];

    // Create all opportunities
    let createdOpportunities = 0;
    for (const opportunityData of opportunities) {
      const opportunity = await prisma.opportunity.create({
        data: opportunityData
      });
      createdOpportunities++;
      console.log(`✅ Created opportunity: ${opportunity.title}`);
    }

    console.log(`\n🎉 Database restored successfully!`);
    console.log(`📊 Summary:`);
    console.log(`- Users: 2 (friedman@test.com, juni@test.com)`);
    console.log(`- Organizations: 1 (Green Impact Malaysia)`);
    console.log(`- Events: ${createdEvents}`);
    console.log(`- Opportunities: ${createdOpportunities}`);

  } catch (error) {
    console.error('❌ Error restoring database:', error);
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
