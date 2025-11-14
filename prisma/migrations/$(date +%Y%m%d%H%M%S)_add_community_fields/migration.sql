-- AlterTable
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "whoShouldJoin" TEXT,
ADD COLUMN IF NOT EXISTS "whatWeDo" TEXT;
