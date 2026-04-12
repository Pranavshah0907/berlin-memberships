# n8n Workflow Setup

Import [`BerlinAOL_Membership_Sync.json`](BerlinAOL_Membership_Sync.json) into your n8n instance at `https://n8n.srv1081444.hstgr.cloud`.

## 1. Create n8n Variables (one-time)

The workflow uses two n8n **Variables** (Settings → Variables). Create both:

| Key | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL (from `.env.local` `NEXT_PUBLIC_SUPABASE_URL`) |
| `SUPABASE_KEY` | Your Supabase **service_role** secret (`sb_secret_...`, from `.env.local`) |

> If Variables aren't available on your plan/version, edit each HTTP node and paste values directly into the `apikey` / `Authorization` header fields.

## 2. Import the workflow

- n8n → Workflows → **Import from File** → select `BerlinAOL_Membership_Sync.json`.
- After import, open each node type below and re-select the credential (IDs won't match across instances):
  - **Stripe Trigger** → `StripeNode_AoL_MainAccount`
  - All **Email:** nodes → `seervice.leapautomation` (Gmail OAuth2)

## 3. Stripe webhook

The trigger uses the same webhook ID as your old workflow (`c54888ad-ea67-4fad-b151-60ca7f39a928`), so it will re-register with Stripe automatically when activated. Stripe dashboard → Developers → Webhooks — verify it listens to all 6 events:

- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`

## 4. Disable the old workflow

Before activating this one, **deactivate** `BerlinAOL_Membership_PaymentMailing` — otherwise both will process the same events and you'll get duplicate emails + duplicate DB writes (the DB writes are idempotent via upsert, but emails aren't).

## 5. Test

Use Stripe Dashboard → Developers → Webhooks → your endpoint → **Send test webhook** → pick `checkout.session.completed`. Watch n8n executions — should see a green run through `Route by Event → Build Signup Payload → Is Membership Plan? (false, because test plink won't match) → stops`. That's expected. For a real end-to-end test, subscribe with a €0 coupon or real test plan.

## Flow overview

```
Stripe Trigger (6 events)
    └─ Route by Event (switch on $json.type)
         ├─ checkout.session.completed → Upsert member → Insert payment → Email
         ├─ invoice.payment_succeeded  → Upsert payment → Set active → Email
         ├─ invoice.payment_failed     → Upsert payment → Set past_due → Email
         ├─ subscription.updated       → (if cancel_at_period_end flipped) → scheduled_to_cancel → Email
         ├─ subscription.deleted       → Set canceled → Email
         └─ charge.refunded            → Mark payment refunded → Email
```

All Supabase writes use `Prefer: resolution=merge-duplicates` so retries from Stripe are safe.
