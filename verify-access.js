// Final verification script for org@test.com access
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAccess() {
  try {
    console.log('🔐 VERIFICATION: org@test.com Access Check\n');
    console.log('=' .repeat(60));
    console.log('');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'org@test.com' },
      include: {
        organizationMemberships: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ FAIL: User org@test.com not found');
      console.log('   Run: node add-test-user.js');
      return;
    }

    console.log('✅ User Exists');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log('');

    if (user.organizationMemberships.length === 0) {
      console.log('❌ FAIL: Not a member of any organization');
      console.log('   Run: node check-org-access.js for instructions');
      return;
    }

    console.log('✅ Organization Membership Found');
    console.log('');

    // Check each membership
    user.organizationMemberships.forEach((membership, index) => {
      const org = membership.organization;
      
      console.log(`📊 Organization ${index + 1}: ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Slug: ${org.slug || 'N/A'}`);
      console.log(`   Type: ${org.type || 'N/A'}`);
      console.log(`   Tier: ${org.tier}`);
      console.log('');
      console.log(`   👤 User Role: ${membership.role}`);
      console.log(`   📅 Status: ${membership.status}`);
      console.log(`   🕒 Joined: ${membership.joinedAt.toLocaleString()}`);
      console.log('');

      // Check access to specific pages
      console.log('   🔓 Access Permissions:');
      
      // Dashboard requires any membership
      const dashboardAccess = membership.status === 'active';
      console.log(`      ${dashboardAccess ? '✅' : '❌'} /organization/dashboard`);
      
      // ESG page requires admin or owner role
      const esgAccess = membership.status === 'active' && 
                        ['admin', 'owner'].includes(membership.role);
      console.log(`      ${esgAccess ? '✅' : '❌'} /organization/esg`);
      
      // Other pages (same requirement as dashboard)
      console.log(`      ${dashboardAccess ? '✅' : '❌'} /organization/settings`);
      console.log(`      ${dashboardAccess ? '✅' : '❌'} /organization/members`);
      console.log(`      ${dashboardAccess ? '✅' : '❌'} /organization/events`);
      console.log(`      ${dashboardAccess ? '✅' : '❌'} /organization/analytics`);
      
      console.log('');
    });

    console.log('=' .repeat(60));
    console.log('');
    console.log('🎯 SUMMARY:');
    console.log('');
    
    const hasActiveAdmin = user.organizationMemberships.some(m => 
      m.status === 'active' && ['admin', 'owner'].includes(m.role)
    );
    
    if (hasActiveAdmin) {
      console.log('✅ org@test.com CAN access /organization/dashboard');
      console.log('✅ org@test.com CAN access /organization/esg');
      console.log('');
      console.log('🚀 You can now:');
      console.log('   1. Run: npm run dev');
      console.log('   2. Login with: org@test.com / password123');
      console.log('   3. Visit: http://localhost:3000/organization/dashboard');
      console.log('   4. Visit: http://localhost:3000/organization/esg');
    } else {
      console.log('⚠️  org@test.com has limited access');
      console.log('   Need "admin" or "owner" role for full access');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAccess();

