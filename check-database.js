// Script to check database connection and list users
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Get all users
    console.log('📊 Fetching all users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        role: true,
        createdAt: true,
        password: true, // Just checking if it exists
      },
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!\n');
      console.log('💡 Your database is empty. You need to:');
      console.log('   1. Ask your friend to export their database data');
      console.log('   2. Or run: node add-test-user.js to create org@test.com');
    } else {
      console.log(`\n📋 Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Type: ${user.userType || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Has Password: ${user.password ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log('');
      });

      // Check for the specific test user
      const testUser = users.find(u => u.email === 'org@test.com');
      if (testUser) {
        console.log('✅ Test user (org@test.com) EXISTS in your database');
        if (!testUser.password) {
          console.log('⚠️  WARNING: Test user exists but has NO PASSWORD set!');
          console.log('   Run: node add-test-user.js to set the password');
        }
      } else {
        console.log('❌ Test user (org@test.com) NOT FOUND in your database');
        console.log('   Run: node add-test-user.js to create it');
      }
    }

    // Get database info
    console.log('\n📊 Database Statistics:');
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    const eventCount = await prisma.event.count();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Organizations: ${orgCount}`);
    console.log(`   Events: ${eventCount}`);

  } catch (error) {
    console.error('\n❌ Database Error:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Cannot connect to database. Possible issues:');
      console.error('   1. Database is not running');
      console.error('   2. DATABASE_URL in .env is incorrect');
      console.error('   3. Database credentials are wrong');
      console.error('\n   Check your .env file for DATABASE_URL');
    } else if (error.code === 'P2021') {
      console.error('\n💡 Table does not exist. Run:');
      console.error('   npm run db:push');
      console.error('   OR');
      console.error('   npm run db:migrate');
    } else {
      console.error('\n   Full error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

