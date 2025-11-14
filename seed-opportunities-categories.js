const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed opportunities for different categories...');

  // Find or create a sample organization
  let organization = await prisma.organization.findFirst({
    where: { type: 'NON_PROFIT' }
  });

  if (!organization) {
    console.log('No organization found. Creating a sample organization...');
    organization = await prisma.organization.create({
      data: {
        name: 'Global Impact Foundation',
        email: 'contact@globalimpact.org',
        type: 'NON_PROFIT',
        description: 'A non-profit organization dedicated to creating positive social impact globally.',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        sdgFocusAreas: [1, 2, 3, 4, 10],
        tier: 'COMMUNITY_BUILDER',
      }
    });
    console.log('Sample organization created:', organization.name);
  }

  // Research & Lab Opportunities
  const researchOpportunities = [
    {
      title: 'Climate Research Assistant',
      description: 'Join our climate research team to study the impacts of climate change on coastal ecosystems. You will assist in data collection, laboratory analysis, and research documentation. This position offers hands-on experience in environmental science research.',
      requirements: ['Background in Environmental Science or Biology', 'Strong analytical skills', 'Experience with data analysis tools'],
      spots: 3,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      location: 'Boston, MA, United States',
      isRemote: false,
      skills: ['Research', 'Data Analysis', 'Laboratory Work', 'Environmental Science'],
      sdg: '13',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Medical Laboratory Research Assistant',
      description: 'Support groundbreaking medical research focused on infectious disease prevention. Conduct laboratory experiments, maintain research equipment, and help analyze test results. Perfect for students pursuing careers in medical research.',
      requirements: ['Bachelor\'s degree in Biology or related field', 'Laboratory experience preferred', 'Attention to detail'],
      spots: 2,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      location: 'Philadelphia, PA, United States',
      isRemote: false,
      skills: ['Laboratory Techniques', 'Research Methods', 'Medical Knowledge', 'Data Recording'],
      sdg: '3',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'AI Research Lab Intern',
      description: 'Work alongside PhD researchers on artificial intelligence projects focused on solving social good problems. You\'ll contribute to machine learning experiments, help develop algorithms, and participate in research publications.',
      requirements: ['Computer Science or related major', 'Python programming experience', 'Understanding of ML fundamentals'],
      spots: 4,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      location: 'Remote',
      isRemote: true,
      skills: ['Python', 'Machine Learning', 'Research', 'Problem Solving'],
      sdg: '9',
      status: 'OPEN',
      organizationId: organization.id
    }
  ];

  // Scholarship Opportunities
  const scholarshipOpportunities = [
    {
      title: 'Women in STEM Scholarship',
      description: 'Full scholarship program for women pursuing degrees in Science, Technology, Engineering, or Mathematics. This $10,000 scholarship covers tuition, books, and includes mentorship opportunities with industry leaders.',
      requirements: ['Female identifying student', 'Enrolled in STEM program', 'Minimum 3.5 GPA', 'Essay submission required'],
      spots: 10,
      deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      location: 'United States',
      isRemote: true,
      skills: ['Academic Excellence', 'STEM Field', 'Leadership'],
      sdg: '5',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Sustainable Development Fellowship',
      description: 'Graduate fellowship providing $25,000 for students working on sustainable development projects. Recipients receive funding, mentorship, and networking opportunities with sustainability professionals worldwide.',
      requirements: ['Graduate student status', 'Focus on sustainability', 'Research proposal', 'Two letters of recommendation'],
      spots: 5,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      location: 'Global',
      isRemote: true,
      skills: ['Sustainability', 'Research', 'Project Management', 'Environmental Studies'],
      sdg: '12',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Community Health Scholarship Grant',
      description: 'Financial aid for students pursuing careers in community health and public health. This scholarship covers up to $15,000 in educational expenses and includes summer internship placement.',
      requirements: ['Public Health or related major', 'Community service experience', 'Financial need demonstrated', 'Application essay'],
      spots: 8,
      deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      location: 'North America',
      isRemote: true,
      skills: ['Public Health', 'Community Engagement', 'Healthcare', 'Communication'],
      sdg: '3',
      status: 'OPEN',
      organizationId: organization.id
    }
  ];

  // Sponsorship Opportunities
  const sponsorshipOpportunities = [
    {
      title: 'Youth Education Program Sponsorship',
      description: 'Sponsor a classroom in an underserved community! Your sponsorship provides educational materials, technology access, and after-school programs for 30 students. Sponsors receive regular updates and can visit the classroom.',
      requirements: ['Annual commitment of $5,000', 'Background check required', 'Interest in education'],
      spots: 15,
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      location: 'Various US Cities',
      isRemote: false,
      skills: ['Education Support', 'Mentorship', 'Community Engagement'],
      sdg: '4',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Event Sponsorship - Annual Charity Gala',
      description: 'Become a sponsor for our annual charity gala supporting clean water initiatives. Sponsorship packages include prominent logo placement, speaking opportunities, and VIP tickets. All proceeds fund water infrastructure projects in developing nations.',
      requirements: ['Sponsorship contribution ($10,000 - $50,000)', 'Alignment with mission', 'Marketing materials provided'],
      spots: 8,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      location: 'New York, NY, United States',
      isRemote: false,
      skills: ['Corporate Partnerships', 'Marketing', 'Networking'],
      sdg: '6',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Community Sports Program Sponsor',
      description: 'Sponsor youth sports programs in low-income neighborhoods. Your sponsorship covers equipment, coaching, and facility rentals for an entire season, impacting 100+ youth. Includes team naming rights and social media recognition.',
      requirements: ['$3,000 seasonal sponsorship', 'One volunteer day per season', 'Marketing agreement'],
      spots: 20,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      location: 'Los Angeles, CA, United States',
      isRemote: false,
      skills: ['Community Support', 'Youth Development', 'Sports Enthusiasm'],
      sdg: '3',
      status: 'OPEN',
      organizationId: organization.id
    }
  ];

  // Donation Opportunities
  const donationOpportunities = [
    {
      title: 'Monthly Food Bank Donation Drive',
      description: 'Regular donation opportunity to support our community food bank. We accept both monetary donations and non-perishable food items. Every $1 donated provides 3 meals to families in need. Monthly donors receive impact reports.',
      requirements: ['No minimum donation', 'Monthly commitment preferred', 'Tax receipt provided'],
      spots: 500,
      deadline: null,
      location: 'Chicago, IL, United States',
      isRemote: true,
      skills: ['Fundraising', 'Food Security Awareness', 'Community Support'],
      sdg: '2',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Emergency Relief Fund Contribution',
      description: 'Help us build an emergency relief fund for disaster response. Your contributions enable rapid deployment of aid during natural disasters, including food, water, shelter, and medical supplies. 100% of donations go directly to relief efforts.',
      requirements: ['One-time or recurring donation', 'All amounts welcome', 'Optional donor recognition'],
      spots: 1000,
      deadline: null,
      location: 'Global',
      isRemote: true,
      skills: ['Charitable Giving', 'Emergency Response Support', 'Humanitarian Aid'],
      sdg: '11',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Educational Technology Donation Campaign',
      description: 'Fundraising campaign to provide laptops and internet access to students without technology at home. Each $500 donation provides one complete setup. Join our mission to bridge the digital divide and ensure every student can participate in online learning.',
      requirements: ['Donation of any amount', 'Option to donate used devices', 'Participation in awareness campaign'],
      spots: 200,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      location: 'United States',
      isRemote: true,
      skills: ['Technology Access', 'Education Equity', 'Fundraising'],
      sdg: '4',
      status: 'OPEN',
      organizationId: organization.id
    }
  ];

  // Internship Opportunities
  const internshipOpportunities = [
    {
      title: 'Marketing & Communications Intern',
      description: 'Gain real-world marketing experience with our social impact organization. You\'ll create social media content, assist with email campaigns, and help develop marketing strategies. This paid internship offers flexible hours and professional development.',
      requirements: ['Currently enrolled in college', 'Interest in marketing/communications', 'Strong writing skills', 'Social media savvy'],
      spots: 2,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      location: 'Seattle, WA, United States',
      isRemote: true,
      skills: ['Marketing', 'Social Media', 'Content Creation', 'Communication'],
      sdg: '8',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Software Development Internship',
      description: 'Join our tech team building platforms for social good. Work on full-stack web development, contribute to open-source projects, and learn from experienced engineers. Paid position with potential for full-time conversion.',
      requirements: ['Computer Science student or bootcamp graduate', 'Experience with JavaScript/Python', 'Git knowledge', 'Portfolio of projects'],
      spots: 4,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      location: 'Austin, TX, United States',
      isRemote: true,
      skills: ['Web Development', 'JavaScript', 'Python', 'Problem Solving'],
      sdg: '9',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Environmental Policy Intern',
      description: 'Work with our policy team on environmental advocacy and legislative research. You\'ll analyze policy proposals, prepare briefing documents, and engage with policymakers. Excellent opportunity for students interested in environmental law or policy.',
      requirements: ['Junior or Senior in college', 'Interest in environmental policy', 'Research skills', 'Strong writing ability'],
      spots: 3,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      location: 'Washington, DC, United States',
      isRemote: false,
      skills: ['Policy Analysis', 'Research', 'Environmental Law', 'Writing'],
      sdg: '13',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Graphic Design Intern',
      description: 'Creative internship designing visual content for social impact campaigns. Create infographics, social media graphics, and marketing materials. Build your portfolio while making a difference. Stipend provided.',
      requirements: ['Proficiency in Adobe Creative Suite', 'Portfolio of design work', 'Currently enrolled in design program', 'Creative mindset'],
      spots: 2,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      location: 'Portland, OR, United States',
      isRemote: true,
      skills: ['Graphic Design', 'Adobe Creative Suite', 'Visual Communication', 'Creativity'],
      sdg: '8',
      status: 'OPEN',
      organizationId: organization.id
    },
    {
      title: 'Data Analytics Intern',
      description: 'Join our analytics team to measure social impact through data. You\'ll work with large datasets, create dashboards, and help generate insights that drive decision-making. Training provided in advanced analytics tools.',
      requirements: ['Statistics or Data Science background', 'Excel proficiency', 'SQL knowledge helpful', 'Strong analytical thinking'],
      spots: 3,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      location: 'Remote',
      isRemote: true,
      skills: ['Data Analysis', 'SQL', 'Statistics', 'Excel', 'Problem Solving'],
      sdg: '17',
      status: 'OPEN',
      organizationId: organization.id
    }
  ];

  // Combine all opportunities
  const allOpportunities = [
    ...researchOpportunities,
    ...scholarshipOpportunities,
    ...sponsorshipOpportunities,
    ...donationOpportunities,
    ...internshipOpportunities
  ];

  // Create opportunities
  let created = 0;
  for (const oppData of allOpportunities) {
    try {
      // Check if similar opportunity already exists
      const existing = await prisma.opportunity.findFirst({
        where: {
          title: oppData.title,
          organizationId: organization.id
        }
      });

      if (!existing) {
        await prisma.opportunity.create({
          data: oppData
        });
        console.log(`✓ Created: ${oppData.title}`);
        created++;
      } else {
        console.log(`○ Skipped (exists): ${oppData.title}`);
      }
    } catch (error) {
      console.error(`✗ Error creating ${oppData.title}:`, error.message);
    }
  }

  console.log(`\n✅ Seeding complete! Created ${created} new opportunities.`);
  console.log('\nSummary by category:');
  console.log(`- Research & Lab: ${researchOpportunities.length} opportunities`);
  console.log(`- Scholarship: ${scholarshipOpportunities.length} opportunities`);
  console.log(`- Sponsorship: ${sponsorshipOpportunities.length} opportunities`);
  console.log(`- Donation: ${donationOpportunities.length} opportunities`);
  console.log(`- Internship: ${internshipOpportunities.length} opportunities`);
  console.log(`\nTotal: ${allOpportunities.length} opportunities`);
}

main()
  .catch((e) => {
    console.error('Error seeding opportunities:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

