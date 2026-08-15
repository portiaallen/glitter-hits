import type Stripe from "stripe";
import type { MembershipTier } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MEMBERSHIP_PLANS } from "@/lib/mail/service";
import {
  appUrl,
  getStripe,
  integrationSuffix,
  isStripeConfigured,
} from "@/lib/stripe/client";
import {
  CREDIT_PACK_PRICE_ENV,
  MEMBERSHIP_PRICE_ENV,
  type CreditPackSlug,
  type PaidMembershipTier,
} from "@/lib/stripe/catalog";

export type CheckoutResult = { url: string | null; error?: string };

async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  const stripe = getStripe();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name ?? undefined,
    metadata: { userId: params.userId },
  });

  await prisma.user.update({
    where: { id: params.userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

function packLineItem(pack: {
  slug: string;
  name: string;
  description: string | null;
  credits: number;
  priceCents: number;
  stripePriceId: string | null;
}): Stripe.Checkout.SessionCreateParams.LineItem {
  const envPrice = CREDIT_PACK_PRICE_ENV[pack.slug as CreditPackSlug];
  const priceId = pack.stripePriceId || envPrice;
  if (priceId) return { price: priceId, quantity: 1 };

  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: pack.priceCents,
      product_data: {
        name: pack.name,
        description: pack.description ?? `${pack.credits} Glitter Hits`,
      },
    },
  };
}

function membershipLineItem(
  tier: PaidMembershipTier,
): Stripe.Checkout.SessionCreateParams.LineItem {
  const plan = MEMBERSHIP_PLANS.find((p) => p.tier === tier)!;
  const priceId = MEMBERSHIP_PRICE_ENV[tier];
  if (priceId) return { price: priceId, quantity: 1 };

  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: plan.priceCents,
      recurring: { interval: "month" },
      product_data: {
        name: plan.name,
        description: plan.perks.join(" · "),
      },
    },
  };
}

export async function createCreditPackCheckout(params: {
  userId: string;
  email: string;
  name?: string | null;
  packId: string;
}): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { url: null, error: "Stripe is not configured." };
  }

  const pack = await prisma.creditPack.findFirst({
    where: { id: params.packId, isActive: true },
  });
  if (!pack) return { url: null, error: "Pack not found." };

  try {
    const stripe = getStripe();
    const customerId = await getOrCreateStripeCustomer(params);
    const base = appUrl();
    const suffix = integrationSuffix();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [packLineItem(pack)],
      success_url: `${base}/store/success?kind=pack&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/store?checkout=canceled`,
      client_reference_id: params.userId,
      integration_identifier: `gh_pack_${suffix}`,
      allow_promotion_codes: true,
      metadata: {
        userId: params.userId,
        kind: "credit_pack",
        packId: pack.id,
        packSlug: pack.slug,
        credits: String(pack.credits),
      },
    });

    await prisma.stripePurchase.create({
      data: {
        userId: params.userId,
        kind: "credit_pack",
        status: "pending",
        amountCents: pack.priceCents,
        creditPackSlug: pack.slug,
        creditsGranted: pack.credits,
        stripeSessionId: session.id,
        metadataJson: JSON.stringify({ packId: pack.id }),
      },
    });

    return { url: session.url };
  } catch (error) {
    console.error("createCreditPackCheckout", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Could not start checkout.",
    };
  }
}

export async function createMembershipCheckout(params: {
  userId: string;
  email: string;
  name?: string | null;
  tier: PaidMembershipTier;
}): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { url: null, error: "Stripe is not configured." };
  }

  const plan = MEMBERSHIP_PLANS.find((p) => p.tier === params.tier);
  if (!plan || plan.priceCents <= 0) {
    return { url: null, error: "Invalid membership tier." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  const order: MembershipTier[] = ["free", "plus", "premium", "vip"];
  if (order.indexOf(user.membership) >= order.indexOf(params.tier)) {
    return { url: null, error: "You already have this membership or higher." };
  }

  try {
    const stripe = getStripe();
    const customerId = await getOrCreateStripeCustomer(params);
    const base = appUrl();
    const suffix = integrationSuffix();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [membershipLineItem(params.tier)],
      success_url: `${base}/store/success?kind=membership&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/store?checkout=canceled`,
      client_reference_id: params.userId,
      integration_identifier: `gh_membership_${suffix}`,
      allow_promotion_codes: true,
      metadata: {
        userId: params.userId,
        kind: "membership",
        tier: params.tier,
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          kind: "membership",
          tier: params.tier,
        },
      },
    });

    await prisma.stripePurchase.create({
      data: {
        userId: params.userId,
        kind: "membership",
        status: "pending",
        amountCents: plan.priceCents,
        membershipTier: params.tier,
        stripeSessionId: session.id,
        metadataJson: JSON.stringify({ tier: params.tier }),
      },
    });

    return { url: session.url };
  } catch (error) {
    console.error("createMembershipCheckout", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Could not start checkout.",
    };
  }
}
