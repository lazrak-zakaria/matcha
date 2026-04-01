CREATE TABLE IF NOT EXISTS "skips" (
    id SERIAL PRIMARY KEY,
    skiper_id INTEGER NOT NULL,
    skiped_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("skiper_id", "skiped_id"),
    FOREIGN KEY ("skiper_id") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("skiped_id") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "matches" (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("user1_id", "user2_id"),
    FOREIGN KEY ("user1_id") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("user2_id") REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS "reports" (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL,
    reported_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("reporter_id", "reported_id"),
    FOREIGN KEY ("reporter_id") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("reported_id") REFERENCES users(id) ON DELETE CASCADE
);