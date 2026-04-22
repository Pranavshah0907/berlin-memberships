-- =============================================================================
-- Berlin Memberships — Pending payment status
-- =============================================================================
-- Allows the payments table to hold rows for invoices that have been
-- finalized in Stripe but not yet settled (e.g. SEPA in-flight).
-- n8n writes these rows on invoice.finalized; the existing
-- invoice.payment_succeeded / _failed handlers upsert them to their
-- terminal state and set payment_date.
-- =============================================================================

ALTER TABLE payments DROP CONSTRAINT payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending','succeeded','failed','refunded'));

ALTER TABLE payments ALTER COLUMN payment_date DROP NOT NULL;
