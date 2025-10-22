// Script to add test user to the database
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addTestUser() {
  try {
    console.log('🔍 Checking for existing user...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'org@test.com' }
    });

    if (existingUser) {
      console.log('✅ User org@test.com already exists with ID:', existingUser.id);
      console.log('   Name:', existingUser.name);
      console.log('   User Type:', existingUser.userType);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.update({
        where: { email: 'org@test.com' },
        data: { password: hashedPassword }
      });
      console.log('🔄 Password updated to: password123');
    } else {
      console.log('🆕 Creating new test user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Create the test user
      const user = await prisma.user.create({
        data: {
          email: 'org@test.com',
          password: hashedPassword,
          name: 'Test Organization',
          firstName: 'Test',
          lastName: 'Organization',
          userType: 'CORPORATE',
          role: 'USER',
          tier: 'HELPER',
          impactScore: 0,
          level: 1,
          streak: 0,
          longestStreak: 0,
          totalPoints: 0,
          xp: 0,
          isPublic: true,
          showEmail: false,
        }
      });

      console.log('✅ Test user created successfully!');
      console.log('   Email: org@test.com');
      console.log('   Password: password123');
      console.log('   User ID:', user.id);
      console.log('   User Type:', user.userType);
      
      // Auto-create organization and add user as admin
      console.log('🏢 Creating organization for user...');
      const organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          type: 'CORPORATE',
          email: 'org@test.com',
          tier: 'REGISTERED',
          subscriptionTier: 'REGISTERED',
          subscriptionStatus: 'active',
        }
      });
      
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'admin',
          status: 'active',
        }
      });
      
      console.log('✅ Organization created and user added as admin!');
      console.log('   Organization:', organization.name);
      console.log('   Can access /organization/dashboard: ✅');
      console.log('   Can access /organization/esg: ✅');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.error('   User with this email already exists');
    } else if (error.code === 'P1001') {
      console.error('   Cannot reach database. Make sure your DATABASE_URL is correct and database is running');
    } else {
      console.error('   Full error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

addTestUser();

