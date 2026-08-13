import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications/service";
import { getLuckEngineConfig } from "@/lib/luck/config";

export async function refreshLuckLevel(userId: string, tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma;
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const levels = await db.luckLevelDefinition.findMany({
    where: { isActive: true },
    orderBy: { minLuck: "desc" },
  });
  const match =
    levels.find((l) => user.luckPoints >= l.minLuck) ?? levels[levels.length - 1];
  if (match && match.slug !== user.luckLevelSlug) {
    await db.user.update({
      where: { id: userId },
      data: { luckLevelSlug: match.slug },
    });
    if (!tx) {
      await notifyUser({
        userId,
        type: "luck_level_up",
        title: `✨ Luck Level — ${match.name}`,
        body: `You reached ${match.icon} ${match.name}. ${match.description || ""}`.trim(),
        href: "/dashboard",
      });
      await prisma.rewardEvent.create({
        data: {
          userId,
          kind: "luck_level",
          title: `Luck Level ${match.name}`,
          body: `Reached ${match.name}`,
          payloadJson: JSON.stringify({ slug: match.slug }),
        },
      });
    }
    return match;
  }
  return match ?? null;
}

export async function awardLuck(params: {
  userId: string;
  amount: number;
  source: string;
  description: string;
  metadata?: Record<string, unknown>;
  tx?: Prisma.TransactionClient;
  silent?: boolean;
}) {
  const amount = Math.trunc(params.amount);
  if (amount <= 0) return null;

  const run = async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: params.userId } });
    const next = user.luckPoints + amount;
    await tx.user.update({
      where: { id: params.userId },
      data: { luckPoints: next },
    });
    const entry = await tx.luckLedger.create({
      data: {
        userId: params.userId,
        amount,
        balanceAfter: next,
        source: params.source,
        description: params.description,
        metadataJson: JSON.stringify(params.metadata ?? {}),
      },
    });
    await refreshLuckLevel(params.userId, tx);
    return entry;
  };

  if (params.tx) return run(params.tx);
  const entry = await prisma.$transaction(run);
  if (!params.silent) {
    await notifyUser({
      userId: params.userId,
      type: "luck_earned",
      title: `✨ +${amount} Luck`,
      body: params.description,
      href: "/dashboard",
    });
  }
  return entry;
}

export async function getLuckStatus(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const levels = await prisma.luckLevelDefinition.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const current =
    [...levels].reverse().find((l) => user.luckPoints >= l.minLuck) ?? levels[0];
  const currentIdx = levels.findIndex((l) => l.slug === current?.slug);
  const next = levels[currentIdx + 1] ?? null;
  const floor = current?.minLuck ?? 0;
  const ceiling = next?.minLuck ?? floor + 100;
  const span = Math.max(1, ceiling - floor);
  const progress = next
    ? Math.min(100, Math.max(0, Math.floor(((user.luckPoints - floor) / span) * 100)))
    : 100;

  const config = await getLuckEngineConfig();
  return {
    luckPoints: user.luckPoints,
    level: current,
    nextLevel: next,
    progressPct: progress,
    wheelSpins: user.wheelSpins,
    questTokens: user.questTokens,
    streakDays: user.streakDays,
    longestStreak: user.longestStreak,
    hits: user.creditBalance,
    boostMultiplier: user.boostMultiplier,
    boostExpiresAt: user.boostExpiresAt,
    personaId: user.personaId,
    mantra: config.mantra,
  };
}

export async function recordRewardEvent(params: {
  userId: string;
  kind: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}) {
  return prisma.rewardEvent.create({
    data: {
      userId: params.userId,
      kind: params.kind,
      title: params.title,
      body: params.body,
      payloadJson: JSON.stringify(params.payload ?? {}),
    },
  });
}

export async function listRecentRewardEvents(userId: string, limit = 20) {
  return prisma.rewardEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
