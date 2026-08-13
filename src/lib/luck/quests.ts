import { prisma } from "@/lib/db";
import { awardLuck, recordRewardEvent } from "@/lib/luck/engine";
import { grantHits } from "@/lib/luck/rewards";
import { notifyUser } from "@/lib/notifications/service";

type Requirement = {
  type: string;
  target: number;
};

function parseRequirement(json: string): Requirement {
  try {
    const raw = JSON.parse(json) as Requirement;
    return {
      type: raw.type || "surf",
      target: Math.max(1, Math.trunc(raw.target || 1)),
    };
  } catch {
    return { type: "surf", target: 1 };
  }
}

export async function ensureUserQuests(userId: string) {
  const now = new Date();
  const defs = await prisma.questDefinition.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
  });

  for (const def of defs) {
    const existing = await prisma.userQuest.findUnique({
      where: { userId_questId: { userId, questId: def.id } },
    });
    if (existing) {
      if (def.isRepeatable && existing.status === "claimed") {
        // allow one active repeat cycle
        continue;
      }
      continue;
    }
    const req = parseRequirement(def.requirementJson);
    await prisma.userQuest.create({
      data: {
        userId,
        questId: def.id,
        status: "active",
        progress: 0,
        target: req.target,
      },
    });
  }
}

async function metricFor(userId: string, type: string): Promise<number> {
  switch (type) {
    case "surf":
    case "first_surf":
      return prisma.visit.count({ where: { visitorUserId: userId, completed: true } });
    case "website":
      return prisma.website.count({ where: { userId } });
    case "campaign":
    case "promote":
      return prisma.campaign.count({ where: { userId, status: { not: "deleted" } } });
    case "referral":
      return prisma.referralEvent.count({
        where: { referrerId: userId, status: { in: ["activated", "qualified"] } },
      });
    case "streak":
      return (
        (await prisma.user.findUnique({ where: { id: userId } }))?.streakDays ?? 0
      );
    case "quests_completed":
      return prisma.userQuest.count({
        where: { userId, status: { in: ["completed", "claimed"] } },
      });
    case "mail_open":
      return prisma.mailReceipt.count({
        where: { recipientId: userId, readAt: { not: null } },
      });
    default:
      return 0;
  }
}

const KIND_TO_TYPES: Record<string, string[]> = {
  surf: ["surf", "first_surf"],
  website: ["website"],
  campaign: ["campaign", "promote"],
  placement: ["promote", "campaign"],
  referral: ["referral"],
  mail_open: ["mail_open"],
  daily: ["streak"],
  quest: ["quests_completed"],
};

export async function syncQuestProgress(userId: string, activityKind: string) {
  await ensureUserQuests(userId);
  const relevantTypes = KIND_TO_TYPES[activityKind] ?? [];
  if (relevantTypes.length === 0 && activityKind !== "quest") return;

  const active = await prisma.userQuest.findMany({
    where: { userId, status: "active" },
    include: { quest: true },
  });

  for (const uq of active) {
    const req = parseRequirement(uq.quest.requirementJson);
    if (
      relevantTypes.length &&
      !relevantTypes.includes(req.type) &&
      activityKind !== "quest"
    ) {
      continue;
    }
    const value = await metricFor(userId, req.type);
    const progress = Math.min(uq.target, value);
    if (progress === uq.progress && progress < uq.target) continue;

    if (progress >= uq.target) {
      await prisma.userQuest.update({
        where: { id: uq.id },
        data: {
          progress: uq.target,
          status: "completed",
          completedAt: new Date(),
        },
      });
      await notifyUser({
        userId,
        type: "quest_complete",
        title: `🎯 Quest ready: ${uq.quest.name}`,
        body: "Claim your reward!",
        href: "/luck/quests",
      });
    } else {
      await prisma.userQuest.update({
        where: { id: uq.id },
        data: { progress },
      });
    }
  }
}

export async function claimQuest(userId: string, userQuestId: string) {
  const uq = await prisma.userQuest.findFirst({
    where: { id: userQuestId, userId },
    include: { quest: true },
  });
  if (!uq) throw new Error("Quest not found.");
  if (uq.status !== "completed") throw new Error("Quest is not ready to claim.");

  const locked = await prisma.userQuest.updateMany({
    where: { id: uq.id, status: "completed" },
    data: { status: "claimed", claimedAt: new Date() },
  });
  if (locked.count !== 1) throw new Error("Already claimed.");

  const q = uq.quest;
  if (q.rewardHits > 0) {
    await grantHits({
      userId,
      amount: q.rewardHits,
      type: "earned_quest",
      description: `Quest: ${q.name}`,
      metadata: { questId: q.id },
    });
  }
  if (q.rewardLuck > 0) {
    await awardLuck({
      userId,
      amount: q.rewardLuck,
      source: "quest",
      description: `Quest: ${q.name}`,
      silent: true,
    });
  }
  if (q.rewardSpins > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { wheelSpins: { increment: q.rewardSpins } },
    });
  }
  if (q.rewardTokens > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { questTokens: { increment: q.rewardTokens } },
    });
  }
  if (q.rewardBadgeSlug) {
    const badge = await prisma.badgeDefinition.findUnique({
      where: { slug: q.rewardBadgeSlug },
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
    kind: "quest",
    title: `🎯 ${q.name}`,
    body: `Claimed · +${q.rewardHits} Hits · +${q.rewardLuck} Luck`,
    payload: { questId: q.id },
  });

  await syncQuestProgress(userId, "quest");
  return uq;
}

export async function listUserQuests(userId: string) {
  await ensureUserQuests(userId);
  return prisma.userQuest.findMany({
    where: { userId },
    include: { quest: true },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
}
