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
    images,
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
    ('grace',   'grace@test.com',   'Grace',   'Simon',   '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'female', 23, 95, true,  48.8580,  2.3470),   -- Paris (nearby)
    ('hugo',    'hugo@test.com',    'Hugo',    'Petit',   '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'male',   28, 75, true,  48.8420,  2.3310),   -- Paris
    ('irene',   'irene@test.com',   'Irene',   'Laurent', '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'female', 25, 88, false, 48.8400,  2.3600),   -- Paris
    ('julien',  'julien@test.com',  'Julien',  'Roux',    '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'male',   30, 60, false, 47.2184, -1.5536),   -- Nantes
    ('lea',     'lea@test.com',     'Lea',     'Dubois',  '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'female', 21, 92, true,  48.8660,  2.3200),   -- Paris
    ('mateo',   'mateo@test.com',   'Mateo',   'Henry',   '$2b$12$cVh9Kwe.93E2Ioe47hAi0ebjVX2lNrE2OGuD3kyIb6WQbhNIYVxF.', 'male',   32, 50, false, 50.6292,  3.0573);   -- Lille

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
    ('art'),
    ('hiking'),
    ('photography'),
    ('books'),
    ('yoga'),
    ('design'),
    ('coding'),
    ('dancing');

-- ============================================================
-- User tags
-- ============================================================
INSERT INTO user_tags (user_id, tag_id) VALUES
    (1, 1), (1, 4), (1, 9),
    (2, 2), (2, 6), (2, 13),
    (3, 3), (3, 7), (3, 12),
    (4, 4), (4, 8), (4, 10),
    (5, 5), (5, 11), (5, 14),
    (6, 1), (6, 3), (6, 12),
    (7, 2), (7, 7), (7, 8),
    (8, 4), (8, 9), (8, 13),
    (9, 5), (9, 10), (9, 11),
    (10, 6), (10, 12), (10, 14),
    (11, 1), (11, 8), (11, 9),
    (12, 2), (12, 4), (12, 13);

-- ============================================================
-- Images
-- ============================================================
INSERT INTO images (user_id, url, is_avatar) VALUES
    (1,  '/public/images/am.jpg', true),
    (1,  '/public/images/am.jpg', false),
    (1,  '/public/images/am.jpg', false),
    (2,  '/public/images/am.jpg', true),
    (2,  '/public/images/am.jpg', false),
    (2,  '/public/images/am.jpg', false),
    (3,  '/public/images/am.jpg', true),
    (3,  '/public/images/am.jpg', false),
    (3,  '/public/images/am.jpg', false),
    (4,  '/public/images/am.jpg', true),
    (4,  '/public/images/am.jpg', false),
    (4,  '/public/images/am.jpg', false),
    (5,  '/public/images/am.jpg', true),
    (5,  '/public/images/am.jpg', false),
    (5,  '/public/images/am.jpg', false),
    (6,  '/public/images/am.jpg', true),
    (6,  '/public/images/am.jpg', false),
    (6,  '/public/images/am.jpg', false),
    (7,  '/public/images/am.jpg', true),
    (7,  '/public/images/am.jpg', false),
    (7,  '/public/images/am.jpg', false),
    (8,  '/public/images/am.jpg', true),
    (8,  '/public/images/am.jpg', false),
    (8,  '/public/images/am.jpg', false),
    (9,  '/public/images/am.jpg', true),
    (9,  '/public/images/am.jpg', false),
    (9,  '/public/images/am.jpg', false),
    (10, '/public/images/am.jpg', true),
    (10, '/public/images/am.jpg', false),
    (10, '/public/images/am.jpg', false),
    (11, '/public/images/am.jpg', true),
    (11, '/public/images/am.jpg', false),
    (11, '/public/images/am.jpg', false),
    (12, '/public/images/am.jpg', true),
    (12, '/public/images/am.jpg', false),
    (12, '/public/images/am.jpg', false);

