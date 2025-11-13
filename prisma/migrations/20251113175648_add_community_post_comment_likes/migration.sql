-- CreateTable
CREATE TABLE IF NOT EXISTS "community_post_comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "community_post_comment_likes_commentId_userId_key" ON "community_post_comment_likes"("commentId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_comment_likes_commentId_idx" ON "community_post_comment_likes"("commentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_comment_likes_userId_idx" ON "community_post_comment_likes"("userId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'community_post_comment_likes_commentId_fkey'
    ) THEN
        ALTER TABLE "community_post_comment_likes" ADD CONSTRAINT "community_post_comment_likes_commentId_fkey" 
        FOREIGN KEY ("commentId") REFERENCES "community_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'community_post_comment_likes_userId_fkey'
    ) THEN
        ALTER TABLE "community_post_comment_likes" ADD CONSTRAINT "community_post_comment_likes_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
