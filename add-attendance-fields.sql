-- Add attendance fields to events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "attendanceCode" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "attendanceEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "attendanceEnabledAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "attendanceDisabledAt" TIMESTAMP(3);

-- Add comments for documentation
COMMENT ON COLUMN "events"."attendanceCode" IS '6-digit attendance code generated when attendance is enabled';
COMMENT ON COLUMN "events"."attendanceEnabled" IS 'Whether attendance tracking is currently enabled';
COMMENT ON COLUMN "events"."attendanceEnabledAt" IS 'Timestamp when attendance tracking was enabled';
COMMENT ON COLUMN "events"."attendanceDisabledAt" IS 'Timestamp when attendance tracking was disabled';

