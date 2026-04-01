ALTER TABLE user_search_preference_tags 
  ADD COLUMN user_id INTEGER NOT NULL,
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
