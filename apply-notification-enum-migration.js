/**
 * Script to apply NotificationType enum migration
 * This adds missing enum values: CERTIFICATE_ISSUED, RANK_UP, EVENT_JOINED, MONTHLY_REPORT
 * 
 * Run with: node apply-notification-enum-migration.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔄 Applying NotificationType enum migration...\n');

  const enumValues = [
    'CERTIFICATE_ISSUED',
    'RANK_UP',
    'EVENT_JOINED',
    'MONTHLY_REPORT'
  ];

  try {
    for (const enumValue of enumValues) {
      try {
        // Use raw SQL to add enum value with IF NOT EXISTS
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS '${enumValue}'`
        );
        console.log(`✅ Added enum value: ${enumValue}`);
      } catch (error) {
        // Check if it's already added (PostgreSQL error code 42710)
        if (error.code === '42710' || error.message?.includes('already exists')) {
          console.log(`ℹ️  Enum value already exists: ${enumValue}`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    
    // Verify the enum values
    console.log('\n📋 Verifying enum values...');
    const enumLabels = await prisma.$queryRawUnsafe(
      `SELECT enumlabel 
       FROM pg_enum 
       WHERE enumtypid = 'NotificationType'::regtype 
       ORDER BY enumlabel`
    );
    
    console.log('\nCurrent NotificationType enum values:');
    enumLabels.forEach((row) => {
      console.log(`  - ${row.enumlabel}`);
    });

    // Check if all required values are present
    const labels = enumLabels.map((row) => row.enumlabel);
    const missing = enumValues.filter(val => !labels.includes(val));
    
    if (missing.length > 0) {
      console.warn(`\n⚠️  Warning: Some values are missing: ${missing.join(', ')}`);
    } else {
      console.log('\n✅ All required enum values are present!');
    }

  } catch (error) {
    console.error('\n❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

