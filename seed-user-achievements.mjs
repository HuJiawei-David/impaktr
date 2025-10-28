import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUserAchievements() {
  try {
    console.log('Starting to seed user achievements...');

    // Get some real users
    const users = await prisma.user.findMany({
      where: {
        userType: 'INDIVIDUAL'
      },
      take: 10
    });

    if (users.length === 0) {
      console.log('No individual users found. Please create some users first.');
      return;
    }

    console.log(`Found ${users.length} individual users`);

    // Achievement types
    const achievementTypes = [
      {
        type: 'badge_earned',
        title: 'SDG Badge Earned',
        descriptions: [
          'Earned Climate Guardian badge by completing 25 climate action activities!',
          'Achieved Education Champion badge with 50+ hours in education initiatives!',
          'Unlocked Health Advocate badge through healthcare volunteering!',
          'Earned Community Builder badge by organizing 10+ local events!',
          'Achieved Zero Hunger Supporter badge with food bank activities!'
        ],
        points: 150
      },
      {
        type: 'milestone_reached',
        title: 'Volunteer Milestone',
        descriptions: [
          'Reached 100 volunteer hours milestone!',
          'Completed 50 volunteer activities!',
          'Achieved 200 hours of community service!',
          'Reached 75 verified volunteer hours!',
          'Completed 30 days of continuous volunteering!'
        ],
        points: 200
      },
      {
        type: 'certificate_earned',
        title: 'Certificate Achievement',
        descriptions: [
          'Completed Digital Literacy Instructor certification program',
          'Earned Environmental Conservation Certificate',
          'Achieved Youth Mentorship Certification',
          'Completed Community Leadership Training',
          'Earned First Aid and Emergency Response Certificate'
        ],
        points: 100
      },
      {
        type: 'event_completed',
        title: 'Event Participation',
        descriptions: [
          'Successfully completed Beach Cleanup event!',
          'Participated in Community Food Drive',
          'Completed Tree Planting Initiative',
          'Finished Youth Mentorship Workshop',
          'Participated in Health Awareness Campaign'
        ],
        points: 50
      },
      {
        type: 'skill_unlocked',
        title: 'New Skill Acquired',
        descriptions: [
          'Unlocked Project Management skill',
          'Acquired Community Organizing expertise',
          'Mastered Environmental Assessment skills',
          'Learned Youth Engagement techniques',
          'Developed Public Speaking abilities'
        ],
        points: 75
      }
    ];

    const achievements = [];
    const now = new Date();

    // Create achievements for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const numAchievements = Math.floor(Math.random() * 3) + 2; // 2-4 achievements per user

      for (let j = 0; j < numAchievements; j++) {
        const achievementType = achievementTypes[Math.floor(Math.random() * achievementTypes.length)];
        const description = achievementType.descriptions[Math.floor(Math.random() * achievementType.descriptions.length)];
        
        // Create timestamps spread over the last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const minutesAgo = Math.floor(Math.random() * 60);
        const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));

        achievements.push({
          userId: user.id,
          type: achievementType.type,
          title: achievementType.title,
          description: description,
          points: achievementType.points,
          createdAt: createdAt
        });
      }
    }

    // Sort by createdAt desc
    achievements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Create achievements in database
    for (const achievement of achievements) {
      await prisma.achievement.create({
        data: achievement
      });
    }

    console.log(`✅ Created ${achievements.length} user achievements`);
    console.log('Sample achievements:');
    console.log(achievements.slice(0, 5).map(a => ({
      user: users.find(u => u.id === a.userId)?.name || 'Unknown',
      type: a.type,
      title: a.title,
      createdAt: a.createdAt.toISOString()
    })));

  } catch (error) {
    console.error('Error seeding user achievements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUserAchievements();

