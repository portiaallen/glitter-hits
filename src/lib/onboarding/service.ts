import { prisma } from "@/lib/db";
import { estimateNetworkAvailability } from "@/lib/delivery/engine";
import { getEconomySettings } from "@/lib/settings/economy";

export type OnboardingState = {
  done: boolean;
  steps: {
    key: string;
    label: string;
    href: string;
    complete: boolean;
  }[];
  completedCount: number;
};

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.onboardingDoneAt) {
    return { done: true, steps: [], completedCount: 0 };
  }

  const [sites, approved, campaigns, funded, surfed] = await Promise.all([
    prisma.website.count({ where: { userId } }),
    prisma.website.count({ where: { userId, moderationStatus: "approved" } }),
    prisma.campaign.count({ where: { userId, status: { not: "deleted" } } }),
    prisma.campaign.count({ where: { userId, creditBalance: { gt: 0 } } }),
    prisma.visit.count({ where: { visitorUserId: userId, completed: true } }),
  ]);

  const steps = [
    {
      key: "add_site",
      label: "Add your first website",
      href: "/websites/new",
      complete: sites > 0,
    },
    {
      key: "get_approved",
      label: "Get a site approved",
      href: "/websites",
      complete: approved > 0,
    },
    {
      key: "create_campaign",
      label: "Create a campaign",
      href: "/campaigns/new",
      complete: campaigns > 0,
    },
    {
      key: "allocate_hits",
      label: "Allocate Glitter Hits to a campaign",
      href: "/campaigns",
      complete: funded > 0,
    },
    {
      key: "first_surf",
      label: "Complete your first Surf discovery",
      href: "/surf",
      complete: surfed > 0,
    },
  ];

  const completedCount = steps.filter((s) => s.complete).length;
  const allDone = completedCount === steps.length;
  if (allDone) {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingDoneAt: new Date() },
    });
    return { done: true, steps: [], completedCount };
  }
  return {
    done: false,
    steps,
    completedCount,
  };
}

export async function dismissOnboarding(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingDoneAt: new Date() },
  });
}

/** Campaign-level delivery estimate — honest, inventory-based, not a guarantee. */
export async function estimateCampaignDelivery(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: { website: true },
  });
  if (!campaign) throw new Error("Campaign not found.");

  const economy = await getEconomySettings();
  const network = await estimateNetworkAvailability();
  const charge = Math.max(1, economy.creditsChargedPerVisit);
  const hitsRemaining = Math.floor(campaign.creditBalance / charge);

  // Share of network attention approximated by priority weight
  const priorityShare: Record<string, number> = {
    standard: 0.15,
    boosted: 0.25,
    featured: 0.35,
    premium: 0.5,
  };
  const share = priorityShare[campaign.priority] ?? 0.15;
  const estimatedDaily = Math.min(
    hitsRemaining,
    Math.max(0, Math.floor(network.estimatedVisitsPerDay * share)),
  );

  // Active surfers in last 24h as a soft demand signal
  const activeSurfers = await prisma.surfSession.count({
    where: { startedAt: { gte: new Date(Date.now() - 86_400_000) } },
  });

  return {
    campaignId: campaign.id,
    hitsRemaining,
    creditsRemaining: campaign.creditBalance,
    visitsDelivered: campaign.visitsDelivered,
    estimatedDaily,
    activeSurfers24h: activeSurfers,
    networkCampaigns: network.activeCampaigns,
    note: network.note,
  };
}

export async function getDashboardDeliverySummary(userId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { userId, status: { in: ["active", "paused", "exhausted"] } },
    include: { website: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });
  const economy = await getEconomySettings();
  const charge = Math.max(1, economy.creditsChargedPerVisit);
  const network = await estimateNetworkAvailability();

  return {
    network,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      websiteTitle: c.website.title,
      hitsRemaining: Math.floor(c.creditBalance / charge),
      creditsRemaining: c.creditBalance,
      visitsDelivered: c.visitsDelivered,
      priority: c.priority,
    })),
    totalHitsRemaining: campaigns.reduce(
      (s, c) => s + Math.floor(c.creditBalance / charge),
      0,
    ),
  };
}
