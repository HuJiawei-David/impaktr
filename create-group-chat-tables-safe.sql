-- Safe Migration: Create GroupChat Tables
-- This script will NOT reset or modify existing data
-- It only creates the missing tables if they don't exist

-- 1. Create group_chats table
CREATE TABLE IF NOT EXISTS "group_chats" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_chats_pkey" PRIMARY KEY ("id")
);

-- 2. Create group_chat_members table
CREATE TABLE IF NOT EXISTS "group_chat_members" (
    "id" TEXT NOT NULL,
    "groupChatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_chat_members_pkey" PRIMARY KEY ("id")
);

-- 3. Create group_chat_messages table
CREATE TABLE IF NOT EXISTS "group_chat_messages" (
    "id" TEXT NOT NULL,
    "groupChatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_chat_messages_pkey" PRIMARY KEY ("id")
);

-- 4. Create unique constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Unique constraint on eventId
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_chats_eventId_key'
    ) THEN
        ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_eventId_key" UNIQUE ("eventId");
    END IF;

    -- Unique constraint on groupChatId + userId
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_chat_members_groupChatId_userId_key'
    ) THEN
        ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_groupChatId_userId_key" UNIQUE ("groupChatId", "userId");
    END IF;
END $$;

-- 5. Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS "group_chats_eventId_idx" ON "group_chats"("eventId");
CREATE INDEX IF NOT EXISTS "group_chat_members_userId_idx" ON "group_chat_members"("userId");
CREATE INDEX IF NOT EXISTS "group_chat_members_groupChatId_idx" ON "group_chat_members"("groupChatId");
CREATE INDEX IF NOT EXISTS "group_chat_messages_groupChatId_idx" ON "group_chat_messages"("groupChatId");
CREATE INDEX IF NOT EXISTS "group_chat_messages_senderId_idx" ON "group_chat_messages"("senderId");
CREATE INDEX IF NOT EXISTS "group_chat_messages_createdAt_idx" ON "group_chat_messages"("createdAt");

-- 6. Add foreign key constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Foreign key: group_chats.eventId -> events.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_chats_eventId_fkey'
    ) THEN
        ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_eventId_fkey" 
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Foreign key: group_chat_members.groupChatId -> group_chats.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_chat_members_groupChatId_fkey'
    ) THEN
        ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_groupChatId_fkey" 
        FOREIGN KEY ("groupChatId") REFERENCES "group_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Foreign key: group_chat_members.userId -> users.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_chat_members_userId_fkey'
    ) THEN
        ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Foreign key: group_chat_messages.groupChatId -> group_chats.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_chat_messages_groupChatId_fkey'
    ) THEN
        ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_groupChatId_fkey" 
        FOREIGN KEY ("groupChatId") REFERENCES "group_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Foreign key: group_chat_messages.senderId -> users.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'group_chat_messages_senderId_fkey'
    ) THEN
        ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_senderId_fkey" 
        FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 7. Verify tables were created
SELECT 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('group_chats', 'group_chat_members', 'group_chat_messages')
ORDER BY tablename;


