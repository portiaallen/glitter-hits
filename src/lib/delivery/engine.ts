import type {
  Campaign,
  DeviceTarget,
  PriorityTier,
  SurfSession,
  ViewerType,
  Website,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEconomySettings } from "@/lib/settings/economy";
import { parseJsonArray, parseJsonObject } from "@/lib/utils";

export type ViewerContext = {
  userId: string;
  countryCode?: string | null;
  deviceHint?: string | null; // desktop | mobile | tablet
  viewerType: ViewerType;
  now?: Date;
};

export type EligibleCampaign = Campaign & {
  website: Website;
  score: number;
};

const PRIORITY_WEIGHT: Record<PriorityTier, number> = {
  standard: 1,
  boosted: 2,
  featured: 4,
  premium: 8,
};

function deviceMatches(target: DeviceTarget, hint?: string | null): boolean {
  if (target === "all") return true;
  if (!hint) return true; // unknown device — allow, don't over-promise block
  return target === hint;
}

function geoMatches(geoJson: string, countryCode?: string | null): boolean {
  const geos = parseJsonArray(geoJson);
  if (geos.length === 0 || geos.includes("WW")) return true;
  if (!countryCode) return true;
  return geos.map((g) => g.toUpperCase()).includes(countryCode.toUpperCase());
}

function scheduleActive(
  scheduleJson: string,
  now: Date,
): boolean {
  const schedule = parseJsonObject<{
    mode?: string;
    days?: number[]; // 0-6
    hours?: number[]; // 0-23 UTC
  }>(scheduleJson, { mode: "always" });

  if (!schedule.mode || schedule.mode === "always") return true;
  if (schedule.days?.length && !schedule.days.includes(now.getUTCDay())) return false;
  if (schedule.hours?.length && !schedule.hours.includes(now.getUTCHours())) return false;
  return true;
}

async function withinFrequency(
  campaignId: string,
  viewerUserId: string,
  frequencyCapHours: number,
  now: Date,
): Promise<boolean> {
  const cooldown = await prisma.campaignViewerCooldown.findUnique({
    where: {
      campaignId_viewerUserId: { campaignId, viewerUserId },
    },
  });
  if (!cooldown) return true;
  const elapsedMs = now.getTime() - cooldown.lastSeenAt.getTime();
  return elapsedMs >= frequencyCapHours * 60 * 60 * 1000;
}

async function withinHourlyDailyCaps(campaign: Campaign, now: Date): Promise<boolean> {
  if (campaign.hourlyVisitCap) {
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourly = await prisma.visit.count({
      where: {
        campaignId: campaign.id,
        completed: true,
        startedAt: { gte: hourAgo },
      },
    });
    if (hourly >= campaign.hourlyVisitCap) return false;
  }
  if (campaign.dailyVisitCap) {
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const daily = await prisma.visit.count({
      where: {
        campaignId: campaign.id,
        completed: true,
        startedAt: { gte: dayStart },
      },
    });
    if (daily >= campaign.dailyVisitCap) return false;
  }
  return true;
}

/**
 * Smart delivery engine — selects the next eligible campaign for a viewer.
 * Fair weighted random among priority tiers. Does NOT guarantee volume.
 */
export async function selectNextCampaign(
  ctx: ViewerContext,
): Promise<EligibleCampaign | null> {
  const now = ctx.now ?? new Date();
  const economy = await getEconomySettings();

  const candidates = await prisma.campaign.findMany({
    where: {
      status: "active",
      creditBalance: { gte: economy.creditsChargedPerVisit },
      website: { moderationStatus: "approved" },
      NOT: { userId: ctx.userId },
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    include: { website: true },
    take: 200,
  });

  const filtered: EligibleCampaign[] = [];

  for (const c of candidates) {
    if (c.maxVisits != null && c.visitsDelivered >= c.maxVisits) continue;
    if (!deviceMatches(c.deviceTarget, ctx.deviceHint)) continue;
    if (!geoMatches(c.geoTargetsJson, ctx.countryCode)) continue;
    if (!scheduleActive(c.scheduleJson, now)) continue;
    if (!(await withinFrequency(c.id, ctx.userId, c.frequencyCapHours, now))) continue;
    if (!(await withinHourlyDailyCaps(c, now))) continue;

    const score = PRIORITY_WEIGHT[c.priority] * (1 + Math.random());
    filtered.push({ ...c, score });
  }

  if (filtered.length === 0) return null;
  filtered.sort((a, b) => b.score - a.score);
  return filtered[0];
}

export async function estimateNetworkAvailability(): Promise<{
  activeCampaigns: number;
  availableCredits: number;
  estimatedVisitsPerDay: number;
  note: string;
}> {
  const economy = await getEconomySettings();
  const active = await prisma.campaign.findMany({
    where: { status: "active", creditBalance: { gt: 0 }, website: { moderationStatus: "approved" } },
    select: { creditBalance: true },
  });
  const availableCredits = active.reduce((s, c) => s + c.creditBalance, 0);
  const charge = Math.max(1, economy.creditsChargedPerVisit);
  return {
    activeCampaigns: active.length,
    availableCredits,
    estimatedVisitsPerDay: Math.floor(availableCredits / charge),
    note: "Estimates reflect current campaign credit inventory only — not a delivery guarantee.",
  };
}

export type StartVisitResult = {
  visitId: string;
  campaignId: string;
  website: Website;
  requiredDurationSec: number;
  creditsEarnedIfComplete: number;
};

export async function startVisit(params: {
  session: SurfSession;
  campaign: Campaign & { website: Website };
  visitorUserId: string;
  countryCode?: string | null;
  deviceHint?: string | null;
}): Promise<StartVisitResult> {
  const economy = await getEconomySettings();
  let earn = economy.creditsPerCompletedSurf;
  if (params.session.viewerType === "automated_viewer") {
    earn = Math.floor((earn * economy.automatedViewerMultiplier) / 100);
  }

  const visit = await prisma.visit.create({
    data: {
      campaignId: params.campaign.id,
      websiteId: params.campaign.websiteId,
      ownerUserId: params.campaign.userId,
      visitorUserId: params.visitorUserId,
      surfSessionId: params.session.id,
      quality:
        params.session.viewerType === "automated_viewer"
          ? "automated_viewer"
          : params.session.viewerType === "admin_test"
            ? "admin_test"
            : "human_exchange",
      viewerType: params.session.viewerType,
      requiredDurationSec: params.campaign.visitDurationSec,
      countryCode: params.countryCode ?? undefined,
      deviceHint: params.deviceHint ?? undefined,
      sourceLabel: "glitter_hits_exchange",
      creditsEarned: earn,
    },
  });

  await prisma.campaignViewerCooldown.upsert({
    where: {
      campaignId_viewerUserId: {
        campaignId: params.campaign.id,
        viewerUserId: params.visitorUserId,
      },
    },
    create: {
      campaignId: params.campaign.id,
      viewerUserId: params.visitorUserId,
      lastSeenAt: new Date(),
    },
    update: { lastSeenAt: new Date() },
  });

  return {
    visitId: visit.id,
    campaignId: params.campaign.id,
    website: params.campaign.website,
    requiredDurationSec: params.campaign.visitDurationSec,
    creditsEarnedIfComplete: earn,
  };
}
