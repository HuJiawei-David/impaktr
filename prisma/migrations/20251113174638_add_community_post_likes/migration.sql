-- CreateTable
CREATE TABLE IF NOT EXISTS "community_post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "community_post_likes_postId_userId_key" ON "community_post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_likes_postId_idx" ON "community_post_likes"("postId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_likes_userId_idx" ON "community_post_likes"("userId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'community_post_likes_postId_fkey'
    ) THEN
        ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_postId_fkey" 
        FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'community_post_likes_userId_fkey'
    ) THEN
        ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

