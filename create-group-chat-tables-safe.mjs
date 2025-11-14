import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function createGroupChatTables() {
  try {
    console.log('Starting Group Chat tables creation...');
    console.log('This script will NOT reset or modify existing data.');
    console.log('It only creates the missing tables if they don\'t exist.\n');

    // Read the SQL file
    const sqlPath = join(__dirname, 'create-group-chat-tables-safe.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute SQL statements step by step
    let executedCount = 0;
    let skippedCount = 0;

    // 1. Create group_chats table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "group_chats" (
          "id" TEXT NOT NULL,
          "eventId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "group_chats_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('  ✓ Created table: group_chats');
      executedCount++;
    } catch (error) {
      if (error.code === '42P07') {
        console.log('  - Table already exists: group_chats');
        skippedCount++;
      } else {
        console.error(`  ⚠ Error creating group_chats: ${error.message}`);
      }
    }

    // 2. Create group_chat_members table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "group_chat_members" (
          "id" TEXT NOT NULL,
          "groupChatId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'MEMBER',
          "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "group_chat_members_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('  ✓ Created table: group_chat_members');
      executedCount++;
    } catch (error) {
      if (error.code === '42P07') {
        console.log('  - Table already exists: group_chat_members');
        skippedCount++;
      } else {
        console.error(`  ⚠ Error creating group_chat_members: ${error.message}`);
      }
    }

    // 3. Create group_chat_messages table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "group_chat_messages" (
          "id" TEXT NOT NULL,
          "groupChatId" TEXT NOT NULL,
          "senderId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'TEXT',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "group_chat_messages_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('  ✓ Created table: group_chat_messages');
      executedCount++;
    } catch (error) {
      if (error.code === '42P07') {
        console.log('  - Table already exists: group_chat_messages');
        skippedCount++;
      } else {
        console.error(`  ⚠ Error creating group_chat_messages: ${error.message}`);
      }
    }

    // 4. Create unique constraints
    const uniqueConstraints = [
      { name: 'group_chats_eventId_key', sql: 'ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_eventId_key" UNIQUE ("eventId");' },
      { name: 'group_chat_members_groupChatId_userId_key', sql: 'ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_groupChatId_userId_key" UNIQUE ("groupChatId", "userId");' }
    ];

    for (const constraint of uniqueConstraints) {
      try {
        await prisma.$executeRawUnsafe(constraint.sql);
        console.log(`  ✓ Created unique constraint: ${constraint.name}`);
        executedCount++;
      } catch (error) {
        if (error.code === '42710' || error.message?.includes('already exists')) {
          console.log(`  - Constraint already exists: ${constraint.name}`);
          skippedCount++;
        } else {
          console.error(`  ⚠ Error creating constraint ${constraint.name}: ${error.message}`);
        }
      }
    }

    // 5. Create indexes
    const indexes = [
      { name: 'group_chats_eventId_idx', sql: 'CREATE INDEX IF NOT EXISTS "group_chats_eventId_idx" ON "group_chats"("eventId");' },
      { name: 'group_chat_members_userId_idx', sql: 'CREATE INDEX IF NOT EXISTS "group_chat_members_userId_idx" ON "group_chat_members"("userId");' },
      { name: 'group_chat_members_groupChatId_idx', sql: 'CREATE INDEX IF NOT EXISTS "group_chat_members_groupChatId_idx" ON "group_chat_members"("groupChatId");' },
      { name: 'group_chat_messages_groupChatId_idx', sql: 'CREATE INDEX IF NOT EXISTS "group_chat_messages_groupChatId_idx" ON "group_chat_messages"("groupChatId");' },
      { name: 'group_chat_messages_senderId_idx', sql: 'CREATE INDEX IF NOT EXISTS "group_chat_messages_senderId_idx" ON "group_chat_messages"("senderId");' },
      { name: 'group_chat_messages_createdAt_idx', sql: 'CREATE INDEX IF NOT EXISTS "group_chat_messages_createdAt_idx" ON "group_chat_messages"("createdAt");' }
    ];

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index.sql);
        console.log(`  ✓ Created index: ${index.name}`);
        executedCount++;
      } catch (error) {
        console.log(`  - Index check: ${index.name} (IF NOT EXISTS handled)`);
        skippedCount++;
      }
    }

    // 6. Add foreign key constraints
    const foreignKeys = [
      { name: 'group_chats_eventId_fkey', sql: 'ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;' },
      { name: 'group_chat_members_groupChatId_fkey', sql: 'ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "group_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;' },
      { name: 'group_chat_members_userId_fkey', sql: 'ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;' },
      { name: 'group_chat_messages_groupChatId_fkey', sql: 'ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "group_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;' },
      { name: 'group_chat_messages_senderId_fkey', sql: 'ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;' }
    ];

    for (const fk of foreignKeys) {
      try {
        await prisma.$executeRawUnsafe(fk.sql);
        console.log(`  ✓ Created foreign key: ${fk.name}`);
        executedCount++;
      } catch (error) {
        if (error.code === '42710' || error.message?.includes('already exists')) {
          console.log(`  - Foreign key already exists: ${fk.name}`);
          skippedCount++;
        } else {
          console.error(`  ⚠ Error creating foreign key ${fk.name}: ${error.message}`);
        }
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Statements executed: ${executedCount}`);
    console.log(`Statements skipped (already exist): ${skippedCount}`);
    
    // Verify tables exist
    console.log('\nVerifying tables...');
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('group_chats', 'group_chat_members', 'group_chat_messages')
      ORDER BY tablename;
    `;

    if (Array.isArray(tables) && tables.length > 0) {
      console.log('✓ All Group Chat tables exist:');
      tables.forEach(table => console.log(`  - ${table.tablename}`));
    } else {
      console.log('⚠ Warning: Some tables may not exist. Please check the errors above.');
    }

    console.log('\n✅ Group Chat tables creation completed!');
    console.log('You can now run the fix script: node fix-group-chat-members.mjs');

  } catch (error) {
    console.error('❌ Error creating Group Chat tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createGroupChatTables()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

