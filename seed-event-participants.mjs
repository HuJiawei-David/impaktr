import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed event participants...');

  try {
    // Get all individual users (not organizations)
    const individuals = await prisma.user.findMany({
      where: {
        userType: 'INDIVIDUAL'
      },
      include: {
        volunteerProfile: true
      },
      take: 20
    });

    console.log(`Found ${individuals.length} individual users`);

    // Get all active events
    const events = await prisma.event.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'UPCOMING']
        }
      },
      take: 10
    });

    console.log(`Found ${events.length} events`);

    if (events.length === 0) {
      console.log('No events found. Please seed events first.');
      return;
    }

    // Always create sample users for better seed data
    console.log('Creating sample individual users...');
    
    // Delete existing sample users to avoid duplicates
    await prisma.user.deleteMany({
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
    
    // Create sample individual users
    const sampleUsers = [
        {
          email: 'sarah.chen@example.com',
          name: 'Sarah Chen',
          firstName: 'Sarah',
          lastName: 'Chen',
          userType: 'INDIVIDUAL',
          emailVerified: new Date(),
          impactScore: 1250
        },
        {
          email: 'marcus.wilson@example.com',
          name: 'Marcus Wilson',
          firstName: 'Marcus',
          lastName: 'Wilson',
          userType: 'INDIVIDUAL',
          emailVerified: new Date(),
          impactScore: 980
        },
        {
          email: 'aisha.patel@example.com',
          name: 'Aisha Patel',
          firstName: 'Aisha',
          lastName: 'Patel',
          userType: 'INDIVIDUAL',
          emailVerified: new Date(),
          impactScore: 1520,
          // totalHoursVolunteered: 150,
          // currentRank: 'Impact Leader'
        },
        {
          email: 'carlos.rodriguez@example.com',
          name: 'Carlos Rodriguez',
          firstName: 'Carlos',
          lastName: 'Rodriguez',
          userType: 'INDIVIDUAL',
          emailVerified: new Date(),
          impactScore: 760,
          // totalHoursVolunteered: 60,
          // currentRank: 'Rising Star'
        },
        {
          email: 'emma.johnson@example.com',
          name: 'Emma Johnson',
          firstName: 'Emma',
          lastName: 'Johnson',
          userType: 'INDIVIDUAL',
          emailVerified: new Date(),
          impactScore: 1100,
          // totalHoursVolunteered: 95,
          // currentRank: 'Impact Champion'
        },
        {
          email: 'david.kim@example.com',
          name: 'David Kim',
          firstName: 'David',
          lastName: 'Kim',
          userType: 'INDIVIDUAL',
          emailVerified: new Date(),
          impactScore: 890,
          // totalHoursVolunteered: 75,
          // currentRank: 'Change Maker'
        },
        {
          email: 'olivia.martinez@example.com',
          name: 'Olivia Martinez',
          firstName: 'Olivia',
          lastName: 'Martinez',
          userType: 'INDIVIDUAL',
          emailVerified: new Date(),
          impactScore: 1340,
          // totalHoursVolunteered: 110,
          // currentRank: 'Impact Champion'
        },
        {
          email: 'james.thompson@example.com',
          name: 'James Thompson',
          firstName: 'James',
          lastName: 'Thompson',
          userType: 'INDIVIDUAL',
          emailVerified: new Date(),
          impactScore: 650,
          // totalHoursVolunteered: 45,
          // currentRank: 'Community Helper'
        }
      ];

      for (const userData of sampleUsers) {
        const user = await prisma.user.create({
          data: {
            ...userData,
            volunteerProfile: {
              create: {
                bio: `Passionate about making a difference in the community. ${userData.firstName} believes in the power of collective action.`,
                skills: getRandomSkills(),
                interests: getRandomInterests(),
                availability: 'WEEKENDS',
                isPublic: true
              }
            },
            occupation: getRandomOccupation(),
            city: getRandomCity(),
            country: getRandomCountry()
          },
          include: {
            volunteerProfile: true
          }
        });
        
        individuals.push(user);
        console.log(`Created user: ${user.name}`);
      }
    
    // Clear individuals array and use only the newly created sample users
    individuals.length = 0;
    const newIndividuals = await prisma.user.findMany({
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
      },
      include: {
        volunteerProfile: true
      }
    });
    
    individuals.push(...newIndividuals);
    console.log(`Using ${individuals.length} sample users for seeding`);

    // Delete existing participations to avoid duplicates
    await prisma.participation.deleteMany({
      where: {
        userId: {
          in: individuals.map(i => i.id)
        }
      }
    });
    console.log('Cleared existing participations for sample users');

    // Add participants to events
    let participantCount = 0;
    
    for (const event of events) {
      // Randomly select 3-8 participants per event
      const numParticipants = Math.floor(Math.random() * 6) + 3;
      const shuffled = [...individuals].sort(() => 0.5 - Math.random());
      const selectedParticipants = shuffled.slice(0, numParticipants);

      for (const participant of selectedParticipants) {
        try {
          // Check if participation already exists
          const existing = await prisma.participation.findFirst({
            where: {
              eventId: event.id,
              userId: participant.id
            }
          });

          if (existing) {
            console.log(`Participation already exists for ${participant.name} in event ${event.title}`);
            continue;
          }

          // Create participation with random status
          const statuses = ['VERIFIED', 'VERIFIED', 'VERIFIED', 'PENDING', 'CONFIRMED']; // More verified than pending
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const hours = Math.floor(Math.random() * 8) + 2;
          const impactPoints = status === 'VERIFIED' ? hours * 10 : 0;
          
          await prisma.participation.create({
            data: {
              eventId: event.id,
              userId: participant.id,
              status,
              hours: status === 'VERIFIED' ? hours : null,
              impactPoints,
              verifiedAt: status === 'VERIFIED' ? new Date() : null,
              feedback: status === 'VERIFIED' ? 'Great contribution! Made a real difference.' : null
            }
          });

          participantCount++;
          console.log(`Added ${participant.name} to ${event.title} (${status})`);
        } catch (error) {
          console.error(`Error adding ${participant.name} to ${event.title}:`, error);
        }
      }
    }

    console.log(`\n✅ Successfully seeded ${participantCount} event participants!`);
    console.log(`📊 ${individuals.length} individuals across ${events.length} events`);
  } catch (error) {
    console.error('Error seeding event participants:', error);
    throw error;
  }
}

// Helper functions
function getRandomOccupation() {
  const occupations = [
    'Software Engineer',
    'Teacher',
    'Marketing Manager',
    'Data Analyst',
    'Designer',
    'Project Manager',
    'Student',
    'Consultant',
    'Nurse',
    'Sales Representative',
    'Product Manager',
    'Researcher'
  ];
  return occupations[Math.floor(Math.random() * occupations.length)];
}

function getRandomCity() {
  const cities = [
    'San Francisco',
    'New York',
    'London',
    'Singapore',
    'Toronto',
    'Sydney',
    'Berlin',
    'Tokyo',
    'Mumbai',
    'São Paulo'
  ];
  return cities[Math.floor(Math.random() * cities.length)];
}

function getRandomCountry() {
  const countries = [
    'United States',
    'United Kingdom',
    'Singapore',
    'Canada',
    'Australia',
    'Germany',
    'Japan',
    'India',
    'Brazil'
  ];
  return countries[Math.floor(Math.random() * countries.length)];
}

function getRandomSkills() {
  const allSkills = [
    'Teaching',
    'Project Management',
    'Communication',
    'Fundraising',
    'Event Planning',
    'Social Media',
    'Writing',
    'Photography',
    'Data Analysis',
    'Public Speaking'
  ];
  const numSkills = Math.floor(Math.random() * 4) + 2;
  return allSkills.sort(() => 0.5 - Math.random()).slice(0, numSkills);
}

function getRandomInterests() {
  const allInterests = [
    'Environment',
    'Education',
    'Healthcare',
    'Community Development',
    'Animal Welfare',
    'Arts & Culture',
    'Sports',
    'Technology'
  ];
  const numInterests = Math.floor(Math.random() * 4) + 2;
  return allInterests.sort(() => 0.5 - Math.random()).slice(0, numInterests);
}

function getRandomCauses() {
  const allCauses = [
    'Climate Action',
    'Quality Education',
    'Zero Hunger',
    'Good Health',
    'Clean Water',
    'Sustainable Cities',
    'Reduced Inequalities'
  ];
  const numCauses = Math.floor(Math.random() * 3) + 2;
  return allCauses.sort(() => 0.5 - Math.random()).slice(0, numCauses);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

