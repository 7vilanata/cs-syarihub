ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE conversations
SET created_at = last_message_at
WHERE created_at IS NULL;

ALTER TABLE conversations
  ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS conversations_created_at_idx
  ON conversations (created_at DESC);
