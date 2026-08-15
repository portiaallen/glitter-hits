/**
 * Launch readiness check — prints what's ready vs blocked on domain.
 * Usage: npx tsx scripts/launch-check.ts
 * Never prints secret values.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile();

const isProdLike =
  process.env.SEED_MODE === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

const checks: {
  name: string;
  ok: boolean;
  note: string;
  needsDomain?: boolean;
}[] = [];

function present(key: string) {
  const v = process.env[key]?.trim();
  if (!v) return false;
  if (v === "replace-with-a-long-random-secret") return false;
  if (v.includes("USER:PASSWORD@HOST")) return false;
  return true;
}

checks.push({
  name: "DATABASE_URL (Postgres)",
  ok: present("DATABASE_URL") && (process.env.DATABASE_URL || "").startsWith("postgres"),
  note: "Neon / Vercel Postgres / local Postgres",
});
checks.push({
  name: "AUTH_SECRET",
  ok: present("AUTH_SECRET"),
  note: "openssl rand -base64 32",
});
checks.push({
  name: "CRON_SECRET",
  ok: present("CRON_SECRET"),
  note: "Protects /api/cron/weekly",
});
checks.push({
  name: "App URLs",
  ok: present("AUTH_URL") && present("NEXT_PUBLIC_APP_URL"),
  note: "Set to production domain at launch",
  needsDomain: true,
});
checks.push({
  name: "Stripe secret + publishable",
  ok: present("STRIPE_SECRET_KEY") && present("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  note: "Sandbox or live restricted key",
});
checks.push({
  name: "Stripe webhook secret",
  ok: present("STRIPE_WEBHOOK_SECRET"),
  note: "Dashboard endpoint or stripe listen",
});
checks.push({
  name: "Stripe pack price IDs",
  ok:
    present("STRIPE_PRICE_PACK_STARTER") &&
    present("STRIPE_PRICE_PACK_BOOST") &&
    present("STRIPE_PRICE_PACK_LAUNCH") &&
    present("STRIPE_PRICE_PACK_EMPIRE"),
  note: "Catalog pinned",
});
checks.push({
  name: "Stripe membership price IDs",
  ok:
    present("STRIPE_PRICE_MEMBERSHIP_PLUS") &&
    present("STRIPE_PRICE_MEMBERSHIP_PREMIUM") &&
    present("STRIPE_PRICE_MEMBERSHIP_VIP"),
  note: "Subscriptions pinned",
});
checks.push({
  name: "Resend",
  ok: present("RESEND_API_KEY"),
  note: "Password reset + contact mail",
  needsDomain: true,
});
checks.push({
  name: "Turnstile",
  ok: present("NEXT_PUBLIC_TURNSTILE_SITE_KEY") && present("TURNSTILE_SECRET_KEY"),
  note: "Cloudflare widget for production hostname",
  needsDomain: true,
});
checks.push({
  name: "Turnstile fail-closed",
  ok: process.env.REQUIRE_TURNSTILE === "true",
  note: "Set REQUIRE_TURNSTILE=true at launch",
  needsDomain: true,
});
checks.push({
  name: "Prod safety (no insecure flags)",
  ok: !isProdLike
    ? true
    : process.env.ALLOW_INSECURE_AUTH !== "true" &&
      process.env.MODERATION_AUTO_APPROVE !== "true" &&
      process.env.ALLOW_DEMO_SEED !== "true",
  note: "Unset ALLOW_INSECURE_AUTH, MODERATION_AUTO_APPROVE, ALLOW_DEMO_SEED in prod",
});

const ready = checks.filter((c) => c.ok);
const blocked = checks.filter((c) => !c.ok);
const domainBlocked = blocked.filter((c) => c.needsDomain);
const canDoNow = blocked.filter((c) => !c.needsDomain);

console.log("Glitter Hits — launch check\n");
for (const c of checks) {
  console.log(`${c.ok ? "✓" : "✗"} ${c.name}${c.needsDomain ? " (domain)" : ""}`);
  if (!c.ok) console.log(`    → ${c.note}`);
}
console.log(`\nReady: ${ready.length}/${checks.length}`);
if (canDoNow.length) {
  console.log("\nStill doable without domain:");
  for (const c of canDoNow) console.log(`  - ${c.name}: ${c.note}`);
}
if (domainBlocked.length) {
  console.log("\nWaiting on domain:");
  for (const c of domainBlocked) console.log(`  - ${c.name}: ${c.note}`);
}

process.exit(canDoNow.length ? 1 : 0);
