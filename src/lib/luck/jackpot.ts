import { prisma } from "@/lib/db";
import { getLuckEngineConfig } from "@/lib/luck/config";
import { awardLuck, recordRewardEvent } from "@/lib/luck/engine";
import { grantHits, grantTemporaryBoost } from "@/lib/luck/rewards";
import { notifyUser } from "@/lib/notifications/service";
import { rateLimit } from "@/lib/anti-abuse/rate-limit";

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = Math.floor(Math.random() * Math.max(1, total));
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}

export async function maybeTriggerJackpot(userId: string, source: string) {
  const config = await getLuckEngineConfig();
  if (!config.jackpot.enabled || config.jackpot.rewards.length === 0) return null;

  const userRl = rateLimit({
    key: `jackpot-user:${userId}`,
    limit: config.jackpot.maxDailyPerUser,
    windowMs: 86_400_000,
  });
  if (!userRl.ok) return null;

  const globalRl = rateLimit({
    key: "jackpot-global",
    limit: config.jackpot.maxDailyGlobal,
    windowMs: 86_400_000,
  });
  if (!globalRl.ok) return null;

  const cool = rateLimit({
    key: `jackpot-cool:${userId}`,
    limit: 1,
    windowMs: config.jackpot.cooldownSeconds * 1000,
  });
  if (!cool.ok) return null;

  if (Math.floor(Math.random() * 10_000) >= config.jackpot.chancePerActivityBps) {
    return null;
  }

  const reward = pickWeighted(config.jackpot.rewards);

  if (reward.type === "hits") {
    await grantHits({
      userId,
      amount: reward.value,
      type: "earned_jackpot",
      description: `Glitter Jackpot: ${reward.label}`,
      metadata: { source },
    });
  } else if (reward.type === "luck") {
    await awardLuck({
      userId,
      amount: reward.value,
      source: "jackpot",
      description: reward.label,
      silent: true,
    });
  } else if (reward.type === "multiplier") {
    await grantTemporaryBoost({
      userId,
      multiplierPct: reward.value,
      durationMinutes: 30,
    });
  }

  await prisma.jackpotWin.create({
    data: {
      userId,
      rewardType: reward.type,
      rewardValue: reward.value,
      rewardLabel: reward.label,
      source,
    },
  });

  await recordRewardEvent({
    userId,
    kind: "jackpot",
    title: "💎 Glitter Jackpot!",
    body: reward.label,
    payload: reward,
  });

  await notifyUser({
    userId,
    type: "jackpot",
    title: "💎 JACKPOT!",
    body: reward.label,
    href: "/dashboard",
  });

  return { label: reward.label, type: reward.type, value: reward.value };
}
