ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;
