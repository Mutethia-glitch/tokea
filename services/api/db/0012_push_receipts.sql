-- Expo tickets are submission receipts, not proof of phone notification display.
ALTER TABLE push_deliveries ADD COLUMN IF NOT EXISTS receipt_status TEXT NOT NULL DEFAULT 'unchecked'
  CHECK(receipt_status IN ('unchecked','accepted','error','expired'));
ALTER TABLE push_deliveries ADD COLUMN IF NOT EXISTS receipt_checked_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_push_receipt_pending
  ON push_deliveries(updated_at) WHERE status='sent' AND ticket_id IS NOT NULL
    AND receipt_status='unchecked';
