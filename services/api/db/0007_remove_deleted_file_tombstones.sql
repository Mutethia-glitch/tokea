-- Delete historical successfully processed photo file references from prior queue versions.
-- Keep failed jobs with file keys intact until their encrypted bytes can actually be deleted.
DELETE FROM verification_photo_deletions WHERE deleted_at IS NOT NULL;
