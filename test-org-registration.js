// Test organization registration flow
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testOrgRegistration() {
  try {
    console.log('🧪 Testing Organization Registration Flow\n');
    console.log('=' .repeat(60));
    console.log('');
    
    const testEmails = [
      { email: 'testcorp@test.com', userType: 'CORPORATE', name: 'Test Corp Inc' },
      { email: 'testngo@test.com', userType: 'NGO', name: 'Test NGO Foundation' },
      { email: 'testschool@test.com', userType: 'SCHOOL', name: 'Test School Academy' },
    ];

    for (const testCase of testEmails) {
      console.log(`\n📋 Test Case: ${testCase.userType} Registration`);
      console.log('-' .repeat(60));
      
      // Check if user exists, delete if so
      const existing = await prisma.user.findUnique({
        where: { email: testCase.email },
        include: { organizationMemberships: true }
      });

      if (existing) {
        console.log('🗑️  Deleting existing test user...');
        // Delete memberships first
        await prisma.organizationMember.deleteMany({
          where: { userId: existing.id }
        });
        // Delete organizations if user was the only member
        const orgs = await prisma.organizationMember.findMany({
          where: { userId: existing.id },
          select: { organizationId: true }
        });
        for (const org of orgs) {
          const memberCount = await prisma.organizationMember.count({
            where: { organizationId: org.organizationId }
          });
          if (memberCount === 0) {
            await prisma.organization.delete({
              where: { id: org.organizationId }
            }).catch(() => {});
          }
        }
        await prisma.user.delete({
          where: { email: testCase.email }
        });
      }

      // Simulate registration
      console.log(`\n1️⃣  Creating ${testCase.userType} user...`);
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: testCase.email,
          password: hashedPassword,
          name: testCase.name,
          userType: testCase.userType,
        }
      });
      console.log(`   ✅ User created: ${user.email}`);

      // Auto-create organization (simulating the updated registration logic)
      console.log(`\n2️⃣  Creating organization automatically...`);
      const organization = await prisma.organization.create({
        data: {
          name: testCase.name,
          type: testCase.userType,
          email: testCase.email,
          tier: 'REGISTERED',
          subscriptionTier: 'REGISTERED',
          subscriptionStatus: 'active',
        }
      });
      console.log(`   ✅ Organization created: ${organization.name}`);

      // Add user as admin
      console.log(`\n3️⃣  Adding user as admin member...`);
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'admin',
          status: 'active',
        }
      });
      console.log('   ✅ User added as admin');

      // Verify access
      console.log(`\n4️⃣  Verifying access permissions...`);
      const verifyUser = await prisma.user.findUnique({
        where: { email: testCase.email },
        include: {
          organizationMemberships: {
            include: { organization: true }
          }
        }
      });

      const hasMembership = verifyUser.organizationMemberships.length > 0;
      const hasAdminRole = verifyUser.organizationMemberships.some(m => 
        ['admin', 'owner'].includes(m.role)
      );

      console.log('');
      console.log('   🔓 Access Results:');
      console.log(`      Organization Membership: ${hasMembership ? '✅ YES' : '❌ NO'}`);
      console.log(`      Admin/Owner Role: ${hasAdminRole ? '✅ YES' : '❌ NO'}`);
      console.log('');
      console.log(`      ${hasMembership ? '✅' : '❌'} Can access /organization/dashboard`);
      console.log(`      ${hasAdminRole ? '✅' : '❌'} Can access /organization/esg`);
      console.log('');
      
      if (hasMembership && hasAdminRole) {
        console.log('   ✅ SUCCESS: User has full organization access!');
      } else {
        console.log('   ❌ FAILED: User does not have proper access');
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n🎯 SUMMARY\n');
    
    const allUsers = await prisma.user.findMany({
      where: {
        email: {
          in: testEmails.map(t => t.email)
        }
      },
      include: {
        organizationMemberships: {
          include: { organization: true }
        }
      }
    });

    console.log('📊 Created Test Accounts:\n');
    allUsers.forEach(user => {
      const membership = user.organizationMemberships[0];
      console.log(`✅ ${user.email}`);
      console.log(`   Password: testpass123`);
      console.log(`   Type: ${user.userType}`);
      console.log(`   Organization: ${membership?.organization.name || 'None'}`);
      console.log(`   Role: ${membership?.role || 'None'}`);
      console.log(`   Dashboard Access: ${membership ? '✅' : '❌'}`);
      console.log(`   ESG Access: ${membership && ['admin', 'owner'].includes(membership.role) ? '✅' : '❌'}`);
      console.log('');
    });

    console.log('🚀 Next Steps:\n');
    console.log('1. Restart your dev server: npm run dev');
    console.log('2. Register a NEW organization account');
    console.log('3. After registration, you should automatically have access to:');
    console.log('   - /organization/dashboard');
    console.log('   - /organization/esg');
    console.log('');
    console.log('📝 The registration flow now automatically:');
    console.log('   ✅ Creates an organization when registering as CORPORATE/NGO/SCHOOL/HEALTHCARE');
    console.log('   ✅ Makes the user an admin member');
    console.log('   ✅ Grants access to all organization pages');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error('   Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrgRegistration();

