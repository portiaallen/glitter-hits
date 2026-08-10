import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";
import { getEconomySettings } from "@/lib/settings/economy";

function weekKey(d = new Date()): string {
  // ISO week key YYYY-Www
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Award ongoing referral share when a referred user earns surf credits.
 */
export async function awardReferralShare(params: {
  earnerUserId: string;
  earnedAmount: number;
  visitId?: string;
}) {
  if (params.earnedAmount <= 0) return null;
  const economy = await getEconomySettings();
  const pct = Math.max(0, Math.min(100, economy.referralPercentOfRefereeEarnings));
  if (pct <= 0) return null;

  const earner = await prisma.user.findUnique({ where: { id: params.earnerUserId } });
  if (!earner?.referredById) return null;

  const share = Math.floor((params.earnedAmount * pct) / 100);
  if (share <= 0) return null;

  const event = await prisma.referralEvent.findFirst({
    where: {
      referrerId: earner.referredById,
      referredUserId: earner.id,
      status: { in: ["registered", "activated", "qualified"] },
    },
  });

  await moveCredits({
    userId: earner.referredById,
    amount: share,
    type: "earned_referral",
    description: `Referral share (${pct}%) from discoverer earnings`,
    referralId: event?.id,
    visitId: params.visitId,
    metadata: { earnerUserId: params.earnerUserId, pct },
  });

  if (event) {
    await prisma.referralEvent.update({
      where: { id: event.id },
      data: {
        creditsAwarded: { increment: share },
        status: event.status === "registered" ? "activated" : event.status,
        activatedAt: event.activatedAt ?? new Date(),
      },
    });
  }

  return { share, referrerId: earner.referredById };
}

export async function claimWeeklyBonus(userId: string) {
  const economy = await getEconomySettings();
  if (economy.weeklyActivityBonus <= 0) {
    throw new Error("Weekly bonus is not enabled.");
  }

  const key = weekKey();
  const existing = await prisma.systemSetting.findUnique({
    where: { key: `weekly_claim:${userId}:${key}` },
  });
  if (existing) throw new Error("Weekly bonus already claimed.");

  // Require meaningful activity this ISO week
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - (day - 1));
  weekStart.setUTCHours(0, 0, 0, 0);

  const visits = await prisma.visit.count({
    where: {
      visitorUserId: userId,
      completed: true,
      startedAt: { gte: weekStart },
    },
  });
  if (visits < 5) {
    throw new Error("Complete at least 5 discoveries this week to unlock the weekly bonus.");
  }

  await prisma.systemSetting.create({
    data: {
      key: `weekly_claim:${userId}:${key}`,
      valueJson: JSON.stringify({ amount: economy.weeklyActivityBonus, visits }),
    },
  });

  await moveCredits({
    userId,
    amount: economy.weeklyActivityBonus,
    type: "earned_weekly",
    description: `Weekly activity bonus (${key})`,
    metadata: { weekKey: key, visits },
  });

  return { amount: economy.weeklyActivityBonus, weekKey: key, visits };
}

export type LeaderboardBoard =
  | "discoverers"
  | "promoters"
  | "active"
  | "referred"
  | "trending";

export async function getLeaderboards() {
  const [discoverers, promoters, active, referred, trending] = await Promise.all([
    prisma.user.findMany({
      where: { isSuspended: false },
      orderBy: { lifetimeEarned: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        levelSlug: true,
        lifetimeEarned: true,
        streakDays: true,
      },
    }),
    prisma.user.findMany({
      where: { isSuspended: false },
      orderBy: { lifetimeSpent: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        levelSlug: true,
        lifetimeSpent: true,
      },
    }),
    prisma.user.findMany({
      where: { isSuspended: false, lastSurfDate: { not: null } },
      orderBy: [{ streakDays: "desc" }, { levelPoints: "desc" }],
      take: 20,
      select: {
        id: true,
        name: true,
        levelSlug: true,
        streakDays: true,
        levelPoints: true,
      },
    }),
    prisma.referralEvent.groupBy({
      by: ["referrerId"],
      where: { status: { in: ["activated", "qualified", "registered"] } },
      _count: { _all: true },
      orderBy: { _count: { referrerId: "desc" } },
      take: 20,
    }),
    prisma.website.findMany({
      where: { moderationStatus: "approved" },
      orderBy: { discoverCount: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        url: true,
        discoverCount: true,
        isQueerdomPick: true,
      },
    }),
  ]);

  const referrerIds = referred.map((r) => r.referrerId);
  const referrerUsers = await prisma.user.findMany({
    where: { id: { in: referrerIds } },
    select: { id: true, name: true, levelSlug: true },
  });
  const referrerMap = new Map(referrerUsers.map((u) => [u.id, u]));

  return {
    discoverers,
    promoters,
    active,
    referred: referred.map((r) => ({
      ...referrerMap.get(r.referrerId),
      referrals: r._count._all,
    })),
    trending,
  };
}
