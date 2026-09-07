import type { MembershipTier } from "@prisma/client";
import {
  STRIPE_LIVE_PRICE_IDS,
  STRIPE_TEST_PRICE_IDS,
} from "@/lib/stripe/price-ids";

export type CreditPackSlug =
  | "starter-100"
  | "boost-500"
  | "launch-1500"
  | "empire-5000";

export type PaidMembershipTier = Exclude<MembershipTier, "free">;

function resolveLivePrices() {
  return (
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ||
    process.env.STRIPE_SECRET_KEY?.startsWith("rk_live") ||
    process.env.STRIPE_USE_LIVE_PRICES === "true"
  );
}

function packPrice(slug: CreditPackSlug): string | undefined {
  const fromEnv = {
    "starter-100": process.env.STRIPE_PRICE_PACK_STARTER,
    "boost-500": process.env.STRIPE_PRICE_PACK_BOOST,
    "launch-1500": process.env.STRIPE_PRICE_PACK_LAUNCH,
    "empire-5000": process.env.STRIPE_PRICE_PACK_EMPIRE,
  }[slug];
  if (fromEnv) return fromEnv;
  return (resolveLivePrices() ? STRIPE_LIVE_PRICE_IDS : STRIPE_TEST_PRICE_IDS)[slug];
}

function membershipPrice(tier: PaidMembershipTier): string | undefined {
  const fromEnv = {
    plus: process.env.STRIPE_PRICE_MEMBERSHIP_PLUS,
    premium: process.env.STRIPE_PRICE_MEMBERSHIP_PREMIUM,
    vip: process.env.STRIPE_PRICE_MEMBERSHIP_VIP,
  }[tier];
  if (fromEnv) return fromEnv;
  return (resolveLivePrices() ? STRIPE_LIVE_PRICE_IDS : STRIPE_TEST_PRICE_IDS)[tier];
}

export const CREDIT_PACK_PRICE_ENV: Record<CreditPackSlug, string | undefined> = {
  get "starter-100"() {
    return packPrice("starter-100");
  },
  get "boost-500"() {
    return packPrice("boost-500");
  },
  get "launch-1500"() {
    return packPrice("launch-1500");
  },
  get "empire-5000"() {
    return packPrice("empire-5000");
  },
};

export const MEMBERSHIP_PRICE_ENV: Record<PaidMembershipTier, string | undefined> = {
  get plus() {
    return membershipPrice("plus");
  },
  get premium() {
    return membershipPrice("premium");
  },
  get vip() {
    return membershipPrice("vip");
  },
};

export function isCreditPackSlug(value: string): value is CreditPackSlug {
  return ["starter-100", "boost-500", "launch-1500", "empire-5000"].includes(value);
}

export function isPaidMembershipTier(value: string): value is PaidMembershipTier {
  return value === "plus" || value === "premium" || value === "vip";
}
