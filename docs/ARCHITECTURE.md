# Glitter Hits — Technical Architecture

## Vision

Glitter Hits is a transparent, credit-based traffic exchange and website discovery network for the Queerdom ecosystem. Members earn promotional credits by discovering other websites and spend those credits to promote their own.

**Tagline:** Get Seen. Get Hits. Get Glitter.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS 4 + custom cosmic design tokens |
| Auth | Auth.js (NextAuth v5) + Prisma adapter + credentials |
| ORM / DB | Prisma 6 + SQLite (local) / PostgreSQL (production) |
| Validation | Zod |
| Charts | Recharts |
| Credits | Integer ledger only (no floating-point balances) |

## Domain modules

```
src/lib/
  auth.*              Authentication & session
  db.ts               Prisma client
  credits/            Integer credit ledger & economy settings
  delivery/           Smart campaign matching engine
  surf/               Manual surf sessions + anti-abuse
  campaigns/          Website + campaign lifecycle
  analytics/          Visit aggregation
  rewards/            Levels, achievements, streaks, leaderboards
  referrals/          Referral codes & anti-farming
  brands/             Admin-managed Founder Network / Brand Directory
  moderation/         Site review, reports, statuses
  settings/           Admin-configurable exchange ratios & feature flags
  mail/               Credit network mail + paid solo upgrades + store catalog
  notifications/      In-app alerts (moderation, mail, exhaustion)
  onboarding/         Launch checklist + delivery estimates
```

## Credit economy

Glitter Hits are **integer promotional credits** (not Glitter Coins, not crypto).

Additional spend types:
- `spent_mail` — network mailing
- `spent_mail_upgrade` — paid solo inbox upgrade

Membership upgrades can also be purchased with credits via `/store` when cash checkout is off.

- Unit: **Glitter Hits** (integer promotional credits)
- Separate from Glitter Coins (casino currency) — never mixed
- Every movement writes an immutable `CreditLedger` row
- Types: earned, spent, bonus, promotional, referral, admin_adjustment
- Exchange ratios, visit durations, multipliers live in `SystemSetting`

## Traffic delivery

Matching inputs:

`active campaigns` × `remaining credits` × `targeting` × `available viewers` × `priority` × `frequency caps`

Priority tiers (configurable): Standard → Boosted → Featured → Premium

Traffic quality labels are honest:

- `human_exchange`
- `automated_viewer`
- `suspicious`
- `blocked`
- `admin_test`

No referrer spoofing, UA spoofing, or fake organic/search labeling.

## Viewer architecture

Manual Surf ships first. Automated/background viewers plug into the same delivery + visit APIs with `viewerType: automated_viewer`. The platform never disguises automated traffic as organic.

## Founder Network / Brand Directory

Brands are admin-managed records (`Brand`), not hard-coded constants. New Queerdom properties can be added without code changes.

## Monetization (feature-flagged)

Premium memberships, credit purchases, featured placements, banners, sponsored listings, priority campaigns, extra slots, premium analytics, brand packages — each toggled via settings. Core free exchange works without payments.

## API surface

REST route handlers under `/api/*` for auth, users, websites, campaigns, delivery, surf, credits, rewards, referrals, analytics, brands, placements, moderation. Internal API notes live in `docs/API.md`.

## Phased build order

1. Schema + settings seed
2. Auth + profiles
3. Credit ledger
4. Websites + campaigns
5. Manual Surf + delivery
6. Analytics
7. Rewards / referrals
8. Discovery directory + Queerdom Picks + Founder Network
9. Admin console + moderation
10. Advanced monetization & desktop viewer hooks
