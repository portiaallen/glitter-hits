#!/usr/bin/env bash
# One-shot production wiring for glitterhits.online
# Requires: vercel logged in (or VERCEL_TOKEN), stripe logged in (or STRIPE_SECRET_KEY)
set -euo pipefail

DOMAIN="glitterhits.online"
APP_URL="https://${DOMAIN}"
WEBHOOK_PATH="/api/webhooks/stripe"
WEBHOOK_URL="${APP_URL}${WEBHOOK_PATH}"

echo "==> Glitter Hits production setup for ${DOMAIN}"

if ! command -v vercel >/dev/null 2>&1 && [[ -z "${VERCEL_TOKEN:-}" ]]; then
  if [[ -f node_modules/.bin/vercel ]]; then
    VERCEL=(npx vercel)
  else
    echo "Install/login Vercel CLI first: npx vercel login"
    exit 1
  fi
else
  VERCEL=(vercel)
fi

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  VERCEL+=(--token "$VERCEL_TOKEN")
fi

echo "==> Linking / confirming Vercel project"
"${VERCEL[@]}" link --yes --project cto-projects 2>/dev/null || "${VERCEL[@]}" link --yes

echo "==> Adding domain ${DOMAIN}"
"${VERCEL[@]}" domains add "$DOMAIN" || true
"${VERCEL[@]}" domains inspect "$DOMAIN" || true

set_env() {
  local key="$1" value="$2"
  # Remove existing production value if present, then add
  printf '%s' "$value" | "${VERCEL[@]}" env add "$key" production --force 2>/dev/null \
    || printf '%s' "$value" | "${VERCEL[@]}" env add "$key" production
}

echo "==> Setting production URL env vars"
set_env AUTH_URL "$APP_URL"
set_env NEXT_PUBLIC_APP_URL "$APP_URL"

if [[ -f .env ]]; then
  echo "==> Syncing selected secrets from local .env to Vercel production (if present)"
  while IFS='=' read -r key val; do
    [[ "$key" =~ ^(AUTH_SECRET|CRON_SECRET|STRIPE_SECRET_KEY|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_PRICE_|DATABASE_URL|RESEND_API_KEY|EMAIL_FROM|SUPPORT_EMAIL|TURNSTILE_|REQUIRE_TURNSTILE) ]] || continue
    val="${val%\"}"
    val="${val#\"}"
    [[ -n "$val" ]] || continue
    set_env "$key" "$val" || true
  done < <(grep -E '^(AUTH_SECRET|CRON_SECRET|STRIPE_|NEXT_PUBLIC_STRIPE_|DATABASE_URL|RESEND_|EMAIL_FROM|SUPPORT_EMAIL|TURNSTILE_|REQUIRE_TURNSTILE|NEXT_PUBLIC_TURNSTILE_)' .env | grep -v '^#' || true)
fi

echo "==> Stripe webhook → ${WEBHOOK_URL}"
if [[ -z "${STRIPE_SECRET_KEY:-}" && -f .env ]]; then
  # shellcheck disable=SC1091
  export "$(grep '^STRIPE_SECRET_KEY=' .env | xargs)"
fi
if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "STRIPE_SECRET_KEY missing — skip webhook create"
else
  stripe webhook_endpoints create \
    --url "$WEBHOOK_URL" \
    -d "enabled_events[0]=checkout.session.completed" \
    -d "enabled_events[1]=customer.subscription.updated" \
    -d "enabled_events[2]=customer.subscription.deleted" \
    --api-key "$STRIPE_SECRET_KEY" || echo "Webhook create failed (claim sandbox / use full key)"
fi

echo "==> Done. Finish DNS at registrar if Vercel shows pending verification."
echo "    Then Resend domain verify + Turnstile widget for ${DOMAIN}."
