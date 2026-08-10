import { z } from "zod";
import { prisma } from "@/lib/db";
import { allocateCreditsToCampaign } from "@/lib/credits/ledger";
import { getEconomySettings } from "@/lib/settings/economy";
import { checkAchievements } from "@/lib/rewards/achievements";

export const websiteInputSchema = z.object({
  url: z.string().url().max(2048),
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string().max(40)).max(12).optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
});

export const campaignInputSchema = z.object({
  websiteId: z.string(),
  name: z.string().min(2).max(120),
  visitDurationSec: z.number().int().min(10).max(120).optional(),
  maxVisits: z.number().int().positive().optional().nullable(),
  dailyVisitCap: z.number().int().positive().optional().nullable(),
  hourlyVisitCap: z.number().int().positive().optional().nullable(),
  frequencyCapHours: z.number().int().min(1).max(168).optional(),
  priority: z.enum(["standard", "boosted", "featured", "premium"]).optional(),
  deliveryMode: z.enum(["fastest", "evenly", "custom"]).optional(),
  geoTargets: z.array(z.string()).optional(),
  deviceTarget: z.enum(["all", "desktop", "mobile", "tablet"]).optional(),
  schedule: z
    .object({
      mode: z.enum(["always", "custom"]),
      days: z.array(z.number().int().min(0).max(6)).optional(),
      hours: z.array(z.number().int().min(0).max(23)).optional(),
    })
    .optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  creditAllocation: z.number().int().min(0).optional(),
});

function isHttps(url: string) {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/** Basic reachability + safety checks. Soft-fails to pending for admin review. */
export async function validateWebsiteUrl(url: string): Promise<{
  ok: boolean;
  httpsOk: boolean;
  status: "approved" | "pending" | "rejected";
  notes: string[];
}> {
  const notes: string[] = [];
  let httpsOk = isHttps(url);
  if (!httpsOk) notes.push("URL is not HTTPS.");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "GlitterHits-SiteChecker/1.0" },
    }).catch(async () =>
      fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "GlitterHits-SiteChecker/1.0" },
      }),
    );
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      notes.push(`Redirect detected (${res.status}).`);
      const loc = res.headers.get("location");
      if (loc && !isHttps(loc) && !loc.startsWith("/")) {
        notes.push("Redirect target is not HTTPS.");
        httpsOk = false;
      }
    }
    if (res.status >= 400) {
      notes.push(`URL returned HTTP ${res.status}.`);
      return { ok: false, httpsOk, status: "pending", notes };
    }
  } catch {
    notes.push("Could not reach URL — queued for admin review.");
    return { ok: false, httpsOk, status: "pending", notes };
  }

  // Auto-approve clean HTTPS sites; otherwise pending
  if (httpsOk && notes.length === 0) {
    return { ok: true, httpsOk, status: "approved", notes };
  }
  return { ok: true, httpsOk, status: "pending", notes };
}

export async function createWebsite(userId: string, raw: z.infer<typeof websiteInputSchema>) {
  const data = websiteInputSchema.parse(raw);
  const check = await validateWebsiteUrl(data.url);

  const website = await prisma.website.create({
    data: {
      userId,
      url: data.url,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId || null,
      thumbnailUrl: data.thumbnailUrl || null,
      httpsOk: check.httpsOk,
      moderationStatus: check.status,
      moderationNotes: check.notes.join(" ") || null,
      lastCheckedAt: new Date(),
    },
  });

  if (data.tags?.length) {
    for (const tagName of data.tags) {
      const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const tag = await prisma.tag.upsert({
        where: { slug },
        create: { slug, name: tagName },
        update: {},
      });
      await prisma.websiteTag.create({
        data: { websiteId: website.id, tagId: tag.id },
      });
    }
  }

  return website;
}

export async function createCampaign(
  userId: string,
  raw: z.infer<typeof campaignInputSchema>,
) {
  const data = campaignInputSchema.parse(raw);
  const economy = await getEconomySettings();
  const website = await prisma.website.findFirst({
    where: { id: data.websiteId, userId },
  });
  if (!website) throw new Error("Website not found.");
  if (website.moderationStatus === "blocked" || website.moderationStatus === "rejected") {
    throw new Error("Website is not eligible for campaigns.");
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId,
      websiteId: data.websiteId,
      name: data.name,
      status: "draft",
      visitDurationSec: data.visitDurationSec ?? economy.defaultVisitDurationSec,
      maxVisits: data.maxVisits ?? null,
      dailyVisitCap: data.dailyVisitCap ?? null,
      hourlyVisitCap: data.hourlyVisitCap ?? null,
      frequencyCapHours: data.frequencyCapHours ?? 24,
      priority: data.priority ?? "standard",
      deliveryMode: data.deliveryMode ?? "evenly",
      geoTargetsJson: JSON.stringify(data.geoTargets ?? ["WW"]),
      deviceTarget: data.deviceTarget ?? "all",
      scheduleJson: JSON.stringify(data.schedule ?? { mode: "always" }),
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
    },
  });

  if (data.creditAllocation && data.creditAllocation > 0) {
    await allocateCreditsToCampaign({
      userId,
      campaignId: campaign.id,
      amount: data.creditAllocation,
    });
  }

  await checkAchievements(userId);
  return prisma.campaign.findUniqueOrThrow({
    where: { id: campaign.id },
    include: { website: true },
  });
}

export async function setCampaignStatus(
  userId: string,
  campaignId: string,
  status: "active" | "paused" | "archived" | "deleted",
) {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
  if (!campaign) throw new Error("Campaign not found.");
  return prisma.campaign.update({
    where: { id: campaignId },
    data: { status },
  });
}

export async function duplicateCampaign(userId: string, campaignId: string) {
  const source = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
  if (!source) throw new Error("Campaign not found.");
  return prisma.campaign.create({
    data: {
      userId,
      websiteId: source.websiteId,
      name: `${source.name} (copy)`,
      status: "draft",
      visitDurationSec: source.visitDurationSec,
      maxVisits: source.maxVisits,
      dailyVisitCap: source.dailyVisitCap,
      hourlyVisitCap: source.hourlyVisitCap,
      frequencyCapHours: source.frequencyCapHours,
      priority: source.priority,
      deliveryMode: source.deliveryMode,
      geoTargetsJson: source.geoTargetsJson,
      regionTargetsJson: source.regionTargetsJson,
      deviceTarget: source.deviceTarget,
      scheduleJson: source.scheduleJson,
      creditBalance: 0,
    },
  });
}
