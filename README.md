# Glitter Hits

**Get Seen. Get Hits. Get Glitter.**

A modern, transparent traffic-exchange and website discovery platform for the Queerdom ecosystem.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma 6 + SQLite (swap to Postgres for production)
- Auth.js (NextAuth v5) credentials
- Tailwind CSS 4
- Integer Glitter Hits credit ledger (never floats; never Glitter Coins)

## Quick start

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed accounts

| Role | Email | Password |
| --- | --- | --- |
| Founder/Admin | `admin@glitterhits.gay` | `ChangeMeNow!` |
| Demo member | `demo@glitterhits.gay` | `demo12345` |

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Prisma generate + production build |
| `npm run db:push` | Sync schema |
| `npm run db:seed` | Seed economy, categories, brands, demo data |
| `npm run db:reset` | Reset DB + seed |
| `npm test` | Unit / integration tests |
| `npm run typecheck` | TypeScript check |

## Product pillars

1. **Credit exchange** — surf to earn, campaign to spend
2. **Smart delivery** — targeting, priority, frequency, caps
3. **Transparency** — exchange traffic labeled honestly
4. **Discovery** — directory, Queerdom Picks, Founder Network (admin Brand Directory)
5. **Gamification** — levels, achievements, streaks, referrals
6. **Admin control** — economy ratios, moderation, brands, monetization flags

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Deploy / launch checklist](./docs/DEPLOY.md)

## Production notes

Set `DATABASE_URL` to Postgres, set a strong `AUTH_SECRET`, and enable monetization features individually in Admin → Settings when ready. Payment processing is architected but not required to launch the free exchange.

Launch hardening included: password reset, rate limits, signup honeypot, hardened site checker, referral earn-share, weekly bonus, leaderboards, profile editing.