-- Persistent public-in-app profile photos, separate from 24h identity documents.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_file_key UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ;
