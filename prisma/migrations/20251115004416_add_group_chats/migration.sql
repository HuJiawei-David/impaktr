-- CreateTable
CREATE TABLE IF NOT EXISTS "group_chats" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "group_chat_members" (
    "id" TEXT NOT NULL,
    "groupChatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "group_chat_messages" (
    "id" TEXT NOT NULL,
    "groupChatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "group_chats_eventId_key" ON "group_chats"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "group_chats_eventId_idx" ON "group_chats"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "group_chat_members_groupChatId_userId_key" ON "group_chat_members"("groupChatId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "group_chat_members_userId_idx" ON "group_chat_members"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "group_chat_members_groupChatId_idx" ON "group_chat_members"("groupChatId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "group_chat_messages_groupChatId_idx" ON "group_chat_messages"("groupChatId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "group_chat_messages_senderId_idx" ON "group_chat_messages"("senderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "group_chat_messages_createdAt_idx" ON "group_chat_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "group_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "group_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

