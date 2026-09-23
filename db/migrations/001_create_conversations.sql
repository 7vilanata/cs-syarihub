CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE last_message_sender AS ENUM ('customer', 'cs', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE conversation_stage AS ENUM ('new', 'interested', 'considering', 'ready_to_pay');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE conversation_blocker AS ENUM ('none', 'price', 'schedule', 'payment_method', 'needs_more_information', 'needs_approval', 'trust', 'unresponsive', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE conversation_priority AS ENUM ('urgent', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE conversation_status AS ENUM ('pending', 'actioned', 'converted', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL UNIQUE,
  conversation_url TEXT NOT NULL,
  contact_name TEXT,
  last_message_at TIMESTAMPTZ NOT NULL,
  last_message_sender last_message_sender NOT NULL,
  summary TEXT NOT NULL,
  stage conversation_stage NOT NULL,
  blocker conversation_blocker NOT NULL DEFAULT 'none',
  priority conversation_priority NOT NULL,
  next_action TEXT NOT NULL,
  status conversation_status NOT NULL DEFAULT 'pending',
  analyzed_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS conversations_work_queue_idx
  ON conversations (status, priority, last_message_at DESC);
