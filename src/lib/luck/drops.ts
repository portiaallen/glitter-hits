import type { RewardRarity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getLuckEngineConfig } from "@/lib/luck/config";
import { awardLuck, recordRewardEvent } from "@/lib/luck/engine";
import { grantHits, grantTemporaryBoost } from "@/lib/luck/rewards";
import { notifyUser } from "@/lib/notifications/service";
import { rateLimit } from "@/lib/anti-abuse/rate-limit";

const DROP_TABLE: {
  rarity: RewardRarity;
  weight: number;
  rewards: { type: string; value: number; label: string }[];
}[] = [
  {
    rarity: "common",
    weight: 55,
    rewards: [
      { type: "hits", value: 5, label: "+5 Hits" },
      { type: "hits", value: 10, label: "+10 Hits" },
      { type: "luck", value: 3, label: "+3 Luck" },
    ],
  },
  {
    rarity: "uncommon",
    weight: 25,
    rewards: [
      { type: "hits", value: 25, label: "+25 Hits" },
      { type: "luck", value: 10, label: "+10 Luck" },
      { type: "spins", value: 1, label: "+1 Wheel spin" },
    ],
  },
  {
    rarity: "rare",
    weight: 12,
    rewards: [
      { type: "hits", value: 75, label: "+75 Hits" },
      { type: "luck", value: 25, label: "+25 Luck" },
      { type: "token", value: 1, label: "+1 Quest token" },
    ],
  },
  {
    rarity: "epic",
    weight: 6,
    rewards: [
      { type: "hits", value: 150, label: "+150 Hits" },
      { type: "multiplier", value: 150, label: "1.5X Surf · 20 min" },
      { type: "spins", value: 2, label: "+2 Wheel spins" },
    ],
  },
  {
    rarity: "diamond",
    weight: 2,
    rewards: [
      { type: "hits", value: 500, label: "+500 Hits · Diamond Drop" },
      { type: "luck", value: 100, label: "+100 Luck · Diamond" },
      { type: "multiplier", value: 200, label: "2X Surf · 30 min" },
    ],
  },
];

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.floor(Math.random() * total);
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}

export async function maybeSpawnGlitterDrop(userId: string) {
  const config = await getLuckEngineConfig();
  if (!config.drops.enabled) return null;

  const rl = rateLimit({
    key: `drop-spawn:${userId}`,
    limit: 1,
    windowMs: config.drops.cooldownSeconds * 1000,
  });
  if (!rl.ok) return null;

  const pending = await prisma.glitterDrop.count({
    where: { userId, status: "pending", expiresAt: { gt: new Date() } },
  });
  if (pending >= config.drops.maxPending) return null;

  if (Math.floor(Math.random() * 10_000) >= config.drops.chancePerSurfBps) {
    return null;
  }

  const band = pickWeighted(DROP_TABLE);
  const reward = band.rewards[Math.floor(Math.random() * band.rewards.length)];
  const drop = await prisma.glitterDrop.create({
    data: {
      userId,
      rarity: band.rarity,
      rewardType: reward.type,
      rewardValue: reward.value,
      rewardLabel: reward.label,
      status: "pending",
      expiresAt: new Date(Date.now() + config.drops.ttlSeconds * 1000),
    },
  });

  await notifyUser({
    userId,
    type: "glitter_drop",
    title: "✨ A Glitter Drop has appeared!",
    body: "Claim it before it disappears.",
    href: "/dashboard",
  });

  return drop;
}

export async function claimGlitterDrop(userId: string, dropId: string) {
  const drop = await prisma.glitterDrop.findFirst({
    where: { id: dropId, userId },
  });
  if (!drop) throw new Error("Drop not found.");
  if (drop.status !== "pending") throw new Error("Drop already claimed or expired.");
  if (drop.expiresAt <= new Date()) {
    await prisma.glitterDrop.update({
      where: { id: drop.id },
      data: { status: "expired" },
    });
    throw new Error("Drop expired.");
  }

  // Atomic claim
  const claimed = await prisma.glitterDrop.updateMany({
    where: { id: drop.id, status: "pending" },
    data: { status: "claimed", claimedAt: new Date() },
  });
  if (claimed.count !== 1) throw new Error("Drop already claimed.");

  if (drop.rewardType === "hits") {
    await grantHits({
      userId,
      amount: drop.rewardValue,
      type: "earned_drop",
      description: `Glitter Drop (${drop.rarity}): ${drop.rewardLabel}`,
      metadata: { dropId: drop.id },
    });
  } else if (drop.rewardType === "luck") {
    await awardLuck({
      userId,
      amount: drop.rewardValue,
      source: "drop",
      description: `Glitter Drop (${drop.rarity})`,
      silent: true,
    });
  } else if (drop.rewardType === "spins") {
    await prisma.user.update({
      where: { id: userId },
      data: { wheelSpins: { increment: drop.rewardValue } },
    });
  } else if (drop.rewardType === "token") {
    await prisma.user.update({
      where: { id: userId },
      data: { questTokens: { increment: drop.rewardValue } },
    });
  } else if (drop.rewardType === "multiplier") {
    await grantTemporaryBoost({
      userId,
      multiplierPct: drop.rewardValue,
      durationMinutes: 20,
    });
  }

  await recordRewardEvent({
    userId,
    kind: "drop",
    title: `✨ ${drop.rarity} Glitter Drop`,
    body: drop.rewardLabel,
    payload: { dropId: drop.id, rarity: drop.rarity },
  });

  await notifyUser({
    userId,
    type: "drop_claimed",
    title: `✨ Claimed ${drop.rarity} Drop`,
    body: drop.rewardLabel,
    href: "/dashboard",
  });

  return drop;
}

export async function getPendingDrop(userId: string) {
  await prisma.glitterDrop.updateMany({
    where: { userId, status: "pending", expiresAt: { lte: new Date() } },
    data: { status: "expired" },
  });
  return prisma.glitterDrop.findFirst({
    where: { userId, status: "pending", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}
