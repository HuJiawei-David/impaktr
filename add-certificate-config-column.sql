-- Add certificateConfig column to events table if it doesn't exist
-- This fixes the Prisma error: "The column `events.certificateConfig` does not exist in the current database."

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'certificateConfig'
  ) THEN
    ALTER TABLE "events" ADD COLUMN "certificateConfig" jsonb;
    RAISE NOTICE 'Added certificateConfig column to events table';
  ELSE
    RAISE NOTICE 'certificateConfig column already exists in events table';
  END IF;
END $$;

