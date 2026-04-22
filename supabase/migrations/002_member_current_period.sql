-- =============================================================================
-- Berlin Memberships — Member current billing period
-- =============================================================================
-- Adds a view that joins members with their most recent payment's
-- period_start / period_end so the Members table can show the active
-- billing cycle ("03 Apr → 02 May") instead of the static "Since" date.
-- =============================================================================

CREATE OR REPLACE VIEW v_members_with_period AS
SELECT
  m.*,
  p.period_start AS current_period_start,
  p.period_end   AS current_period_end
FROM members m
LEFT JOIN LATERAL (
  SELECT period_start, period_end
  FROM payments
  WHERE customer_id = m.customer_id
    AND period_start IS NOT NULL
  ORDER BY period_start DESC
  LIMIT 1
) p ON TRUE;
