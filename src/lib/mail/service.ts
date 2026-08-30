import type { MailTier, MembershipTier } from "@prisma/client";
import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";
import { notifyUser } from "@/lib/notifications/service";
import { getSetting, setSetting } from "@/lib/settings/economy";

export type MailEconomy = {
  standardCost: number;
  boostedCost: number;
  featuredCost: number;
  premiumSoloCost: number;
  // Extra paid-solo upgrade on top of tier (credits) — “paid solo mailing upgrade”
  paidSoloUpgradeCost: number;
  maxRecipientsStandard: number;
  maxRecipientsBoosted: number;
  maxRecipientsFeatured: number;
  maxRecipientsPremiumSolo: number;
  minAccountAgeHours: number;
};

export const DEFAULT_MAIL_ECONOMY: MailEconomy = {
  standardCost: 25,
  boostedCost: 75,
  featuredCost: 150,
  premiumSoloCost: 400,
  paidSoloUpgradeCost: 200,
  maxRecipientsStandard: 50,
  maxRecipientsBoosted: 150,
  maxRecipientsFeatured: 400,
  maxRecipientsPremiumSolo: 2000,
  minAccountAgeHours: 0,
};

export async function getMailEconomy(): Promise<MailEconomy> {
  return getSetting("mail_economy", DEFAULT_MAIL_ECONOMY);
}

function tierCost(economy: MailEconomy, tier: MailTier): number {
  switch (tier) {
    case "boosted":
      return economy.boostedCost;
    case "featured":
      return economy.featuredCost;
    case "premium_solo":
      return economy.premiumSoloCost;
    default:
      return economy.standardCost;
  }
}

function tierCap(economy: MailEconomy, tier: MailTier): number {
  switch (tier) {
    case "boosted":
      return economy.maxRecipientsBoosted;
    case "featured":
      return economy.maxRecipientsFeatured;
    case "premium_solo":
      return economy.maxRecipientsPremiumSolo;
    default:
      return economy.maxRecipientsStandard;
  }
}

function planForMembership(membership: MembershipTier) {
  return MEMBERSHIP_PLANS.find((p) => p.tier === membership) ?? MEMBERSHIP_PLANS[0];
}

export function membershipAllowsMailTier(
  membership: MembershipTier,
  tier: MailTier,
): boolean {
  return planForMembership(membership).mailTierUnlocked.includes(tier);
}

/** Credit costs to unlock membership when cash checkout is off / as an alt path */
export const MEMBERSHIP_CREDIT_COSTS: Record<Exclude<MembershipTier, "free">, number> = {
  plus: 500,
  premium: 1500,
  vip: 4000,
};

export async function upgradeMembershipWithCredits(params: {
  userId: string;
  tier: Exclude<MembershipTier, "free">;
}) {
  const cost = MEMBERSHIP_CREDIT_COSTS[params.tier];
  const plan = planForMembership(params.tier);
  const order: MembershipTier[] = ["free", "plus", "premium", "vip"];
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  if (user.isSuspended) throw new Error("Account suspended.");
  if (order.indexOf(params.tier) <= order.indexOf(user.membership)) {
    throw new Error("You already have this membership or higher.");
  }

  await prisma.$transaction(async (tx) => {
    await moveCredits({
      tx,
      userId: params.userId,
      amount: -cost,
      type: "spent_boost",
      description: `Membership upgrade — ${plan.name}`,
      metadata: { membership: params.tier, creditCost: cost },
    });
    await tx.user.update({
      where: { id: params.userId },
      data: {
        membership: params.tier,
        membershipExpiresAt: null,
        membershipSource: "credits",
      },
    });
  });

  await notifyUser({
    userId: params.userId,
    type: "membership_upgraded",
    title: `Welcome to ${plan.name}`,
    body: `Your membership is now ${plan.name}. New mail tiers and website slots unlocked.`,
    href: "/store",
  });

  return { tier: params.tier, cost };
}

export async function sendSoloMail(params: {
  senderId: string;
  subject: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
  tier: MailTier;
  /** Paid solo upgrade — priority inbox placement + larger reach bump */
  paidSoloUpgrade?: boolean;
}) {
  const subject = params.subject.trim().slice(0, 120);
  const body = params.body.trim().slice(0, 4000);
  if (subject.length < 3) throw new Error("Subject is too short.");
  if (body.length < 10) throw new Error("Message body is too short.");

  const economy = await getMailEconomy();
  const sender = await prisma.user.findUniqueOrThrow({ where: { id: params.senderId } });
  if (sender.isSuspended) throw new Error("Account suspended.");

  const ageHours =
    (Date.now() - sender.createdAt.getTime()) / (1000 * 60 * 60);
  if (ageHours < economy.minAccountAgeHours) {
    throw new Error("Account is too new to send network mail.");
  }

  let tier = params.tier;
  if (!membershipAllowsMailTier(sender.membership, tier)) {
    throw new Error(
      `Your ${sender.membership} membership cannot send ${tier} mail. Upgrade in the Store.`,
    );
  }

  // premium_solo implies paid solo treatment
  const wantPaidSolo = !!params.paidSoloUpgrade || tier === "premium_solo";
  if (wantPaidSolo && tier === "standard") {
    if (membershipAllowsMailTier(sender.membership, "boosted")) tier = "boosted";
  }

  let cost = tierCost(economy, tier);
  let upgradeCost = 0;
  if (wantPaidSolo) {
    upgradeCost = economy.paidSoloUpgradeCost;
    cost += upgradeCost;
  }

  const cap = tierCap(economy, wantPaidSolo && tier !== "premium_solo" ? "featured" : tier);

  // Active members excluding sender — prefer recently active surfers
  const recipients = await prisma.user.findMany({
    where: {
      id: { not: params.senderId },
      isSuspended: false,
    },
    orderBy: [{ lastSurfDate: "desc" }, { createdAt: "desc" }],
    take: cap,
    select: { id: true },
  });

  if (recipients.length === 0) {
    throw new Error("No eligible recipients on the network yet.");
  }

  const mail = await prisma.$transaction(async (tx) => {
    await moveCredits({
      tx,
      userId: params.senderId,
      amount: -cost,
      type: wantPaidSolo ? "spent_mail_upgrade" : "spent_mail",
      description: wantPaidSolo
        ? `Paid solo mailing (${tier}) to ${recipients.length} members`
        : `Network mailing (${tier}) to ${recipients.length} members`,
      metadata: { tier, recipientCount: recipients.length, paidSolo: wantPaidSolo },
    });

    const created = await tx.mailCampaign.create({
      data: {
        senderId: params.senderId,
        subject,
        body,
        ctaUrl: params.ctaUrl || null,
        ctaLabel: params.ctaLabel || null,
        tier,
        status: "sent",
        creditCost: cost - upgradeCost,
        upgradeCreditCost: upgradeCost,
        recipientCount: recipients.length,
        isPaidSolo: wantPaidSolo,
        sentAt: new Date(),
      },
    });

    await tx.mailReceipt.createMany({
      data: recipients.map((r) => ({
        mailId: created.id,
        recipientId: r.id,
        isFeatured: wantPaidSolo || tier === "featured" || tier === "premium_solo",
      })),
    });

    return created;
  });

  // Notify recipients (bounded fan-out)
  const notifyBatch = recipients.slice(0, 100);
  await Promise.all(
    notifyBatch.map((r) =>
      notifyUser({
        userId: r.id,
        type: "mail_received",
        title: wantPaidSolo ? "⭐ Paid solo in your inbox" : "New network mail",
        body: subject,
        href: "/mail",
      }),
    ),
  );

  return mail;
}

export async function getInbox(userId: string, limit = 40) {
  return prisma.mailReceipt.findMany({
    where: { recipientId: userId },
    include: {
      mail: {
        include: {
          sender: { select: { id: true, name: true, levelSlug: true } },
        },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function markMailRead(userId: string, receiptId: string) {
  const receipt = await prisma.mailReceipt.findFirst({
    where: { id: receiptId, recipientId: userId },
  });
  if (!receipt) throw new Error("Mail not found.");
  if (receipt.readAt) return receipt;

  const updated = await prisma.mailReceipt.update({
    where: { id: receiptId },
    data: { readAt: new Date() },
  });
  await prisma.mailCampaign.update({
    where: { id: receipt.mailId },
    data: { readCount: { increment: 1 } },
  });
  const { onMeaningfulActivity } = await import("@/lib/luck/activity");
  await onMeaningfulActivity({
    userId,
    kind: "mail_open",
    silentLuckNotify: true,
  });
  return updated;
}

export type MembershipPlan = {
  tier: MembershipTier;
  name: string;
  priceCents: number;
  perks: string[];
  websiteSlots: number;
  mailTierUnlocked: MailTier[];
  enabled: boolean;
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    tier: "free",
    name: "Free Discoverer",
    priceCents: 0,
    websiteSlots: 3,
    mailTierUnlocked: ["standard"],
    enabled: true,
    perks: [
      "Earn & spend Glitter Hits",
      "Manual Surf",
      "3 website slots",
      "Standard network mail",
    ],
  },
  {
    tier: "plus",
    name: "Plus (Pro)",
    priceCents: 999,
    websiteSlots: 10,
    mailTierUnlocked: ["standard", "boosted"],
    enabled: true,
    perks: [
      "Earnable by Surfing (time-limited) or buy permanent",
      "10 website slots",
      "Boosted mailing tier",
      "Priority campaign queue bump",
      "Plus badge on profile",
    ],
  },
  {
    tier: "premium",
    name: "Premium Promoter",
    priceCents: 2499,
    websiteSlots: 25,
    mailTierUnlocked: ["standard", "boosted", "featured"],
    enabled: true,
    perks: [
      "25 website slots",
      "Featured mailing",
      "Featured placement discounts",
      "Premium analytics",
    ],
  },
  {
    tier: "vip",
    name: "Queerdom VIP",
    priceCents: 4999,
    websiteSlots: 100,
    mailTierUnlocked: ["standard", "boosted", "featured", "premium_solo"],
    enabled: true,
    perks: [
      "Unlimited-feel website slots",
      "Premium solo mailings",
      "VIP support path",
      "Founder Network spotlight eligibility",
    ],
  },
];

export async function getStoreCatalog() {
  const packs = await prisma.creditPack.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const cashEnabled = await prisma.monetizationFeature.findUnique({
    where: { key: "credit_purchases" },
  });
  const membershipEnabled = await prisma.monetizationFeature.findUnique({
    where: { key: "premium_memberships" },
  });
  const mailEconomy = await getMailEconomy();
  return {
    packs,
    memberships: MEMBERSHIP_PLANS,
    membershipCreditCosts: MEMBERSHIP_CREDIT_COSTS,
    cashCheckoutEnabled: !!cashEnabled?.enabled,
    membershipCheckoutEnabled: !!membershipEnabled?.enabled,
    mailEconomy,
  };
}

export async function ensureMailSettingsSeeded() {
  await setSetting("mail_economy", DEFAULT_MAIL_ECONOMY);
}
