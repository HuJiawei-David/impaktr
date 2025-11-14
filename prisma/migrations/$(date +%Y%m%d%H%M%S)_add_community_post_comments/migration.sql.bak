-- CreateTable
CREATE TABLE IF NOT EXISTS "community_post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_comments_postId_idx" ON "community_post_comments"("postId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_comments_userId_idx" ON "community_post_comments"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_comments_parentId_idx" ON "community_post_comments"("parentId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'community_post_comments_postId_fkey'
    ) THEN
        ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_postId_fkey" 
        FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'community_post_comments_userId_fkey'
    ) THEN
        ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'community_post_comments_parentId_fkey'
    ) THEN
        ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_parentId_fkey" 
        FOREIGN KEY ("parentId") REFERENCES "community_post_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

