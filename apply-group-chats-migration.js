const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  // Read DATABASE_URL from .env.local
  const envLocalPath = path.join(__dirname, '.env.local');
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl && fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL="(.+)"/);
    if (match) {
      databaseUrl = match[1];
    }
  }
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found. Please set it in .env.local');
    process.exit(1);
  }

  // Read migration SQL file
  const migrationPath = path.join(__dirname, 'prisma/migrations/20251115004416_add_group_chats/migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Execute SQL directly using Prisma
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    console.log('📝 Applying migration: add_group_chats');
    
    // Split SQL into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (err) {
          // Ignore errors for IF NOT EXISTS statements that already exist
          if (err.message.includes('already exists') || err.message.includes('duplicate')) {
            console.log('⚠️  Already exists (skipped):', statement.substring(0, 50) + '...');
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('📋 Tables created: group_chats, group_chat_members, group_chat_messages');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

