# Stripe setup (Glitter Hits) — acct_1Rqj95AZwvXaTN33 (Portia Allen)

## Wired in Stripe Dashboard

### Test mode
- Webhook `we_1U4YVSAZwvXaTN330NWuncKj` → `https://glitterhits.online/api/webhooks/stripe`
- Catalog: Starter / Boost / Launch / Empire packs + Plus / Premium / VIP memberships
- Price IDs: see `src/lib/stripe/price-ids.ts` (`STRIPE_TEST_PRICE_IDS`)

### Live mode
- Webhook `we_1U4YW4AZwvXaTN337lEZBDKa` → `https://glitterhits.online/api/webhooks/stripe`
- Same catalog created in live mode (`STRIPE_LIVE_PRICE_IDS`)

Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`

## App wiring

- Credit packs → Checkout `mode: payment` → ledger `purchase`
- Memberships → Checkout `mode: subscription` → `User.membership`
- Webhook route: `POST /api/webhooks/stripe`
- Success fallback: `/store/success`

## Env vars still needed in Vercel

From [API keys](https://dashboard.stripe.com/acct_1Rqj95AZwvXaTN33/apikeys):

- `STRIPE_SECRET_KEY` (prefer restricted `rk_test_` / `rk_live_`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Webhook signing secrets (from endpoint create — also in Dashboard → Webhooks → Reveal):

- Test: set `STRIPE_WEBHOOK_SECRET` to the **test** endpoint secret
- Live / production: set `STRIPE_WEBHOOK_SECRET` to the **live** endpoint secret

Price IDs are optional if using the baked-in defaults in `price-ids.ts`; env overrides still work.

## Local webhook forwarding (optional)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
