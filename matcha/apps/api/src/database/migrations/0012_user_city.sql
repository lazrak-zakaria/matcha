-- Add city field to users for location display on profiles and discover cards
ALTER TABLE users
ADD COLUMN IF NOT EXISTS city TEXT;

CREATE INDEX IF NOT EXISTS idx_users_city
ON users(city);