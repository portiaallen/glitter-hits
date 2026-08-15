import type { MembershipTier } from "@prisma/client";

export type CreditPackSlug =
  | "starter-100"
  | "boost-500"
  | "launch-1500"
  | "empire-5000";

export type PaidMembershipTier = Exclude<MembershipTier, "free">;

export const CREDIT_PACK_PRICE_ENV: Record<CreditPackSlug, string | undefined> = {
  "starter-100": process.env.STRIPE_PRICE_PACK_STARTER,
  "boost-500": process.env.STRIPE_PRICE_PACK_BOOST,
  "launch-1500": process.env.STRIPE_PRICE_PACK_LAUNCH,
  "empire-5000": process.env.STRIPE_PRICE_PACK_EMPIRE,
};

export const MEMBERSHIP_PRICE_ENV: Record<PaidMembershipTier, string | undefined> = {
  plus: process.env.STRIPE_PRICE_MEMBERSHIP_PLUS,
  premium: process.env.STRIPE_PRICE_MEMBERSHIP_PREMIUM,
  vip: process.env.STRIPE_PRICE_MEMBERSHIP_VIP,
};

export function isCreditPackSlug(value: string): value is CreditPackSlug {
  return value in CREDIT_PACK_PRICE_ENV;
}

export function isPaidMembershipTier(value: string): value is PaidMembershipTier {
  return value === "plus" || value === "premium" || value === "vip";
}
