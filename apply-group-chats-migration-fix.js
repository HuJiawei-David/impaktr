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

  // Create Prisma client with the database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    console.log('📝 Applying migration: add_group_chats');
    console.log('📋 This will create: group_chats, group_chat_members, group_chat_messages tables\n');
    
    // Execute the entire SQL file at once
    // The SQL already has IF NOT EXISTS, so it's safe to run
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ Migration SQL executed successfully!');
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables were created...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('group_chats', 'group_chat_members', 'group_chat_messages')
      ORDER BY table_name;
    `;

    if (tables && tables.length > 0) {
      console.log('\n✅ Tables verified in database:');
      tables.forEach(t => console.log(`   ✓ ${t.table_name}`));
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Run: npx prisma generate');
      console.log('   2. Restart your development server');
    } else {
      console.log('\n❌ Tables not found after migration. Please check the SQL manually.');
    }
    
  } catch (error) {
    console.error('\n❌ Error applying migration:', error.message);
    if (error.code === 'P1003') {
      console.log('\n💡 This might be a syntax issue. Trying to execute statements one by one...\n');
      
      // Fallback: Try executing statement by statement
      const statements = sql
        .split(/;\s*(?=\n|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.trim()) {
          try {
            await prisma.$executeRawUnsafe(stmt + ';');
            console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
          } catch (err) {
            // Ignore errors for IF NOT EXISTS statements
            if (err.message.includes('already exists') || 
                err.message.includes('duplicate') ||
                err.code === '42P07' ||  // relation already exists
                err.code === '42710') {  // duplicate object
              console.log(`⚠️  Statement ${i + 1}/${statements.length} already exists (skipped)`);
            } else {
              console.error(`❌ Error in statement ${i + 1}:`, err.message);
              console.error('Statement:', stmt.substring(0, 100) + '...');
              throw err;
            }
          }
        }
      }
      
      console.log('\n✅ All statements executed!');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

