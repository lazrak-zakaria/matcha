CREATE TABLE IF NOT EXISTS "views" (
    id SERIAL PRIMARY KEY,
    viewer_id INTEGER NOT NULL,
    viewed_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("viewer_id", "viewed_id"),
    FOREIGN KEY ("viewer_id") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("viewed_id") REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS "blocks" (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER NOT NULL,
    blocked_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("blocker_id", "blocked_id"),
    FOREIGN KEY ("blocker_id") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("blocked_id") REFERENCES users(id) ON DELETE CASCADE
);



ALTER Table "users" ADD COLUMN "is_online" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER Table "users" ADD COLUMN "last_seen" TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE "users" ADD COLUMN "age" INTEGER;

CREATE TBALE IF NOT EXISTS "notifications" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY ("user_id") REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS "user_search_preferences" (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL UNIQUE,
    min_age             INTEGER,
    max_age             INTEGER,
    min_fame_rating     INTEGER,
    max_fame_rating     INTEGER,
    location_radius_km  INTEGER,
    preferred_gender    gender_type,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY ("user_id") REFERENCES users(id) ON DELETE CASCADE
);

-- junction table: one row per preferred tag per user preference
CREATE TABLE IF NOT EXISTS "user_search_preference_tags" (
    preference_id   INTEGER NOT NULL,
    tag_id          INTEGER NOT NULL,
    PRIMARY KEY (preference_id, tag_id),
    FOREIGN KEY (preference_id) REFERENCES user_search_preferences(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)        REFERENCES tags(id) ON DELETE CASCADE
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "latitude"  DECIMAL(9, 6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10, 6);


