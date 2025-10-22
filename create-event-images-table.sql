-- Create event_images table safely
CREATE TABLE IF NOT EXISTS "event_images" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "category" TEXT DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_images_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "event_images_eventId_idx" ON "event_images"("eventId");
CREATE INDEX IF NOT EXISTS "event_images_userId_idx" ON "event_images"("userId");

-- Add foreign key constraints
ALTER TABLE "event_images" ADD CONSTRAINT "event_images_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
ALTER TABLE "event_images" ADD CONSTRAINT "event_images_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
