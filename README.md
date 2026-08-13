# Glitter Hits

**Surf. Spark. Share. Get Lucky.**

A modern, transparent traffic-exchange and website discovery platform for the Queerdom ecosystem.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma 6 + SQLite locally / Postgres in production
- Auth.js (NextAuth v5) credentials
- Tailwind CSS 4
- Integer Glitter Hits credit ledger (never floats; never Glitter Coins)
- Resend transactional email + Cloudflare Turnstile for launch hardening

## Quick start

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local seed creates demo accounts when not in production seed mode. **Never use demo passwords in production.** See [docs/DEPLOY.md](./docs/DEPLOY.md).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Prisma generate + production build |
| `npm run db:push` | Sync schema |
| `npm run db:seed` | Seed economy, categories, brands, optional demo data |
| `npm run db:reset` | Reset DB + seed |
| `npm test` | Unit / integration tests |
| `npm run smoke` | End-to-end-ish launch smoke against local DB |
| `npm run typecheck` | TypeScript check |

## Product pillars

1. **Credit exchange** — surf to earn, campaign to spend
2. **Smart delivery** — targeting, priority, frequency, caps
3. **Transparency** — exchange traffic labeled honestly
4. **Discovery** — directory, Queerdom Picks, Founder Network
5. **Luck Engine** — quests, wheel, drops, challenges, royalty
6. **Admin control** — economy ratios, moderation, brands, monetization flags

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Deploy / full launch checklist](./docs/DEPLOY.md)

## Production

Follow the full launch checklist in `docs/DEPLOY.md`. Required: Postgres, strong `AUTH_SECRET`, Resend, Turnstile, `CRON_SECRET`, production-safe seed (no demo users), counsel-reviewed Terms/Privacy.
