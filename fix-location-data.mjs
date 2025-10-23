import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing location data inconsistencies...');

  try {
    // Define correct city-country mappings
    const correctMappings = {
      'Singapore': 'Singapore',
      'Sydney': 'Australia',
      'Melbourne': 'Australia',
      'San Francisco': 'United States',
      'New York': 'United States',
      'London': 'United Kingdom',
      'Toronto': 'Canada',
      'Berlin': 'Germany',
      'Tokyo': 'Japan',
      'Mumbai': 'India',
      'São Paulo': 'Brazil',
      'Kuala Lumpur': 'Malaysia',
      'Bangkok': 'Thailand',
      'Seoul': 'South Korea',
      'Hong Kong': 'Hong Kong'
    };

    // Get all users with incorrect location data
    const users = await prisma.user.findMany({
      where: {
        city: {
          in: Object.keys(correctMappings)
        }
      },
      select: {
        id: true,
        city: true,
        country: true
      }
    });

    console.log(`Found ${users.length} users to check`);

    let fixedCount = 0;

    for (const user of users) {
      const correctCountry = correctMappings[user.city];
      
      if (correctCountry && user.country !== correctCountry) {
        console.log(`Fixing user ${user.id}: ${user.city}, ${user.country} -> ${user.city}, ${correctCountry}`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { country: correctCountry }
        });
        
        fixedCount++;
      }
    }

    console.log(`✅ Fixed ${fixedCount} users with incorrect location data`);

    // Also fix any organizations with similar issues
    const orgs = await prisma.organization.findMany({
      where: {
        city: {
          in: Object.keys(correctMappings)
        }
      },
      select: {
        id: true,
        city: true,
        country: true
      }
    });

    console.log(`Found ${orgs.length} organizations to check`);

    let fixedOrgCount = 0;

    for (const org of orgs) {
      const correctCountry = correctMappings[org.city];
      
      if (correctCountry && org.country !== correctCountry) {
        console.log(`Fixing organization ${org.id}: ${org.city}, ${org.country} -> ${org.city}, ${correctCountry}`);
        
        await prisma.organization.update({
          where: { id: org.id },
          data: { country: correctCountry }
        });
        
        fixedOrgCount++;
      }
    }

    console.log(`✅ Fixed ${fixedOrgCount} organizations with incorrect location data`);
    console.log(`🎉 Total fixes: ${fixedCount + fixedOrgCount}`);

  } catch (error) {
    console.error('Error fixing location data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
