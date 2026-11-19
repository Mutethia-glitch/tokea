-- Kenya phone sign-in. A verified SMS number is NOT age verification.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_e164 TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_phone ON users(phone_e164);
CREATE TABLE IF NOT EXISTS phone_login_codes (
  phone_e164 TEXT PRIMARY KEY,
  code_hmac TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hourly_window TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hourly_count SMALLINT NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS phone_refresh_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phone_sessions_expiry ON phone_refresh_sessions(expires_at);
