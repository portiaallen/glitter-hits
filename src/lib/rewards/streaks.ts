import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";
import { getEconomySettings } from "@/lib/settings/economy";
import { refreshLevel } from "@/lib/rewards/achievements";

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function touchStreak(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const today = utcDateString();
  const last = user.lastSurfDate ? utcDateString(user.lastSurfDate) : null;

  if (last === today) return user;

  const yesterday = utcDateString(new Date(Date.now() - 86_400_000));
  const nextStreak = last === yesterday ? user.streakDays + 1 : 1;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      streakDays: nextStreak,
      longestStreak: Math.max(user.longestStreak, nextStreak),
      lastSurfDate: new Date(),
      levelPoints: { increment: 1 },
    },
  });
  await refreshLevel(userId);
  return updated;
}

export async function claimDailyReward(userId: string) {
  const economy = await getEconomySettings();
  const today = utcDateString();
  const existing = await prisma.dailyRewardClaim.findUnique({
    where: { userId_claimDate: { userId, claimDate: today } },
  });
  if (existing) throw new Error("Daily reward already claimed.");

  // Meaningful activity advances streak server-side
  const { onMeaningfulActivity } = await import("@/lib/luck/activity");
  await onMeaningfulActivity({ userId, kind: "daily", silentLuckNotify: true });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const streakBonus = Math.min(
    economy.maxStreakBonus,
    Math.max(0, user.streakDays - 1) * economy.streakBonusPerDay,
  );
  const amount = economy.dailyRewardBase + streakBonus;

  await prisma.dailyRewardClaim.create({
    data: {
      userId,
      claimDate: today,
      amount,
      streakDay: user.streakDays,
    },
  });

  await moveCredits({
    userId,
    amount,
    type: "earned_daily",
    description: `Daily reward (streak day ${user.streakDays})`,
    metadata: { streakDay: user.streakDays },
  });

  const { grantDailyLoginSpin } = await import("@/lib/luck/wheel");
  await grantDailyLoginSpin(userId);

  return { amount, streakDay: user.streakDays };
}
