# Glitter Hits API (internal)

Base URL: `/api`

Auth: Auth.js session cookie. Protected routes return `401` when unauthenticated.

## Auth

| Method | Path | Notes |
| --- | --- | --- |
| * | `/api/auth/[...nextauth]` | Auth.js handlers |

## Surf / delivery

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/surf/session` | `{ viewerType?, deviceHint?, countryCode? }` | Start session. `viewerType`: `human_exchange` \| `automated_viewer` |
| POST | `/api/surf/next` | `{ sessionId }` | Next eligible campaign visit |
| POST | `/api/surf/complete` | `{ visitId, actualDurationSec }` | Credit earn + campaign charge |
| POST | `/api/surf/skip` | `{ visitId, elapsedSec }` | Skip after configured delay |
| POST | `/api/surf/heartbeat` | `{ sessionId }` | Keep-alive |
| POST | `/api/surf/pause` | `{ sessionId, resume? }` | Pause / resume |
| POST | `/api/surf/end` | `{ sessionId }` | End session |
| POST | `/api/surf/report` | `{ visitId?\|websiteId?, reason, details? }` | Report site |
| POST | `/api/surf/control` | `{ sessionId, action }` | Unified control |

Traffic quality is stored on each `Visit` (`human_exchange`, `automated_viewer`, `suspicious`, `blocked`, `admin_test`). Source label is always `glitter_hits_exchange` unless genuinely otherwise.

## Websites & campaigns

| Method | Path | Notes |
| --- | --- | --- |
| GET/POST | `/api/websites` | List / create (URL validation + moderation) |
| GET/POST/PATCH | `/api/campaigns` | List / create / pause\|resume\|archive\|delete\|duplicate\|allocate |

## Credits

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/credits` | Balance + ledger |
| POST | `/api/credits` | `{ action: "daily" }` claim daily reward |

Credits are **integers only**. Ledger types cover earn/spend/bonus/referral/admin/purchase(architecture).

## Discovery

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/brands` | Enabled brands + categories + network availability estimate |
| GET | `/api/categories` | Active categories |
| GET | `/api/rewards` | Levels + achievements |
| GET/POST | `/api/referrals` | Own referral stats / track click |

## Admin

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/admin?view=overview\|moderation\|users\|brands\|settings` | Admin console data |
| POST | `/api/admin` | Actions: `moderate_website`, `adjust_credits`, `update_economy`, `upsert_brand`, `toggle_monetization` |

All mutating admin actions write `AdminAuditLog`.

## Future desktop viewer

Automated viewers authenticate as a user (or service token — future) and call the same Surf APIs with `viewerType: "automated_viewer"`. Earnings use `automatedViewerMultiplier`. Never disguise as organic.
