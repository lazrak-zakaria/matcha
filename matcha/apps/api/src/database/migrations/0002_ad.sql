ALTER Table "users" ADD COLUMN "refreshToken" text;
ALTER Table "users" ADD COLUMN "bio" text;
-- Create the custom type
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
-- Add the column using that type
ALTER TABLE "users" ADD COLUMN "gender" gender_type;

CREATE TABLE IF NOT EXISTS "likes" (
    id SERIAL PRIMARY KEY,
    liker_id INTEGER NOT NULL,
    liked_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("liker_id", "liked_id"),
    FOREIGN KEY ("liker_id") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("liked_id") REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS "unlikes" (
    id SERIAL PRIMARY KEY,
    unliker_id INTEGER NOT NULL,
    unliked_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("unliker_id", "unliked_id"),
    FOREIGN KEY ("unliker_id") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("unliked_id") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "tags" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_tags" (
    user_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, tag_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);



