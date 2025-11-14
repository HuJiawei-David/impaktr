import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding whoShouldJoin and whatWeDo columns to communities table...');
    
    // Add columns if they don't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE communities 
      ADD COLUMN IF NOT EXISTS "whoShouldJoin" TEXT,
      ADD COLUMN IF NOT EXISTS "whatWeDo" TEXT;
    `);
    
    console.log('✅ Successfully added columns to communities table!');
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

