-- Consent is required and recorded before receiving either photo.
ALTER TABLE age_verification_cases ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
