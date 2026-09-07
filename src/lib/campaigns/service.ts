import { z } from "zod";
import { prisma } from "@/lib/db";
import { allocateCreditsToCampaign } from "@/lib/credits/ledger";
import { getEconomySettings } from "@/lib/settings/economy";
import { checkAchievements } from "@/lib/rewards/achievements";
import { validateWebsiteUrl } from "@/lib/moderation/site-check";
import {
  assertCampaignPriorityAllowed,
  assertWebsiteSlotAvailable,
} from "@/lib/membership/entitlements";

export { validateWebsiteUrl };

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

export async function createWebsite(userId: string, raw: z.infer<typeof websiteInputSchema>) {
  const data = websiteInputSchema.parse(raw);
  await assertWebsiteSlotAvailable(userId);
  const check = await validateWebsiteUrl(data.url);

  if (check.status === "rejected") {
    throw new Error(check.notes.join(" ") || "Website URL was rejected.");
  }

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

  const { onMeaningfulActivity } = await import("@/lib/luck/activity");
  await onMeaningfulActivity({ userId, kind: "website", silentLuckNotify: true });

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

  const priority = data.priority ?? "standard";
  await assertCampaignPriorityAllowed(userId, priority);

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
      priority,
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
  const { onMeaningfulActivity } = await import("@/lib/luck/activity");
  await onMeaningfulActivity({ userId, kind: "campaign", silentLuckNotify: true });
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
  if (status === "deleted" && campaign.creditBalance > 0) {
    throw new Error("Move or spend remaining campaign credits before deleting.");
  }
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
