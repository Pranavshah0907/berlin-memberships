# Guidance for Claude working on this project

## What this is
Subscription tracking dashboard for **Art of Living Berlin Yoga Oase**. Live at `https://berlin.lp-artofliving.org/mship` (custom domain) and `https://berlin-memberships.vercel.app/mship` (Vercel alias).

## Stack
- Next.js 16 (App Router, TypeScript, Tailwind) with `basePath: "/mship"` — **don't remove the basePath**
- Supabase (Postgres + Auth) — tables: `members`, `payments`; views: `v_current_mrr`, `v_revenue_by_month`, `v_plan_stats`, `v_member_growth`
- n8n (self-hosted on Hostinger) handles Stripe webhook ingestion
- Hosted on Vercel, DNS via GoDaddy

## Data model quirks (read before touching Supabase)
- `payments.customer_id` has **no foreign key** to `members` — it was dropped so manual/standalone invoices don't 409. Don't re-add it.
- "Invoice date" in the UI = `payments.period_start`. "Settled date" = `payments.payment_date`. They differ by ~9–12 days for SEPA. All sorting, filtering, and revenue aggregation uses `period_start`. Keep it that way.
- Plan is one of three strings: `Premium`, `Plus`, `Basic`. Check by product name containing those words — Stripe has a duplicated "(Copy) Basic" product from before my time.

## Local dev
```bash
npm install
npm run dev          # http://localhost:3000/mship
```
`.env.local` has everything — never commit it. The file `.env.example` shows the shape.

## Deploying
If Vercel's GitHub app is connected to the repo, just `git push` and it auto-deploys. If not (still unconnected as of last session), run:
```bash
vercel --prod --yes --token "$VERCEL_TOKEN"
```
The CLI is installed globally. Token lives in `.env.local`.

## n8n workflow
The active workflow is `BerlinAOL_Membership_Sync` (id `gKkcUqapaSK3kctf`) on `https://n8n.srv1081444.hstgr.cloud`. It handles 6 Stripe events and upserts into Supabase via PostgREST + service_role key. The JSON under `n8n/BerlinAOL_Membership_Sync.json` is gitignored because it has the Supabase secret inlined. Regenerate with `scripts/deploy_n8n.js` if you need to re-deploy.

## One-off scripts
- `scripts/backfill.js` — already run; pulls Stripe history into Supabase. Don't re-run unless you truly want to wipe and reload.
- `scripts/create_admin.js` — creates a Supabase Auth user; reads `ADMIN_EMAIL` + `ADMIN_PASSWORD` from env.
- `scripts/deploy_n8n.js` — pushes the n8n workflow JSON via n8n API.

## Things to preserve
- basePath `/mship`
- Roman numerals (I/II/III/IV) in the sidebar nav only — not elsewhere
- Login eyebrow reads "Volume 1 · 2026"
- "Automated via LEAP" footer has been removed from the login page — keep it removed
- Revenue + invoice date both grouped by `period_start`

## Design
Fraunces serif for display numbers/titles, DM Sans body, DM Mono for dates/amounts, paper background `#FBF8F3`, sunrise accents. See Tailwind config. Keep copy plain — literary flourishes get rejected.

## Admin accounts
See Supabase Auth Users. Current: `pranavshah0907@gmail.com`, `c.koellner@artofliving.de`. Add more via the script above, not hardcoded.
