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

-- CreateTable: countries
CREATE TABLE IF NOT EXISTS "countries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code3" TEXT,
    "numeric" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: states
CREATE TABLE IF NOT EXISTS "states" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "countries_code_idx" ON "countries"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "countries_name_idx" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "states_countryId_code_key" ON "states"("countryId", "code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "states_countryId_idx" ON "states"("countryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "states_name_idx" ON "states"("name");

-- AddForeignKey
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'states_countryId_fkey'
  ) THEN
    ALTER TABLE "states" ADD CONSTRAINT "states_countryId_fkey" 
    FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;





