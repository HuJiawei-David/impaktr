-- CreateEnum (if not exists)
DO $$ BEGIN
 CREATE TYPE "ReportReason" AS ENUM('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'COPYRIGHT_VIOLATION', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (if not exists)
DO $$ BEGIN
 CREATE TYPE "ReportStatus" AS ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "community_post_reports" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "community_post_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "community_post_reports_postId_userId_key" ON "community_post_reports"("postId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_reports_postId_idx" ON "community_post_reports"("postId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_reports_status_idx" ON "community_post_reports"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_reports_createdAt_idx" ON "community_post_reports"("createdAt");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "community_post_reports" ADD CONSTRAINT "community_post_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "community_post_reports" ADD CONSTRAINT "community_post_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "community_post_reports" ADD CONSTRAINT "community_post_reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

