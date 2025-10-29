/**
 * Check if a user has permission to create events
 * Usage: node check-event-create-permission.js <user-email>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEventCreatePermission(email) {
  try {
    console.log(`\n🔍 Checking event creation permission for: ${email}\n`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found!\n');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Type: ${user.userType}`);

    if (user.organizationMemberships.length === 0) {
      console.log('\n⚠️  User is not a member of any organization.');
      console.log('   To create organization events, the user must be:');
      console.log('   - An "admin" or "owner" of an organization\n');
      console.log('💡 Solution: Add user to an organization using:');
      console.log('   node add-to-organization.js\n');
      return;
    }

    console.log(`\n📋 Organization Memberships (${user.organizationMemberships.length}):`);
    
    let hasAdminAccess = false;
    user.organizationMemberships.forEach((membership, index) => {
      const isAdmin = membership.role === 'admin' || membership.role === 'owner';
      hasAdminAccess = hasAdminAccess || isAdmin;
      
      console.log(`\n   ${index + 1}. ${membership.organization.name}`);
      console.log(`      Organization ID: ${membership.organization.id}`);
      console.log(`      Type: ${membership.organization.type || 'N/A'}`);
      console.log(`      Role: ${membership.role} ${isAdmin ? '✅ (Can create events)' : '❌ (No permission)'}`);
      console.log(`      Status: ${membership.status}`);
      console.log(`      Joined: ${new Date(membership.joinedAt).toLocaleDateString()}`);
    });

    console.log('\n' + '='.repeat(70));
    
    if (hasAdminAccess) {
      console.log('✅ USER HAS PERMISSION TO CREATE EVENTS');
      console.log('\n   This user can create events for the organizations where they are admin/owner.');
    } else {
      console.log('❌ USER DOES NOT HAVE PERMISSION TO CREATE EVENTS');
      console.log('\n   To grant permission, update the user\'s role to "admin" or "owner"');
      console.log('   in at least one organization.\n');
      console.log('💡 Solution: Run the following SQL command:');
      console.log(`\n   UPDATE "OrganizationMember" `);
      console.log(`   SET role = 'admin' `);
      console.log(`   WHERE "userId" = '${user.id}' `);
      console.log(`   AND "organizationId" = '<organization-id>';\n`);
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('\n📖 Usage: node check-event-create-permission.js <user-email>');
  console.log('\n   Example: node check-event-create-permission.js user@example.com\n');
  process.exit(1);
}

checkEventCreatePermission(email);

