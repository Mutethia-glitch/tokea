-- Tokea M5: server-side phone proof challenge, not identity or age verification.
-- Store only HMAC digests; never persist the plaintext phone number or OTP.
CREATE TABLE IF NOT EXISTS phone_otp_challenges (
  id UUID PRIMARY KEY,
  phone_hash CHAR(64) NOT NULL,
  requester_hash CHAR(64) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_phone_otp_phone_created ON phone_otp_challenges (phone_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_otp_requester_created ON phone_otp_challenges (requester_hash, created_at DESC);
