import type { MembershipTier } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications/service";
import { MEMBERSHIP_PLANS } from "@/lib/mail/service";

export type EarnMilestoneKind = "visits_completed" | "lifetime_earned" | "streak_days";

export type EarnMembershipMilestone = {
  id: string;
  kind: EarnMilestoneKind;
  target: number;
  /** Pro path starts at Plus */
  tier: Exclude<MembershipTier, "free">;
  days: number;
  title: string;
  description: string;
};

/** Free members earn time-limited Pro (Plus) / Premium via real activity. */
export const EARN_MEMBERSHIP_MILESTONES: EarnMembershipMilestone[] = [
  {
    id: "surf_25_plus_7",
    kind: "visits_completed",
    target: 25,
    tier: "plus",
    days: 7,
    title: "Explorer Plus",
    description: "Complete 25 discoveries to unlock Plus (Pro) for 7 days.",
  },
  {
    id: "surf_100_plus_30",
    kind: "visits_completed",
    target: 100,
    tier: "plus",
    days: 30,
    title: "Pro Discoverer",
    description: "Complete 100 discoveries to unlock Plus (Pro) for 30 days.",
  },
  {
    id: "earn_500_plus_14",
    kind: "lifetime_earned",
    target: 500,
    tier: "plus",
    days: 14,
    title: "Hits Hustle",
    description: "Earn 500 lifetime Hits to unlock Plus (Pro) for 14 days.",
  },
  {
    id: "streak_7_plus_7",
    kind: "streak_days",
    target: 7,
    days: 7,
    tier: "plus",
    title: "Week Streak Pro",
    description: "Keep a 7-day surf streak to unlock Plus (Pro) for 7 days.",
  },
  {
    id: "surf_250_premium_14",
    kind: "visits_completed",
    target: 250,
    tier: "premium",
    days: 14,
    title: "Premium Path",
    description: "Complete 250 discoveries to unlock Premium for 14 days.",
  },
];

const TIER_RANK: MembershipTier[] = ["free", "plus", "premium", "vip"];

function planName(tier: MembershipTier) {
  return MEMBERSHIP_PLANS.find((p) => p.tier === tier)?.name ?? tier;
}

export async function expireEarnedMemberships() {
  const now = new Date();
  const due = await prisma.user.findMany({
    where: {
      membershipExpiresAt: { lte: now },
      membershipSource: "earned",
      membership: { not: "free" },
    },
    select: { id: true, membership: true },
  });

  for (const u of due) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        membership: "free",
        membershipExpiresAt: null,
        membershipSource: "free",
      },
    });
    await notifyUser({
      userId: u.id,
      type: "membership_expired",
      title: "Earned membership ended",
      body: `Your earned ${planName(u.membership)} period ended. Keep exploring to unlock Pro again — or upgrade in the Store.`,
      href: "/store",
    });
  }

  return due.length;
}

async function progressFor(
  userId: string,
  kind: EarnMilestoneKind,
): Promise<number> {
  if (kind === "visits_completed") {
    return prisma.visit.count({
      where: { visitorUserId: userId, completed: true },
    });
  }
  if (kind === "lifetime_earned") {
    const u = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { lifetimeEarned: true },
    });
    return u.lifetimeEarned;
  }
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streakDays: true },
  });
  return u.streakDays;
}

export async function getEarnMembershipProgress(userId: string) {
  await expireEarnedMembershipsForUser(userId);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      membership: true,
      membershipExpiresAt: true,
      membershipSource: true,
    },
  });

  const claims = await prisma.membershipEarnClaim.findMany({
    where: { userId },
    select: { milestoneId: true },
  });
  const claimed = new Set(claims.map((c) => c.milestoneId));

  const rows = await Promise.all(
    EARN_MEMBERSHIP_MILESTONES.map(async (m) => {
      const progress = await progressFor(userId, m.kind);
      return {
        ...m,
        progress,
        target: m.target,
        completed: progress >= m.target,
        claimed: claimed.has(m.id),
        percent: Math.min(100, Math.floor((progress / Math.max(1, m.target)) * 100)),
      };
    }),
  );

  return {
    membership: user.membership,
    membershipExpiresAt: user.membershipExpiresAt,
    membershipSource: user.membershipSource,
    milestones: rows,
  };
}

async function expireEarnedMembershipsForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      membership: true,
      membershipExpiresAt: true,
      membershipSource: true,
    },
  });
  if (
    user &&
    user.membershipSource === "earned" &&
    user.membershipExpiresAt &&
    user.membershipExpiresAt.getTime() <= Date.now() &&
    user.membership !== "free"
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        membership: "free",
        membershipExpiresAt: null,
        membershipSource: "free",
      },
    });
  }
}

/**
 * After meaningful activity, grant any newly unlocked earned memberships.
 * Never downgrades a higher permanent (credits/stripe/admin) tier.
 */
export async function checkAndGrantEarnedMemberships(userId: string) {
  await expireEarnedMembershipsForUser(userId);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      membership: true,
      membershipExpiresAt: true,
      membershipSource: true,
      isSuspended: true,
    },
  });
  if (user.isSuspended) return [];

  const claims = await prisma.membershipEarnClaim.findMany({
    where: { userId },
    select: { milestoneId: true },
  });
  const claimed = new Set(claims.map((c) => c.milestoneId));
  const granted: { milestoneId: string; tier: MembershipTier; days: number }[] = [];

  for (const milestone of EARN_MEMBERSHIP_MILESTONES) {
    if (claimed.has(milestone.id)) continue;
    const progress = await progressFor(userId, milestone.kind);
    if (progress < milestone.target) continue;

    const expiresAt = new Date(Date.now() + milestone.days * 86_400_000);
    const currentRank = TIER_RANK.indexOf(user.membership);
    const grantRank = TIER_RANK.indexOf(milestone.tier);
    const permanentPaid =
      user.membershipSource === "stripe" ||
      user.membershipSource === "credits" ||
      user.membershipSource === "admin";

    // Always record the claim so it can't be farmed again.
    await prisma.membershipEarnClaim.create({
      data: {
        userId,
        milestoneId: milestone.id,
        tier: milestone.tier,
        daysGranted: milestone.days,
        expiresAt,
      },
    });

    let applied = false;
    if (permanentPaid) {
      // Paid members keep their plan; milestone still counts as completed.
      await notifyUser({
        userId,
        type: "membership_earn_bonus",
        title: `${milestone.title} completed`,
        body: `You already have a paid membership, so this milestone is marked complete. Nice work.`,
        href: "/store",
      });
    } else {
      const nextTier = grantRank >= currentRank ? milestone.tier : user.membership;
      const nextExpires =
        user.membershipSource === "earned" &&
        user.membershipExpiresAt &&
        user.membershipExpiresAt > expiresAt &&
        grantRank <= currentRank
          ? user.membershipExpiresAt
          : expiresAt;

      await prisma.user.update({
        where: { id: userId },
        data: {
          membership: nextTier,
          membershipExpiresAt: nextExpires,
          membershipSource: "earned",
        },
      });
      user.membership = nextTier;
      user.membershipExpiresAt = nextExpires;
      user.membershipSource = "earned";
      applied = true;

      await notifyUser({
        userId,
        type: "membership_earned",
        title: `${milestone.title} unlocked!`,
        body: `You earned ${planName(milestone.tier)} for ${milestone.days} days. Keep exploring to stay Pro.`,
        href: "/store",
      });
    }

    if (applied || permanentPaid) {
      granted.push({
        milestoneId: milestone.id,
        tier: milestone.tier,
        days: milestone.days,
      });
    }
  }

  return granted;
}
