# Secrets Setup Guide

Fill in `.env.local` by collecting these values. Order matters — do Supabase first, then Stripe.

---

## 1. Supabase (5 minutes)

1. Go to https://supabase.com and sign in (or sign up — free).
2. Click **New project**.
3. Fill in:
   - **Name**: `berlin-memberships`
   - **Database password**: generate a strong one and **save it** — you'll need it for `SUPABASE_DB_URL`.
   - **Region**: `Central EU (Frankfurt)`
   - **Plan**: Free
4. Wait ~2 minutes for the project to spin up.
5. Once ready, grab these 4 values:

| Env var | Where to find it |
|---|---|
| `SUPABASE_URL` | Project Settings → **Data API** → Project URL |
| `SUPABASE_ANON_KEY` | Project Settings → **Data API** → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → **Data API** → Project API keys → `service_role` (click "Reveal") |
| `SUPABASE_DB_URL` | Project Settings → **Database** → Connection string → **URI** tab. Replace `[YOUR-PASSWORD]` with the DB password from step 3. |

> ⚠️ `service_role` key bypasses all security. Never paste it into browser code or commit it.

---

## 2. Stripe Restricted Key (2 minutes)

Only needed for the one-time backfill of your 13 existing subscribers.

1. Go to https://dashboard.stripe.com/apikeys
2. Make sure you're in **Live mode** (toggle top-right), not Test mode.
3. Scroll to **Restricted keys** → click **Create restricted key**.
4. Name it: `berlin-memberships-backfill`
5. Set these permissions to **Read**:
   - Core → Customers
   - Core → Charges
   - Checkout → Checkout Sessions
   - Billing → Subscriptions
   - Billing → Invoices
6. Leave everything else as **None**.
7. Click **Create key**, then reveal and copy the `rk_live_...` key.
8. Paste into `STRIPE_RESTRICTED_KEY` in `.env.local`.

---

## 3. NextAuth Secret (10 seconds)

Only if we use the simple username/password fallback. Generate a random string:

- Mac/Linux/Git Bash: `openssl rand -base64 32`
- Or use: https://generate-secret.vercel.app/32

Paste into `NEXTAUTH_SECRET`.

---

## 4. Admin Users

Two options — pick one and tell me which:

**Option A — Supabase Auth (recommended)**
Skip `ADMIN_USERNAME` / `ADMIN_PASSWORD`. After Supabase project is created, go to **Authentication → Users → Add user** and create accounts for each admin. Easy to add more users later without redeploying.

**Option B — Single shared password**
Fill in `ADMIN_USERNAME` and `ADMIN_PASSWORD`. One login for everyone. Simpler but less flexible.

---

## When you're done

Paste the filled `.env.local` back to me (or just the values) and I'll:
1. Create Supabase tables
2. Write the backfill script (we'll run it together so you see the 13 members populate)
3. Update the n8n workflow
4. Build the dashboard
