# Stripe setup (Glitter Hits)

## What is wired

- Credit packs → Stripe Checkout (`mode: payment`) → ledger type `purchase`
- Memberships → Stripe Checkout (`mode: subscription`) → `User.membership`
- Webhook: `POST /api/webhooks/stripe`
- Success fallback: `/store/success` (fulfills if webhook delayed)

## Env vars

See `.env.example`. Required:

- `STRIPE_SECRET_KEY` (prefer restricted `rk_` in production)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PACK_*` and `STRIPE_PRICE_MEMBERSHIP_*` (or pack `stripePriceId` in DB)

## Local webhook forwarding

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

## Production

1. Claim / move to your real Stripe account (or create live prices)
2. Add webhook endpoint: `https://glitterhits.online/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Enable Admin monetization toggles: `credit_purchases`, `premium_memberships`
5. Switch to live keys only after domain + Terms review

## Sandbox note

If an agent created a temporary Stripe sandbox, claim it from the Dashboard before it expires, or recreate products/prices in your own account and update the Price IDs in Vercel env.
