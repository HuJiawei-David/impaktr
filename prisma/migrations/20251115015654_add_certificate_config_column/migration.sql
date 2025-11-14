-- Add certificateConfig column to events table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'certificateConfig'
  ) THEN
    ALTER TABLE "events" ADD COLUMN "certificateConfig" jsonb;
  END IF;
END $$;

