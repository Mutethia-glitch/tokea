-- Avoid old avatar image fallbacks and make replacement cleanup crash-safe.
CREATE TABLE IF NOT EXISTS profile_photo_deletions (
  file_key UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempts INTEGER NOT NULL DEFAULT 0
);
