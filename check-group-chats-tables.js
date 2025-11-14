const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function checkTables() {
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
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    console.log('🔍 Checking if group_chats tables exist...\n');
    
    // Check if tables exist using raw SQL
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('group_chats', 'group_chat_members', 'group_chat_messages')
      ORDER BY table_name;
    `;

    if (tables && tables.length > 0) {
      console.log('✅ Tables found in database:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
      console.log('\n✅ Tables exist! The issue might be that Prisma client needs to be regenerated.');
    } else {
      console.log('❌ Tables NOT found in database!');
      console.log('⚠️  The migration may not have been applied correctly.');
      console.log('\nTrying to apply migration again...\n');
    }

    // Also try to use the Prisma model directly
    try {
      const count = await prisma.groupChat.count();
      console.log(`\n✅ Prisma client can access group_chats table (count: ${count})`);
    } catch (err) {
      console.log('\n❌ Prisma client cannot access group_chats table:');
      console.log(`   Error: ${err.message}`);
      console.log('\n💡 Solution: Run "npx prisma generate" to regenerate Prisma client');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();

