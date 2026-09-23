ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS conversation_url TEXT;
