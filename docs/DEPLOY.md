# Glitter Hits — Launch / Deploy

## Pre-flight checklist

- [ ] Set a strong `AUTH_SECRET` (`openssl rand -base64 32`)
- [ ] Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the production domain
- [ ] Point `DATABASE_URL` at **Postgres** (Neon / Vercel Postgres / Supabase)
- [ ] Change seed admin password (or delete seed users in production)
- [ ] Run `npx prisma db push` (or migrate) against production
- [ ] Run `npm run db:seed` once (categories, economy, brands) — or a production-safe seed
- [ ] Confirm Surf loop: signup → surf → earn → allocate → deliver
- [ ] Confirm admin moderation + Brand Directory
- [ ] Replace stub Terms/Privacy with counsel-reviewed copy
- [ ] Optional: configure SMTP (`SMTP_HOST` etc.) so password reset emails send instead of logging links

## Local → production DB switch

Local (SQLite):

```
DATABASE_URL="file:./dev.db"
```

Production (Postgres) — in `prisma/schema.prisma` change:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then:

```bash
npx prisma db push
npm run db:seed
```

SQLite and Postgres share the same Prisma models; enums map cleanly.

## Vercel

1. Import the GitHub repo
2. Set env vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`
3. Build command: `prisma generate && next build` (already in `npm run build`)
4. After first deploy, run seed via one-off: `npx tsx prisma/seed.ts` with prod env

Optional cron (weekly reminder / future jobs) — `vercel.json` includes `/api/cron/weekly` gated by `CRON_SECRET`.

## Seed accounts (dev only)

| Role | Email | Password |
| --- | --- | --- |
| Founder | `admin@glitterhits.gay` | `ChangeMeNow!` |
| Demo | `demo@glitterhits.gay` | `demo12345` |

**Do not ship these passwords unchanged.**

## Smoke test

```bash
npm run test
npm run build
npm run smoke
```

`npm run smoke` exercises ledger + delivery + password-reset token creation against the local DB.
