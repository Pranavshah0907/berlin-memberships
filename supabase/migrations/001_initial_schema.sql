-- =============================================================================
-- Berlin Memberships — Initial Schema
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MEMBERS
-- -----------------------------------------------------------------------------
CREATE TABLE members (
  customer_id          TEXT PRIMARY KEY,
  subscription_id      TEXT UNIQUE,
  name                 TEXT,
  email                TEXT,
  phone                TEXT,
  plan                 TEXT CHECK (plan IN ('Premium', 'Plus', 'Basic')),
  monthly_amount       NUMERIC(10,2),
  currency             TEXT NOT NULL DEFAULT 'EUR',
  status               TEXT NOT NULL CHECK (status IN
                         ('active','past_due','scheduled_to_cancel','canceled')),
  start_date           TIMESTAMPTZ NOT NULL,
  cancel_at            TIMESTAMPTZ,
  canceled_at          TIMESTAMPTZ,
  city                 TEXT,
  country              TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_plan   ON members(plan);
CREATE INDEX idx_members_email  ON members(email);

-- -----------------------------------------------------------------------------
-- PAYMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
  invoice_id           TEXT PRIMARY KEY,
  customer_id          TEXT REFERENCES members(customer_id) ON DELETE SET NULL,
  subscription_id      TEXT,
  amount               NUMERIC(10,2) NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'EUR',
  status               TEXT NOT NULL CHECK (status IN ('succeeded','failed','refunded')),
  payment_date         TIMESTAMPTZ NOT NULL,
  period_start         TIMESTAMPTZ,
  period_end           TIMESTAMPTZ,
  refunded_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  failure_reason       TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date     ON payments(payment_date DESC);
CREATE INDEX idx_payments_status   ON payments(status);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- VIEWS (analytics helpers)
-- -----------------------------------------------------------------------------

-- Current MRR snapshot
CREATE VIEW v_current_mrr AS
SELECT
  COALESCE(SUM(monthly_amount), 0)                                  AS mrr,
  COALESCE(SUM(monthly_amount) * 12, 0)                             AS arr,
  COUNT(*) FILTER (WHERE status = 'active')                         AS active,
  COUNT(*) FILTER (WHERE status = 'past_due')                       AS past_due,
  COUNT(*) FILTER (WHERE status = 'scheduled_to_cancel')            AS scheduled_to_cancel,
  COUNT(*) FILTER (WHERE status = 'canceled')                       AS canceled
FROM members
WHERE status IN ('active','past_due','scheduled_to_cancel');

-- Revenue + payment counts by month
CREATE VIEW v_revenue_by_month AS
SELECT
  DATE_TRUNC('month', payment_date)                                      AS month,
  COALESCE(SUM(amount - refunded_amount)
           FILTER (WHERE status IN ('succeeded','refunded')), 0)          AS revenue,
  COUNT(*) FILTER (WHERE status = 'succeeded')                            AS succeeded_count,
  COUNT(*) FILTER (WHERE status = 'failed')                               AS failed_count,
  COUNT(*) FILTER (WHERE status = 'refunded')                             AS refunded_count,
  COALESCE(SUM(refunded_amount), 0)                                       AS refunded_amount
FROM payments
GROUP BY 1
ORDER BY 1 DESC;

-- Per-plan breakdown
CREATE VIEW v_plan_stats AS
SELECT
  plan,
  COUNT(*) FILTER (WHERE status = 'active')                               AS active,
  COUNT(*) FILTER (WHERE status = 'past_due')                             AS past_due,
  COUNT(*) FILTER (WHERE status = 'scheduled_to_cancel')                  AS scheduled_to_cancel,
  COUNT(*) FILTER (WHERE status = 'canceled')                             AS canceled,
  COALESCE(SUM(monthly_amount)
           FILTER (WHERE status IN ('active','past_due','scheduled_to_cancel')), 0) AS plan_mrr
FROM members
GROUP BY plan;

-- Member growth by month (signups and churn)
CREATE VIEW v_member_growth AS
WITH signups AS (
  SELECT DATE_TRUNC('month', start_date)  AS month, COUNT(*) AS new_members
  FROM members
  GROUP BY 1
),
churn AS (
  SELECT DATE_TRUNC('month', canceled_at) AS month, COUNT(*) AS churned
  FROM members
  WHERE canceled_at IS NOT NULL
  GROUP BY 1
)
SELECT
  COALESCE(s.month, c.month)         AS month,
  COALESCE(s.new_members, 0)         AS new_members,
  COALESCE(c.churned, 0)             AS churned,
  COALESCE(s.new_members, 0) - COALESCE(c.churned, 0) AS net_growth
FROM signups s
FULL OUTER JOIN churn c ON s.month = c.month
ORDER BY 1 DESC;
