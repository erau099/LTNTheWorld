-- Sprint 7 Admin & Moderation Schema Migration
ALTER TABLE logins ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE logins ADD COLUMN IF NOT EXISTS can_post_listings BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS food (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES logins(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    allergens VARCHAR(255),
    pickup_address VARCHAR(255),
    pickup_window VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
