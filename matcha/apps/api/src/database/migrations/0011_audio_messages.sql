-- Add support for audio chat messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text',
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_mime TEXT,
ADD COLUMN IF NOT EXISTS media_duration_sec INTEGER,
ADD COLUMN IF NOT EXISTS media_size_bytes INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'messages_message_type_check'
    ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT messages_message_type_check
        CHECK (message_type IN ('text', 'audio'));
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_messages_message_type
ON messages(message_type);
