// Script to check if org@test.com has organization access
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrgAccess() {
  try {
    console.log('🔍 Checking organization access for org@test.com...\n');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'org@test.com' },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        role: true,
      }
    });

    if (!user) {
      console.log('❌ User org@test.com not found!');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Type: ${user.userType}`);
    console.log(`   Role: ${user.role}`);
    console.log('');

    // Check organization memberships
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            tier: true,
            subscriptionTier: true,
          }
        }
      }
    });

    console.log(`📊 Organization Memberships: ${memberships.length}`);
    console.log('');

    if (memberships.length === 0) {
      console.log('❌ org@test.com is NOT a member of any organization!');
      console.log('');
      console.log('💡 Solution: The user needs to be added to an organization.');
      console.log('');
      
      // Show available organizations
      const allOrgs = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
        }
      });

      if (allOrgs.length > 0) {
        console.log('📋 Available Organizations:');
        allOrgs.forEach((org, index) => {
          console.log(`   ${index + 1}. ${org.name} (${org.slug || 'no-slug'})`);
          console.log(`      ID: ${org.id}`);
          console.log(`      Tier: ${org.tier}`);
          console.log('');
        });
        
        console.log('To add org@test.com to an organization, run:');
        console.log(`node add-to-organization.js ${allOrgs[0].id}`);
      } else {
        console.log('❌ No organizations exist in the database!');
        console.log('💡 You need to create an organization first.');
      }
    } else {
      console.log('✅ Organization Memberships:');
      memberships.forEach((membership, index) => {
        console.log(`${index + 1}. ${membership.organization.name}`);
        console.log(`   Organization ID: ${membership.organization.id}`);
        console.log(`   Slug: ${membership.organization.slug || 'N/A'}`);
        console.log(`   Role: ${membership.role}`);
        console.log(`   Status: ${membership.status}`);
        console.log(`   Joined: ${membership.joinedAt.toLocaleString()}`);
        console.log('');
        console.log(`   ✅ Can access: /organization/dashboard`);
        console.log(`   ✅ Can access: /organization/esg`);
        console.log('');
      });
    }

    // Check admin access
    if (user.role === 'ADMIN') {
      console.log('🔑 ADMIN ACCESS: User has admin privileges');
      console.log('   ✅ Can access: /admin');
    } else {
      console.log('ℹ️  Not an admin user (role: ' + user.role + ')');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrgAccess();

