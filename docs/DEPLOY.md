# Glitter Hits — Full public launch / Deploy

## Production gate (do not skip)

- [ ] Strong `AUTH_SECRET` (`openssl rand -base64 32`)
- [ ] `AUTH_URL` + `NEXT_PUBLIC_APP_URL` = production domain
- [ ] Postgres `DATABASE_URL` (Neon / Vercel Postgres)
- [ ] `RESEND_API_KEY` + verified `EMAIL_FROM` (password reset + contact)
- [ ] `CRON_SECRET` set; Vercel Cron can call `/api/cron/weekly`
- [ ] Cloudflare Turnstile: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (then set `REQUIRE_TURNSTILE=true`)
- [ ] Do **not** set `ALLOW_INSECURE_AUTH` or `MODERATION_AUTO_APPROVE` in production
- [ ] Seed once with `SEED_MODE=production`, strong `SEED_ADMIN_PASSWORD`, **no** `ALLOW_DEMO_SEED`
- [ ] Rotate founder password after first login
- [ ] Counsel review of `/terms` and `/privacy` (launch drafts are in-repo)
- [ ] Smoke: signup → surf → earn → campaign → moderation queue → reset email
- [ ] Confirm Contact form stores messages and emails support

## Env reference

| Variable | Required in prod | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres |
| `AUTH_SECRET` | yes | Session signing |
| `AUTH_URL` / `NEXT_PUBLIC_APP_URL` | yes | Canonical URL |
| `RESEND_API_KEY` | yes | Transactional email |
| `EMAIL_FROM` | recommended | From address |
| `SUPPORT_EMAIL` | recommended | Contact inbox |
| `CRON_SECRET` | yes | Cron authorization |
| `TURNSTILE_*` | yes | Bot protection |
| `MODERATION_AUTO_APPROVE` | no (leave unset) | Dev-only auto-approve |
| `ALLOW_DEMO_SEED` | no (leave unset) | Seeds demo users locally |
| `SEED_ADMIN_PASSWORD` | yes when seeding prod | Founder bootstrap |

## Local

```bash
cp .env.example .env
# ALLOW_DEMO_SEED=true and MODERATION_AUTO_APPROVE=true are fine locally
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Production DB + seed

```bash
# prisma/schema.prisma provider = postgresql
npx prisma db push
SEED_MODE=production \
SEED_ADMIN_EMAIL="you@domain" \
SEED_ADMIN_PASSWORD="<strong-12+-chars>" \
npx tsx prisma/seed.ts
```

Demo accounts (`demo@…`, network fillers) are **not** created unless `ALLOW_DEMO_SEED=true`.
Re-seeding does **not** overwrite the founder password unless `SEED_RESET_ADMIN_PASSWORD=true`.

## Vercel

1. Import repo / link project
2. Set all production env vars above
3. Build: `prisma generate && next build` (`npm run build`)
4. After first deploy, run production seed once (CLI or one-off)
5. Confirm `vercel.json` cron + `CRON_SECRET`

## Smoke

```bash
npm run test
npm run typecheck
npm run build
ALLOW_DEMO_SEED=true npm run db:seed   # local only
npm run smoke
```

## Security defaults at launch

- Password reset emails via Resend; reset URLs never returned in production responses
- New websites queue for human moderation by default
- Surf session API forces `human_exchange` (clients cannot self-select `automated_viewer`)
- Security headers: HSTS, nosniff, frame options, referrer policy
- Signup / reset / contact: Turnstile + honeypot + rate limits
