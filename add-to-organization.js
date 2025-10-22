// Script to add org@test.com to an organization
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addToOrganization() {
  try {
    const orgId = process.argv[2];
    
    if (!orgId) {
      console.log('❌ Please provide an organization ID');
      console.log('Usage: node add-to-organization.js <organizationId>');
      return;
    }

    console.log('🔍 Adding org@test.com to organization...\n');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'org@test.com' }
    });

    if (!user) {
      console.log('❌ User org@test.com not found!');
      console.log('   Run: node add-test-user.js first');
      return;
    }

    // Find the organization
    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      console.log('❌ Organization not found!');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('✅ Organization found:', org.name);
    console.log('');

    // Check if already a member
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: user.id
        }
      }
    });

    if (existingMembership) {
      console.log('ℹ️  User is already a member of this organization!');
      console.log('   Role:', existingMembership.role);
      console.log('   Status:', existingMembership.status);
      return;
    }

    // Add user as admin member of the organization
    const membership = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: 'admin', // Make them admin so they can access all pages
        status: 'active'
      }
    });

    console.log('🎉 Successfully added to organization!');
    console.log('   Organization:', org.name);
    console.log('   User:', user.email);
    console.log('   Role:', membership.role);
    console.log('   Status:', membership.status);
    console.log('');
    console.log('✅ org@test.com can now access:');
    console.log('   - /organization/dashboard');
    console.log('   - /organization/esg');
    console.log('   - /organization/settings');
    console.log('   - All other organization pages');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.error('   User is already a member of this organization');
    } else {
      console.error('   Full error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

addToOrganization();

