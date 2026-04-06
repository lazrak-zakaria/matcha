-- Add read tracking for chat messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Helpful index for unread count/read updates
CREATE INDEX IF NOT EXISTS idx_messages_unread_by_conversation
ON messages(conversation_id, sender_id, read_at);