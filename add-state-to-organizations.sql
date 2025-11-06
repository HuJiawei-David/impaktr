-- Add state column to organizations table if it doesn't exist
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "state" TEXT;

