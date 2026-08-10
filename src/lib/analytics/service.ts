import { prisma } from "@/lib/db";

export async function getCampaignAnalytics(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: { website: true },
  });
  if (!campaign) throw new Error("Campaign not found.");

  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekStart = new Date(dayStart.getTime() - 6 * 86_400_000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const base = { campaignId, completed: true };

  const [total, today, week, month, visits] = await Promise.all([
    prisma.visit.count({ where: base }),
    prisma.visit.count({ where: { ...base, startedAt: { gte: dayStart } } }),
    prisma.visit.count({ where: { ...base, startedAt: { gte: weekStart } } }),
    prisma.visit.count({ where: { ...base, startedAt: { gte: monthStart } } }),
    prisma.visit.findMany({
      where: base,
      select: {
        actualDurationSec: true,
        deviceHint: true,
        countryCode: true,
        quality: true,
        sourceLabel: true,
      },
      take: 5000,
    }),
  ]);

  const avgDuration =
    visits.length === 0
      ? 0
      : Math.round(
          visits.reduce((s, v) => s + v.actualDurationSec, 0) / visits.length,
        );

  const deviceBreakdown: Record<string, number> = {};
  const countryBreakdown: Record<string, number> = {};
  const qualityBreakdown: Record<string, number> = {};
  for (const v of visits) {
    const d = v.deviceHint || "unknown";
    deviceBreakdown[d] = (deviceBreakdown[d] || 0) + 1;
    const c = v.countryCode || "unknown";
    countryBreakdown[c] = (countryBreakdown[c] || 0) + 1;
    qualityBreakdown[v.quality] = (qualityBreakdown[v.quality] || 0) + 1;
  }

  return {
    campaign,
    totals: {
      total,
      today,
      week,
      month,
      creditsSpent: campaign.creditsSpent,
      avgDuration,
      deliveryRate:
        campaign.creditBalance + campaign.creditsSpent > 0
          ? campaign.visitsDelivered /
            Math.max(1, Math.floor((campaign.creditBalance + campaign.creditsSpent)))
          : 0,
    },
    deviceBreakdown,
    countryBreakdown,
    qualityBreakdown,
    transparencyNote:
      "All visits are labeled as Glitter Hits exchange traffic. We never spoof organic, social, or search referrers.",
  };
}

export async function getUserOverviewStats(userId: string) {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const [user, earnedToday, deliveredToday, activeCampaigns, recentLedger, achievements] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.creditLedger.aggregate({
        where: {
          userId,
          amount: { gt: 0 },
          createdAt: { gte: dayStart },
        },
        _sum: { amount: true },
      }),
      prisma.visit.count({
        where: { ownerUserId: userId, completed: true, startedAt: { gte: dayStart } },
      }),
      prisma.campaign.count({ where: { userId, status: "active" } }),
      prisma.creditLedger.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { earnedAt: "desc" },
        take: 8,
      }),
    ]);

  const level = await prisma.levelDefinition.findUnique({ where: { slug: user.levelSlug } });

  return {
    user,
    level,
    earnedToday: earnedToday._sum.amount ?? 0,
    deliveredToday,
    activeCampaigns,
    recentLedger,
    achievements,
  };
}

export async function getAdminNetworkAnalytics() {
  const [users, activeCampaigns, visitsToday, creditsInCirculation, pendingSites] =
    await Promise.all([
      prisma.user.count(),
      prisma.campaign.count({ where: { status: "active" } }),
      prisma.visit.count({
        where: {
          completed: true,
          startedAt: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) },
        },
      }),
      prisma.user.aggregate({ _sum: { creditBalance: true } }),
      prisma.website.count({ where: { moderationStatus: "pending" } }),
    ]);

  return {
    users,
    activeCampaigns,
    visitsToday,
    creditsInCirculation: creditsInCirculation._sum.creditBalance ?? 0,
    pendingSites,
  };
}
