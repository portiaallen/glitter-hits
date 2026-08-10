import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";

export async function checkAchievements(userId: string) {
  const [user, defs, sitesViewed, campaigns, referrals] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.achievementDefinition.findMany({ where: { isActive: true } }),
    prisma.visit.count({ where: { visitorUserId: userId, completed: true } }),
    prisma.campaign.count({ where: { userId } }),
    prisma.referralEvent.count({
      where: { referrerId: userId, status: { in: ["activated", "qualified"] } },
    }),
  ]);

  const owned = new Set(
    (
      await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      })
    ).map((a) => a.achievementId),
  );

  const activeCampaigns = await prisma.campaign.count({
    where: { userId, status: "active" },
  });

  for (const def of defs) {
    if (owned.has(def.id)) continue;
    let criteria: Record<string, number> = {};
    try {
      criteria = JSON.parse(def.criteriaJson) as Record<string, number>;
    } catch {
      criteria = {};
    }

    let earned = false;
    if (criteria.firstSurf && sitesViewed >= 1) earned = true;
    if (criteria.sitesDiscovered && sitesViewed >= criteria.sitesDiscovered) earned = true;
    if (criteria.hitsEarned && user.lifetimeEarned >= criteria.hitsEarned) earned = true;
    if (criteria.firstCampaign && campaigns >= 1) earned = true;
    if (criteria.firstReferral && referrals >= 1) earned = true;
    if (criteria.activeCampaigns && activeCampaigns >= criteria.activeCampaigns) earned = true;

    if (!earned) continue;

    await prisma.userAchievement.create({
      data: { userId, achievementId: def.id },
    });

    if (def.creditReward > 0) {
      await moveCredits({
        userId,
        amount: def.creditReward,
        type: "earned_achievement",
        description: `Achievement: ${def.name}`,
        achievementId: def.id,
      });
    }

    if (def.pointsReward > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { levelPoints: { increment: def.pointsReward } },
      });
      await refreshLevel(userId);
    }
  }
}

export async function refreshLevel(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const levels = await prisma.levelDefinition.findMany({ orderBy: { minPoints: "desc" } });
  const match = levels.find((l) => user.levelPoints >= l.minPoints) ?? levels[levels.length - 1];
  if (match && match.slug !== user.levelSlug) {
    await prisma.user.update({
      where: { id: userId },
      data: { levelSlug: match.slug },
    });
  }
  return match;
}
