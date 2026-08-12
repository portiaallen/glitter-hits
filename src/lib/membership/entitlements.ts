import type { MembershipTier, PriorityTier } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MEMBERSHIP_PLANS } from "@/lib/mail/service";

const PRIORITY_BY_TIER: Record<MembershipTier, PriorityTier[]> = {
  free: ["standard"],
  plus: ["standard", "boosted"],
  premium: ["standard", "boosted", "featured"],
  vip: ["standard", "boosted", "featured", "premium"],
};

export function planForTier(membership: MembershipTier) {
  return MEMBERSHIP_PLANS.find((p) => p.tier === membership) ?? MEMBERSHIP_PLANS[0];
}

export function allowedCampaignPriorities(membership: MembershipTier): PriorityTier[] {
  return PRIORITY_BY_TIER[membership] ?? ["standard"];
}

export function membershipAllowsPriority(
  membership: MembershipTier,
  priority: PriorityTier,
): boolean {
  return allowedCampaignPriorities(membership).includes(priority);
}

export async function assertWebsiteSlotAvailable(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { membership: true, isSuspended: true },
  });
  if (user.isSuspended) throw new Error("Account suspended.");

  const slots = planForTier(user.membership).websiteSlots;
  const used = await prisma.website.count({ where: { userId } });
  if (used >= slots) {
    throw new Error(
      `Website slot limit reached (${used}/${slots} for ${user.membership}). Upgrade in the Store.`,
    );
  }
  return { used, slots, membership: user.membership };
}

export async function assertCampaignPriorityAllowed(
  userId: string,
  priority: PriorityTier,
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { membership: true },
  });
  if (!membershipAllowsPriority(user.membership, priority)) {
    throw new Error(
      `Your ${user.membership} membership cannot use ${priority} priority. Upgrade in the Store.`,
    );
  }
  return user.membership;
}

export async function getMembershipEntitlements(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { membership: true },
  });
  const plan = planForTier(user.membership);
  const websiteCount = await prisma.website.count({ where: { userId } });
  return {
    membership: user.membership,
    websiteSlots: plan.websiteSlots,
    websitesUsed: websiteCount,
    websitesRemaining: Math.max(0, plan.websiteSlots - websiteCount),
    allowedPriorities: allowedCampaignPriorities(user.membership),
    mailTiers: plan.mailTierUnlocked,
  };
}
