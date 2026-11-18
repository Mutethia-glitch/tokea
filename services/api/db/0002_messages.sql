-- Tokea local-only API migration: messages and indexes.
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL CHECK (length(trim(message_text)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_session_messages_history
  ON session_messages(session_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_join_requests_applicant
  ON join_requests(applicant_user_id, created_at DESC);
