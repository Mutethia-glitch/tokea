-- Encrypted images must be cleared even if the API process exits mid-review.
-- Deletion jobs persist after review metadata has been finalized.
CREATE TABLE IF NOT EXISTS verification_photo_deletions (
  file_key UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_verification_photos_to_delete
  ON verification_photo_deletions(created_at) WHERE deleted_at IS NULL;
