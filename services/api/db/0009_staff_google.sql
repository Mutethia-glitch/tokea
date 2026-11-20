-- Google OIDC identities are tied to an email address verified by Google.
-- Owner approval is bootstrapped locally; reviewer access requires an accepted invitation.
CREATE TABLE IF NOT EXISTS staff_google_identities (
  email TEXT PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  google_subject TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
