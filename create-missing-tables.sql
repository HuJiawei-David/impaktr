-- Create all missing event-related tables

-- 1. Create event_bookmarks table
CREATE TABLE IF NOT EXISTS "event_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_bookmarks_userId_eventId_key" ON "event_bookmarks"("userId", "eventId");
ALTER TABLE "event_bookmarks" ADD CONSTRAINT "event_bookmarks_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_bookmarks" ADD CONSTRAINT "event_bookmarks_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Create event_comments table
CREATE TABLE IF NOT EXISTS "event_comments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "event_comments_eventId_idx" ON "event_comments"("eventId");
CREATE INDEX IF NOT EXISTS "event_comments_userId_idx" ON "event_comments"("userId");
CREATE INDEX IF NOT EXISTS "event_comments_parentId_idx" ON "event_comments"("parentId");
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "event_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Create event_comment_likes table
CREATE TABLE IF NOT EXISTS "event_comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_comment_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_comment_likes_commentId_userId_key" ON "event_comment_likes"("commentId", "userId");
ALTER TABLE "event_comment_likes" ADD CONSTRAINT "event_comment_likes_commentId_fkey" 
    FOREIGN KEY ("commentId") REFERENCES "event_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_comment_likes" ADD CONSTRAINT "event_comment_likes_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
