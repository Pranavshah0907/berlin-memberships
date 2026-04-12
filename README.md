# Berlin Memberships

Subscription tracking dashboard for Art of Living Berlin Yoga Oase.

**Production:** `https://berlin.lp-artofliving.org/mship`

## Stack

- **Frontend:** Next.js 15 (App Router) · TypeScript · Tailwind · Supabase Auth
- **Database:** Supabase (Postgres) — `members`, `payments`, analytics views
- **Automation:** n8n (self-hosted) — Stripe webhook → Supabase + email
- **Deploy:** Vercel · DNS via GoDaddy API

## Data flow

```
Stripe events
    ↓
n8n workflow   (handles 6 event types, upserts are idempotent)
    ↓
Supabase       (members + payments tables + analytics views)
    ↓
Next.js        (server-rendered dashboard, Supabase Auth)
```

## Local development

```bash
cp .env.example .env.local   # fill in real values
npm install
npm run dev                   # http://localhost:3000/mship
```

## Scripts

| Script | Purpose |
|---|---|
| `scripts/backfill.js` | One-time: pull existing customers/invoices from Stripe into Supabase |
| `scripts/create_admin.js` | Create a Supabase Auth admin user |
| `scripts/deploy_n8n.js` | Push the n8n workflow to the self-hosted instance |

## Structure

```
app/
  (app)/           auth-gated dashboard pages (Overview, Members, Payments, Churn)
  login/           Supabase Auth login
components/        UI building blocks + charts
lib/               Supabase clients (server + browser) and data helpers
middleware.ts      Redirects unauthenticated requests to /login
supabase/
  migrations/      SQL schema (tables + views)
scripts/           One-off Node scripts (backfill, admin creation, deploy)
n8n/               Workflow README (JSON exports are gitignored — contain secrets)
```

## Notes

- `/mship` is baked into `next.config.ts` as `basePath`.
- Foreign key from `payments.customer_id` was dropped so manual/standalone invoices don't 409.
- Revenue is grouped by **invoice date** (`period_start`), not settlement date.
