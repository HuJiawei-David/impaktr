-- Add Meetup-style location fields to communities table
-- Migration: add_community_location_fields

-- Add new columns for location-based features
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS location_data JSONB,
ADD COLUMN IF NOT EXISTS coordinates POINT,
ADD COLUMN IF NOT EXISTS primary_sdg INTEGER,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS member_avatars TEXT[] DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_communities_primary_sdg ON communities(primary_sdg);
CREATE INDEX IF NOT EXISTS idx_communities_rating ON communities(rating);
CREATE INDEX IF NOT EXISTS idx_communities_location_data ON communities USING GIN (location_data);
CREATE INDEX IF NOT EXISTS idx_communities_coordinates ON communities USING GIST (coordinates);

-- Add constraints
ALTER TABLE communities 
ADD CONSTRAINT chk_rating_range CHECK (rating >= 0.0 AND rating <= 5.0);

-- Update existing communities with sample location data
UPDATE communities 
SET 
  location_data = '{"city": "Kuala Lumpur", "country": "Malaysia"}'::jsonb,
  primary_sdg = CASE 
    WHEN sdg_focus @> '[13]' THEN 13  -- Climate Action
    WHEN sdg_focus @> '[4]' THEN 4     -- Quality Education
    WHEN sdg_focus @> '[3]' THEN 3     -- Good Health
    WHEN sdg_focus @> '[9]' THEN 9     -- Industry Innovation
    WHEN sdg_focus @> '[5]' THEN 5     -- Gender Equality
    ELSE COALESCE(sdg_focus[1], 1)    -- Default to first SDG or SDG 1
  END,
  rating = 4.5 + (RANDOM() * 0.5), -- Random rating between 4.5-5.0
  member_avatars = ARRAY[
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
  ]
WHERE location_data IS NULL;

-- Add sample coordinates for Kuala Lumpur area (randomized within city bounds)
UPDATE communities 
SET coordinates = ST_Point(
  101.6869 + (RANDOM() - 0.5) * 0.2,  -- Longitude: KL center ± 0.1 degrees
  3.1390 + (RANDOM() - 0.5) * 0.1     -- Latitude: KL center ± 0.05 degrees
)
WHERE coordinates IS NULL;

COMMENT ON COLUMN communities.location_data IS 'JSON object containing city, country, and optional coordinates';
COMMENT ON COLUMN communities.coordinates IS 'PostGIS point for distance calculations and mapping';
COMMENT ON COLUMN communities.primary_sdg IS 'Primary SDG focus for this community';
COMMENT ON COLUMN communities.rating IS 'Community rating from 0.0 to 5.0';
COMMENT ON COLUMN communities.member_avatars IS 'Array of member profile picture URLs for display';
