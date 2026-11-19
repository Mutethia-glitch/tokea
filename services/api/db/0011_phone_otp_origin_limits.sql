-- Limit OTP SMS sends by origin hash as well as the phone number.
-- Store only a keyed HMAC of the source address, never its raw IP.
CREATE TABLE IF NOT EXISTS phone_otp_origin_limits (
  origin_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count SMALLINT NOT NULL DEFAULT 1
);
