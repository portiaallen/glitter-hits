import type Stripe from "stripe";
import type { MembershipTier } from "@prisma/client";
import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { isPaidMembershipTier } from "@/lib/stripe/catalog";

async function fulfillCreditPack(session: Stripe.Checkout.Session) {
  const purchase = await prisma.stripePurchase.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (!purchase) {
    console.error("[stripe] missing purchase row for session", session.id);
    return;
  }
  if (purchase.status === "paid" && purchase.fulfilledAt) return;

  const credits =
    purchase.creditsGranted ??
    Number(session.metadata?.credits || 0);
  if (!Number.isInteger(credits) || credits <= 0) {
    console.error("[stripe] invalid credits for session", session.id);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await moveCredits({
      tx,
      userId: purchase.userId,
      amount: credits,
      type: "purchase",
      description: `Purchased ${credits} Glitter Hits (${purchase.creditPackSlug ?? "pack"})`,
      metadata: {
        stripeSessionId: session.id,
        packSlug: purchase.creditPackSlug,
      },
    });

    await tx.stripePurchase.update({
      where: { id: purchase.id },
      data: {
        status: "paid",
        fulfilledAt: new Date(),
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      },
    });
  });
}

async function applyMembership(params: {
  userId: string;
  tier: MembershipTier;
  subscriptionId?: string | null;
  status?: string | null;
  customerId?: string | null;
  sessionId?: string | null;
}) {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      membership: params.tier,
      stripeSubscriptionId: params.subscriptionId ?? undefined,
      stripeSubscriptionStatus: params.status ?? "active",
      stripeCustomerId: params.customerId ?? undefined,
    },
  });

  if (params.sessionId) {
    await prisma.stripePurchase.updateMany({
      where: { stripeSessionId: params.sessionId },
      data: {
        status: "paid",
        fulfilledAt: new Date(),
        membershipTier: params.tier,
        stripeSubscriptionId: params.subscriptionId ?? undefined,
      },
    });
  }
}

async function fulfillMembership(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId ?? session.client_reference_id ?? undefined;
  const tierRaw = session.metadata?.tier;
  if (!userId || !tierRaw || !isPaidMembershipTier(tierRaw)) {
    console.error("[stripe] membership session missing mapping", session.id);
    return;
  }

  await applyMembership({
    userId,
    tier: tierRaw,
    subscriptionId:
      typeof session.subscription === "string" ? session.subscription : null,
    status: "active",
    customerId: typeof session.customer === "string" ? session.customer : null,
    sessionId: session.id,
  });
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  if (kind === "credit_pack" || session.mode === "payment") {
    await fulfillCreditPack(session);
    return;
  }
  if (kind === "membership" || session.mode === "subscription") {
    await fulfillMembership(session);
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : null;

  let userId: string | undefined = subscription.metadata?.userId;
  if (!userId && customerId) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    userId = user?.id;
  }
  if (!userId) {
    console.error("[stripe] subscription missing user", subscription.id);
    return;
  }

  const active = new Set(["active", "trialing"]);
  const tierRaw = subscription.metadata?.tier;
  if (active.has(subscription.status) && tierRaw && isPaidMembershipTier(tierRaw)) {
    await applyMembership({
      userId,
      tier: tierRaw,
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId,
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      membership: "free",
      stripeSubscriptionStatus: subscription.status,
    },
  });
}

export async function handleStripeWebhook(
  payload: string,
  signature: string,
): Promise<{ received: boolean; error?: string }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return { received: false, error: "STRIPE_WEBHOOK_SECRET is not configured." };
  }
  if (!isStripeConfigured()) {
    return { received: false, error: "STRIPE_SECRET_KEY is not configured." };
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe] webhook signature failed", error);
    return {
      received: false,
      error: error instanceof Error ? error.message : "Invalid signature",
    };
  }

  switch (event.type) {
    case "checkout.session.completed":
      await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return { received: true };
}

/** Dev fallback when webhooks are not forwarded yet. */
export async function fulfillCheckoutSessionById(sessionId: string, userId: string) {
  if (!isStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured." };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.userId && session.metadata.userId !== userId) {
    return { ok: false as const, error: "Session does not belong to this user." };
  }
  if (session.client_reference_id && session.client_reference_id !== userId) {
    return { ok: false as const, error: "Session does not belong to this user." };
  }
  if (session.payment_status !== "paid" && session.status !== "complete") {
    return { ok: false as const, error: "Checkout is not complete yet." };
  }

  await fulfillCheckoutSession(session);
  return { ok: true as const };
}
