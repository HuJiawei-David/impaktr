import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

async function main() {
  try {
    // Find Jimmy University organization
    const organization = await prisma.organization.findFirst({
      where: { name: 'Jimmy University' }
    });

    if (!organization) {
      console.error('❌ Jimmy University organization not found');
      return;
    }

    console.log(`✅ Found organization: ${organization.name}`);
    console.log(`Organization ID: ${organization.id}`);

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
