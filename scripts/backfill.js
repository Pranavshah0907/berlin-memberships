#!/usr/bin/env node
/**
 * Berlin Memberships — one-time Stripe backfill
 *
 * Pulls all subscriptions + invoices from Stripe and seeds Supabase.
 * Read-only against Stripe. Safe to re-run (uses upsert).
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { Client } = require('pg');

const stripe = new Stripe(process.env.STRIPE_RESTRICTED_KEY);
const db = new Client({ connectionString: process.env.SUPABASE_DB_URL });

function classifyPlan(productName) {
  if (!productName) return null;
  const n = productName.toLowerCase();
  if (n.includes('premium')) return 'Premium';
  if (n.includes('plus'))    return 'Plus';
  if (n.includes('basic'))   return 'Basic';
  return null;
}

function statusFromStripe(sub) {
  if (sub.status === 'canceled') return 'canceled';
  if (sub.status === 'past_due' || sub.status === 'unpaid') return 'past_due';
  if (sub.cancel_at_period_end) return 'scheduled_to_cancel';
  if (sub.status === 'active' || sub.status === 'trialing') return 'active';
  return 'canceled';
}

const tsOrNull = (s) => (s ? new Date(s * 1000).toISOString() : null);

async function listAll(endpoint, params = {}) {
  const all = [];
  let starting_after;
  for (;;) {
    const page = await endpoint({ limit: 100, ...params, starting_after });
    all.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1].id;
  }
  return all;
}

async function main() {
  console.log('Connecting to Supabase...');
  await db.connect();

  console.log('Fetching products from Stripe...');
  const products = await listAll((p) => stripe.products.list(p));
  const productToPlan = {};
  products.forEach((p) => {
    const plan = classifyPlan(p.name);
    if (plan) productToPlan[p.id] = plan;
  });
  console.log(`  ${Object.keys(productToPlan).length} membership products mapped.`);

  console.log('Fetching all subscriptions...');
  const subs = await listAll(
    (p) => stripe.subscriptions.list(p),
    { status: 'all', expand: ['data.customer'] }
  );
  console.log(`  ${subs.length} subscriptions found.`);

  let memberUpserts = 0;
  const membershipSubs = [];

  for (const sub of subs) {
    const price = sub.items.data[0]?.price;
    const productId = typeof price?.product === 'string' ? price.product : price?.product?.id;
    const plan = productToPlan[productId];
    if (!plan) continue;

    const cust = sub.customer;
    const addr = cust.address || {};
    const monthly = price.unit_amount / 100;

    await db.query(
      `INSERT INTO members (
         customer_id, subscription_id, name, email, phone,
         plan, monthly_amount, currency, status,
         start_date, cancel_at, canceled_at, city, country
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (customer_id) DO UPDATE SET
         subscription_id = EXCLUDED.subscription_id,
         name            = EXCLUDED.name,
         email           = EXCLUDED.email,
         phone           = EXCLUDED.phone,
         plan            = EXCLUDED.plan,
         monthly_amount  = EXCLUDED.monthly_amount,
         currency        = EXCLUDED.currency,
         status          = EXCLUDED.status,
         start_date      = EXCLUDED.start_date,
         cancel_at       = EXCLUDED.cancel_at,
         canceled_at     = EXCLUDED.canceled_at,
         city            = EXCLUDED.city,
         country         = EXCLUDED.country`,
      [
        cust.id,
        sub.id,
        cust.name,
        cust.email,
        cust.phone,
        plan,
        monthly,
        price.currency.toUpperCase(),
        statusFromStripe(sub),
        tsOrNull(sub.start_date || sub.created),
        tsOrNull(sub.cancel_at),
        tsOrNull(sub.canceled_at),
        addr.city,
        addr.country,
      ]
    );
    memberUpserts++;
    membershipSubs.push(sub);
  }
  console.log(`  ${memberUpserts} members inserted/updated.`);

  console.log('Fetching invoices for membership subscriptions...');
  let invoiceUpserts = 0;
  for (const sub of membershipSubs) {
    const invoices = await listAll(
      (p) => stripe.invoices.list(p),
      { subscription: sub.id, expand: ['data.charge'] }
    );
    for (const inv of invoices) {
      const charge = inv.charge && typeof inv.charge === 'object' ? inv.charge : null;
      const refundedAmount = charge?.amount_refunded ? charge.amount_refunded / 100 : 0;
      let status;
      if (inv.status === 'paid' && refundedAmount > 0) status = 'refunded';
      else if (inv.status === 'paid') status = 'succeeded';
      else if (inv.status === 'uncollectible' || inv.status === 'void') status = 'failed';
      else if (inv.attempt_count > 0 && inv.status === 'open') status = 'failed';
      else if (inv.status === 'open') continue; // not yet attempted, skip
      else status = 'failed';

      const paymentDate =
        inv.status_transitions?.paid_at ||
        inv.status_transitions?.finalized_at ||
        inv.created;

      const line = inv.lines?.data?.[0];
      await db.query(
        `INSERT INTO payments (
           invoice_id, customer_id, subscription_id,
           amount, currency, status, payment_date,
           period_start, period_end, refunded_amount, failure_reason
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (invoice_id) DO UPDATE SET
           status           = EXCLUDED.status,
           refunded_amount  = EXCLUDED.refunded_amount,
           failure_reason   = EXCLUDED.failure_reason,
           payment_date     = EXCLUDED.payment_date`,
        [
          inv.id,
          typeof inv.customer === 'string' ? inv.customer : inv.customer?.id,
          sub.id,
          inv.amount_paid ? inv.amount_paid / 100 : inv.amount_due / 100,
          (inv.currency || 'eur').toUpperCase(),
          status,
          tsOrNull(paymentDate),
          tsOrNull(line?.period?.start),
          tsOrNull(line?.period?.end),
          refundedAmount,
          charge?.failure_message || null,
        ]
      );
      invoiceUpserts++;
    }
  }
  console.log(`  ${invoiceUpserts} payments inserted/updated.`);

  console.log('\nSummary from Supabase:');
  const { rows: mrr } = await db.query('SELECT * FROM v_current_mrr');
  console.log('  MRR view:', mrr[0]);
  const { rows: plans } = await db.query('SELECT * FROM v_plan_stats ORDER BY plan');
  plans.forEach((p) => console.log('  Plan:', p));
  const { rows: totals } = await db.query(
    "SELECT status, COUNT(*)::int AS count, SUM(amount - refunded_amount)::numeric AS net FROM payments GROUP BY status"
  );
  console.log('  Payments by status:', totals);

  await db.end();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
