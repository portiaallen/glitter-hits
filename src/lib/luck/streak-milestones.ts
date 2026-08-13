import { prisma } from "@/lib/db";
import { awardLuck, recordRewardEvent } from "@/lib/luck/engine";
import { grantHits } from "@/lib/luck/rewards";
import { notifyUser } from "@/lib/notifications/service";

export async function processStreakMilestones(userId: string, streakDays: number) {
  const milestones = await prisma.streakMilestone.findMany({
    where: { isActive: true, days: { lte: streakDays } },
    orderBy: { days: "asc" },
  });

  for (const m of milestones) {
    const existing = await prisma.streakMilestoneClaim.findUnique({
      where: { userId_milestoneId: { userId, milestoneId: m.id } },
    });
    if (existing) continue;

    await prisma.streakMilestoneClaim.create({
      data: { userId, milestoneId: m.id },
    });

    if (m.rewardHits > 0) {
      await grantHits({
        userId,
        amount: m.rewardHits,
        type: "earned_streak",
        description: `Streak milestone: ${m.name}`,
        metadata: { days: m.days },
      });
    }
    if (m.rewardLuck > 0) {
      await awardLuck({
        userId,
        amount: m.rewardLuck,
        source: "streak",
        description: m.name,
        silent: true,
      });
    }
    if (m.rewardSpins > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { wheelSpins: { increment: m.rewardSpins } },
      });
    }
    if (m.badgeSlug) {
      const badge = await prisma.badgeDefinition.findUnique({
        where: { slug: m.badgeSlug },
      });
      if (badge) {
        await prisma.userBadge.upsert({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          create: { userId, badgeId: badge.id },
          update: {},
        });
      }
    }

    await recordRewardEvent({
      userId,
      kind: "streak",
      title: `🔥 ${m.name}`,
      body: `${m.days}-day streak unlocked`,
      payload: { milestoneId: m.id, days: m.days },
    });

    await notifyUser({
      userId,
      type: "streak_milestone",
      title: `🔥 ${m.name}`,
      body: m.description || `${m.days}-day streak!`,
      href: "/dashboard",
    });
  }
}
