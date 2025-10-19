import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

async function main() {
  try {
    // Create Jimmy University organization
    const organization = await prisma.organization.create({
      data: {
        name: 'Jimmy University',
        description: 'A leading educational institution focused on environmental research and community impact.',
        website: 'https://jimmyuniversity.edu',
        email: 'contact@jimmyuniversity.edu',
        phone: '+60 3-1234-5678',
        address: '123 University Road, Kuala Lumpur, Malaysia',
        city: 'Kuala Lumpur',
        country: 'Malaysia',
        industry: 'EDUCATION',
        companySize: 'LARGE',
        subscriptionTier: 'REGISTERED',
        logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop&crop=center',
        type: 'SCHOOL'
      }
    });

    console.log(`✅ Created organization: ${organization.name}`);
    console.log(`Organization ID: ${organization.id}`);

    // Create a user for the organization owner
    const owner = await prisma.user.create({
      data: {
        name: 'Dr. Jimmy Chen',
        email: 'jimmy@jimmyuniversity.edu',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        bio: 'Vice Chancellor of Jimmy University, passionate about environmental education and community impact.',
        city: 'Kuala Lumpur',
        country: 'Malaysia',
        isVerified: true,
        volunteerProfile: {
          interests: ['Environmental Conservation', 'Education', 'Community Development'],
          skills: ['Leadership', 'Research', 'Public Speaking', 'Strategic Planning'],
          availability: 'FULL_TIME',
          experience: 'EXPERT',
          motivation: 'To create positive change through education and research.',
          goals: ['Expand university impact', 'Develop new programs', 'Build partnerships']
        }
      }
    });

    console.log(`✅ Created owner: ${owner.name}`);

    // Create organization membership
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: owner.id,
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: new Date()
      }
    });

    console.log(`✅ Created organization membership`);

    // Clear existing opportunities
    await prisma.application.deleteMany();
    await prisma.opportunity.deleteMany();
    console.log('🗑️  Cleared existing opportunities');

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
    let createdCount = 0;
    for (const opportunityData of opportunities) {
      const opportunity = await prisma.opportunity.create({
        data: opportunityData
      });
      createdCount++;
      console.log(`✅ Created opportunity: ${opportunity.title}`);
    }

    console.log(`\n🎉 Successfully created ${createdCount} opportunities for ${organization.name}!`);

  } catch (error) {
    console.error('❌ Error seeding opportunities:', error);
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
