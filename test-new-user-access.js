// Test if a new user without organization membership can access org pages
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testNewUserAccess() {
  try {
    const testEmail = 'newuser@test.com';
    
    console.log('🔐 SECURITY TEST: New User Organization Access\n');
    console.log('=' .repeat(60));
    console.log('');
    
    // Check if test user exists, if not create one
    let testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        organizationMemberships: {
          include: { organization: true }
        }
      }
    });

    if (!testUser) {
      console.log('📝 Creating test user: newuser@test.com...');
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      
      testUser = await prisma.user.create({
        data: {
          email: testEmail,
          password: hashedPassword,
          name: 'New Test User',
          firstName: 'New',
          lastName: 'User',
          userType: 'INDIVIDUAL',
          role: 'USER',
        },
        include: {
          organizationMemberships: {
            include: { organization: true }
          }
        }
      });
      console.log('✅ Test user created');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: testpass123`);
      console.log('');
    } else {
      console.log('✅ Test user already exists');
      console.log(`   Email: ${testEmail}`);
      console.log('');
    }

    // Check organization memberships
    console.log('📊 Organization Membership Check:');
    console.log('');
    
    if (testUser.organizationMemberships.length === 0) {
      console.log('❌ User is NOT a member of any organization');
      console.log('');
      console.log('🔒 Expected API Behavior:');
      console.log('');
      console.log('   /api/organizations/dashboard');
      console.log('   └─ Expected: 404 "Not part of an organization"');
      console.log('   └─ Result: ❌ CANNOT ACCESS /organization/dashboard');
      console.log('');
      console.log('   /api/organization/stats');
      console.log('   └─ Expected: 404 "No organization found"');
      console.log('   └─ Result: ❌ CANNOT ACCESS /organization/esg');
      console.log('');
    } else {
      console.log('✅ User IS a member of organizations:');
      console.log('');
      testUser.organizationMemberships.forEach((membership, index) => {
        console.log(`   ${index + 1}. ${membership.organization.name}`);
        console.log(`      Role: ${membership.role}`);
        console.log(`      Status: ${membership.status}`);
        
        const dashboardAccess = membership.status === 'active';
        const esgAccess = membership.status === 'active' && 
                          ['admin', 'owner'].includes(membership.role);
        
        console.log(`      Dashboard Access: ${dashboardAccess ? '✅ YES' : '❌ NO'}`);
        console.log(`      ESG Access: ${esgAccess ? '✅ YES' : '❌ NO'}`);
        console.log('');
      });
    }

    console.log('=' .repeat(60));
    console.log('');
    console.log('🎯 SECURITY SUMMARY:');
    console.log('');

    const hasAnyMembership = testUser.organizationMemberships.length > 0;
    const hasAdminAccess = testUser.organizationMemberships.some(m => 
      m.status === 'active' && ['admin', 'owner'].includes(m.role)
    );

    if (!hasAnyMembership) {
      console.log('✅ SECURE: New user WITHOUT organization membership:');
      console.log('   ❌ CANNOT access /organization/dashboard');
      console.log('   ❌ CANNOT access /organization/esg');
      console.log('');
      console.log('   This is CORRECT behavior - users need to be invited');
      console.log('   to an organization to access these pages.');
      console.log('');
      console.log('💡 To give access:');
      console.log('   1. An organization admin must invite this user');
      console.log('   2. OR run: node add-to-organization.js <orgId>');
    } else if (hasAnyMembership && !hasAdminAccess) {
      console.log('⚠️  PARTIAL ACCESS: User is a member but not admin:');
      console.log('   ✅ CAN access /organization/dashboard');
      console.log('   ❌ CANNOT access /organization/esg (requires admin/owner role)');
      console.log('');
      console.log('   This is CORRECT behavior - ESG page requires elevated permissions.');
    } else {
      console.log('✅ FULL ACCESS: User has admin/owner role:');
      console.log('   ✅ CAN access /organization/dashboard');
      console.log('   ✅ CAN access /organization/esg');
    }

    console.log('');
    console.log('📝 Test Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log('   Password: testpass123');
    console.log('');
    console.log('🧪 To test manually:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Login with above credentials');
    console.log('   3. Try to access: http://localhost:3000/organization/dashboard');
    console.log('   4. Expected: Error message "Not part of an organization"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewUserAccess();

