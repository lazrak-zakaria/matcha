CREATE TABLE IF NOT EXISTS user_profile_questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_user_profile_questions_user
ON user_profile_questions(user_id, display_order);
