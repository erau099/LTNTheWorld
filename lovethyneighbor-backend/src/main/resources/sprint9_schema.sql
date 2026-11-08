-- Sprint 9 Schema Migrations: Geocoding & Completed Timestamps

-- 1. Add latitude and longitude to food table
ALTER TABLE food ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE food ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE food ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 2. Add latitude and longitude to addresses table
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 3. Add index on coordinates for spatial queries
CREATE INDEX IF NOT EXISTS idx_food_coordinates ON food(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_addresses_coordinates ON addresses(latitude, longitude);
