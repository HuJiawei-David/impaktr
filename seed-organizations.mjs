import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function seedOrganizations() {
  console.log('🌱 Seeding organizations...');

  const organizations = [
    {
      name: 'Green Earth Foundation',
      description: 'Dedicated to environmental conservation and sustainable practices. We work on reforestation, ocean cleanup, and climate action initiatives across Southeast Asia.',
      industry: 'Environment & Sustainability',
      type: 'NGO',
      subscriptionTier: 'PROFESSIONAL',
      tier: 'CSR_LEADER',
      esgScore: 15420,
      averageImpactScore: 850,
      volunteerHours: 12500,
      participationRate: 78.5,
      employeeCount: 45,
      companySize: '11-50',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
      website: 'https://greenearthfoundation.org',
      email: 'contact@greenearthfoundation.org',
      phone: '+60 3-1234-5678',
      eventCount: 24,
      logo: 'https://images.unsplash.com/photo-1569163139394-de44662a0d2e?w=200&h=200&fit=crop&crop=center'
    },
    {
      name: "Children's Hope Alliance",
      description: 'Supporting children in need through education and healthcare programs. We focus on providing quality education, nutrition, and medical care to underprivileged children.',
      industry: 'Children & Youth Development',
      type: 'NGO',
      subscriptionTier: 'GROWTH',
      tier: 'CONTRIBUTOR',
      esgScore: 12850,
      averageImpactScore: 720,
      volunteerHours: 8900,
      participationRate: 72.3,
      employeeCount: 32,
      companySize: '11-50',
      city: 'Singapore',
      country: 'Singapore',
      website: 'https://childrenshope.sg',
      email: 'info@childrenshope.sg',
      phone: '+65 6234-5678',
      eventCount: 18,
      logo: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=200&h=200&fit=crop&crop=center'
    },
    {
      name: 'Health First Initiative',
      description: 'Improving healthcare access in underserved communities. Our mission is to provide free medical checkups, health education, and essential medicines to those in need.',
      industry: 'Healthcare & Medical Services',
      type: 'NGO',
      subscriptionTier: 'PROFESSIONAL',
      tier: 'CSR_LEADER',
      esgScore: 18750,
      averageImpactScore: 950,
      volunteerHours: 15600,
      participationRate: 82.1,
      employeeCount: 68,
      companySize: '51-100',
      city: 'Bangkok',
      country: 'Thailand',
      website: 'https://healthfirst.th',
      email: 'contact@healthfirst.th',
      phone: '+66 2-345-6789',
      eventCount: 31,
      logo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=200&fit=crop&crop=center'
    },
    {
      name: 'Education for All',
      description: 'Providing quality education opportunities for all children regardless of their background. We build schools, train teachers, and provide scholarships to deserving students.',
      industry: 'Education & Learning',
      type: 'NGO',
      subscriptionTier: 'GROWTH',
      tier: 'CONTRIBUTOR',
      esgScore: 14200,
      averageImpactScore: 780,
      volunteerHours: 10200,
      participationRate: 75.8,
      employeeCount: 42,
      companySize: '11-50',
      city: 'Jakarta',
      country: 'Indonesia',
      website: 'https://educationforall.id',
      email: 'info@educationforall.id',
      phone: '+62 21-3456-7890',
      eventCount: 21,
      logo: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop&crop=center'
    },
    {
      name: 'Ocean Cleanup Project',
      description: 'Cleaning our oceans and protecting marine life through beach cleanups, marine conservation, and ocean plastic removal initiatives.',
      industry: 'Environment & Marine Conservation',
      type: 'NGO',
      subscriptionTier: 'REGISTERED',
      tier: 'REGISTERED',
      esgScore: 9650,
      averageImpactScore: 620,
      volunteerHours: 6800,
      participationRate: 68.4,
      employeeCount: 25,
      companySize: '11-50',
      city: 'Manila',
      country: 'Philippines',
      website: 'https://oceancleanup.ph',
      email: 'contact@oceancleanup.ph',
      phone: '+63 2-4567-8901',
      eventCount: 15,
      logo: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&h=200&fit=crop&crop=center'
    },
    {
      name: 'Tech for Good',
      description: 'Using technology to solve social challenges and empower communities. We provide digital literacy training, coding bootcamps, and tech solutions for nonprofits.',
      industry: 'Education & Technology',
      type: 'COMPANY',
      subscriptionTier: 'ENTERPRISE',
      tier: 'GLOBAL_IMPACT_LEADER',
      esgScore: 22100,
      averageImpactScore: 1150,
      volunteerHours: 18900,
      participationRate: 88.7,
      employeeCount: 125,
      companySize: '101-500',
      city: 'Ho Chi Minh City',
      country: 'Vietnam',
      website: 'https://techforgood.vn',
      email: 'hello@techforgood.vn',
      phone: '+84 28-5678-9012',
      eventCount: 42,
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop&crop=center'
    }
  ];

  for (const org of organizations) {
    try {
      const created = await prisma.organization.create({
        data: org
      });
      console.log(`✅ Created organization: ${created.name}`);
    } catch (error) {
      console.error(`❌ Error creating ${org.name}:`, error.message);
    }
  }

  console.log('✨ Organization seeding completed!');
}

seedOrganizations()
  .catch((e) => {
    console.error('Error seeding organizations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

