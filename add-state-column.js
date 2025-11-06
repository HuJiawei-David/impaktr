// Script to add state column to organizations table
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addStateColumn() {
  try {
    console.log('🔍 Adding state column to organizations table...\n');
    
    // Execute raw SQL to add the column
    await prisma.$executeRaw`
      ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "state" TEXT;
    `;
    
    console.log('✅ State column added successfully!\n');
    
    // Verify the column exists
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' AND column_name = 'state';
    `;
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('✅ Verification: State column exists in database');
      console.log('   Column details:', result[0]);
    } else {
      console.log('⚠️  Warning: Could not verify column existence');
    }
    
  } catch (error) {
    console.error('❌ Error adding state column:', error);
    console.error('\n💡 Alternative: Execute this SQL manually in Neon console:');
    console.error('   ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "state" TEXT;');
  } finally {
    await prisma.$disconnect();
  }
}

addStateColumn();

