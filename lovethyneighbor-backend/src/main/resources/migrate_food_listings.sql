-- Run once against lovethyneighbor before starting the backend with the food posting changes.
-- logins.id is now a UUID (see migrate_to_uuid.sql), so food.user_id has to match it.
-- Existing rows can't be mapped from the old integer ids, so they are cleared.

DELETE FROM food;
ALTER TABLE food DROP CONSTRAINT IF EXISTS food_user_id_fkey;
ALTER TABLE food DROP CONSTRAINT IF EXISTS fk_user_id;
ALTER TABLE food ALTER COLUMN user_id TYPE UUID USING NULL;
ALTER TABLE food ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES logins(id) ON DELETE CASCADE;

-- New columns (spring.jpa.hibernate.ddl-auto=update would also add these, plus the food_photos table)
ALTER TABLE food ADD COLUMN IF NOT EXISTS pickup_end_time TIMESTAMP;
ALTER TABLE food ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE food ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'pending';
ALTER TABLE food ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
