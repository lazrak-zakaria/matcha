-- ============================================================
-- Clean slate (order matters: children before parents)
-- ============================================================
TRUNCATE TABLE
    user_search_preference_tags,
    user_search_preferences,
    notifications,
    blocks,
    views,
    likes,
    unlikes,
    user_tags,
    tags,
    users
RESTART IDENTITY CASCADE;

-- ============================================================
-- Users  (password_hash = bcrypt of "password123")
-- ============================================================
INSERT INTO users (username, email, first_name, last_name, password_hash, gender, age, fame_rating, is_online, latitude, longitude) VALUES
    ('alice',   'alice@test.com',   'Alice',   'Martin',  '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'female', 24, 80, true,  48.8566,  2.3522),   -- Paris
    ('bob',     'bob@test.com',     'Bob',     'Dupont',  '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'male',   27, 65, false, 48.8620,  2.3450),   -- Paris (nearby)
    ('carol',   'carol@test.com',   'Carol',   'Lemaire', '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'female', 22, 90, true,  48.8700,  2.3300),   -- Paris (nearby)
    ('dave',    'dave@test.com',    'Dave',    'Garcia',  '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'male',   31, 40, false, 45.7640,  4.8357),   -- Lyon (far)
    ('eve',     'eve@test.com',     'Eve',     'Bernard', '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'female', 26, 70, true,  43.2965,  5.3698),   -- Marseille (far)
    ('frank',   'frank@test.com',   'Frank',   'Moreau',  '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'male',   29, 55, false, 48.8550,  2.3500),   -- Paris (nearby)
    ('grace',   'grace@test.com',   'Grace',   'Simon',   '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'female', 23, 95, true,  48.8580,  2.3470);   -- Paris (nearby)

-- ============================================================
-- Tags
-- ============================================================
INSERT INTO tags (name) VALUES
    ('music'),
    ('sport'),
    ('cinema'),
    ('travel'),
    ('cooking'),
    ('gaming'),
    ('art');

-- ============================================================
-- User tags
-- ============================================================
INSERT INTO user_tags (user_id, tag_id) VALUES
    (1, 1), (1, 3), (1, 4),   -- alice: music, cinema, travel
    (2, 2), (2, 6),            -- bob: sport, gaming
    (3, 1), (3, 5), (3, 7),   -- carol: music, cooking, art
    (4, 2), (4, 3),            -- dave: sport, cinema
    (5, 4), (5, 5),            -- eve: travel, cooking
    (6, 6), (6, 1),            -- frank: gaming, music
    (7, 7), (7, 3), (7, 4);   -- grace: art, cinema, travel

-- ============================================================
-- Likes
-- ============================================================
INSERT INTO likes (liker_id, liked_id) VALUES
    (1, 2),   -- alice  → bob
    (1, 3),   -- alice  → carol
    (2, 1),   -- bob    → alice  (mutual match with alice)
    (3, 6),   -- carol  → frank
    (4, 1),   -- dave   → alice
    (7, 1);   -- grace  → alice

-- ============================================================
-- Views
-- ============================================================
INSERT INTO views (viewer_id, viewed_id) VALUES
    (1, 2),
    (1, 3),
    (2, 1),
    (3, 1),
    (4, 1),
    (5, 2),
    (6, 7);

-- ============================================================
-- Blocks
-- ============================================================
INSERT INTO blocks (blocker_id, blocked_id) VALUES
    (1, 5);   -- alice blocked eve (eve should not appear in alice's suggestions)

-- ============================================================
-- Search preferences for alice (user 1)
-- ============================================================
INSERT INTO user_search_preferences (user_id, min_age, max_age, min_fame_rating, max_fame_rating, location_radius_km, preferred_gender)
VALUES (1, 20, 35, 50, 100, 10, 'male');

-- alice prefers music and cinema tags
INSERT INTO user_search_preference_tags (preference_id, tag_id)
VALUES
    (1, 1),  -- music
    (1, 3);  -- cinema
