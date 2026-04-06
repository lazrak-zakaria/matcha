ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS actor_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_actor_id_fkey'
      AND table_name = 'notifications'
  ) THEN
    ALTER TABLE notifications
    ADD CONSTRAINT notifications_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_actor
ON notifications(actor_id);