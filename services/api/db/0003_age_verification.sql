-- M6: identity review metadata; ID/selfie bytes are NEVER stored in SQL.
-- Image files live in an unbacked-up, private, AES-256-GCM encrypted directory.
CREATE TABLE IF NOT EXISTS age_verification_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending','verified','declined','expired')),
  id_file_key UUID,
  selfie_file_key UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  decline_reason TEXT,
  CHECK (status <> 'pending' OR (id_file_key IS NOT NULL AND selfie_file_key IS NOT NULL)),
  CHECK (status NOT IN ('verified','declined') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_age_review
  ON age_verification_cases(user_id) WHERE status IN ('draft','pending');
CREATE INDEX IF NOT EXISTS idx_verification_queue
  ON age_verification_cases(status, submitted_at) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_verification_expiry ON age_verification_cases(expires_at);

-- Final decisions are immutable: not even a second administrator can overwrite them.
CREATE OR REPLACE FUNCTION protect_final_age_reviews() RETURNS trigger AS $$
BEGIN
  IF OLD.status IN ('verified','declined','expired') THEN
    RAISE EXCEPTION 'Final age verification decisions cannot be changed'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS no_change_to_final_age_review ON age_verification_cases;
CREATE TRIGGER no_change_to_final_age_review BEFORE UPDATE ON age_verification_cases
  FOR EACH ROW EXECUTE FUNCTION protect_final_age_reviews();

CREATE TABLE IF NOT EXISTS admin_memberships (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','reviewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 5 AND 254),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES admin_memberships(user_id),
  role TEXT NOT NULL DEFAULT 'reviewer' CHECK (role='reviewer'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_invite_email ON admin_invitations(lower(email),expires_at);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_kind_check CHECK (
  kind IN ('request_accepted','request_declined','request_received','session_cancelled',
  'new_message','verification_submitted','verification_approved','verification_declined','verification_expired')
);
