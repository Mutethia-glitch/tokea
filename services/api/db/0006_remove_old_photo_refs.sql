-- Discard old photo UUID references from completed/expired reviews in older code.
-- Keep the irreversible review decision and reviewer metadata, not the file identifiers.
-- This is an administrative migration, run with a trusted database migration role.
BEGIN;
INSERT INTO verification_photo_deletions(file_key)
  SELECT id_file_key FROM age_verification_cases
  WHERE status IN ('verified','declined','expired') AND id_file_key IS NOT NULL
  UNION SELECT selfie_file_key FROM age_verification_cases
  WHERE status IN ('verified','declined','expired') AND selfie_file_key IS NOT NULL
ON CONFLICT(file_key) DO NOTHING;
ALTER TABLE age_verification_cases DISABLE TRIGGER no_change_to_final_age_review;
UPDATE age_verification_cases SET id_file_key=NULL,selfie_file_key=NULL
  WHERE status IN ('verified','declined','expired')
  AND (id_file_key IS NOT NULL OR selfie_file_key IS NOT NULL);
ALTER TABLE age_verification_cases ENABLE TRIGGER no_change_to_final_age_review;
COMMIT;
