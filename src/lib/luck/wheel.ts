import { prisma } from "@/lib/db";
import { getLuckEngineConfig } from "@/lib/luck/config";
import { awardLuck, recordRewardEvent } from "@/lib/luck/engine";
import { grantHits, grantTemporaryBoost } from "@/lib/luck/rewards";
import { maybeSpawnGlitterDrop } from "@/lib/luck/drops";
import { notifyUser } from "@/lib/notifications/service";

function pickSegment<T extends { weight: number }>(segments: T[]): T {
  const total = segments.reduce((s, i) => s + i.weight, 0);
  let roll = Math.floor(Math.random() * Math.max(1, total));
  for (const seg of segments) {
    roll -= seg.weight;
    if (roll < 0) return seg;
  }
  return segments[segments.length - 1];
}

export async function getWheelState(userId: string) {
  const [user, segments, history, config] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { wheelSpins: true },
    }),
    prisma.wheelSegment.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.wheelSpin.findMany({
      where: { userId, processed: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getLuckEngineConfig(),
  ]);
  return { spins: user.wheelSpins, segments, history, enabled: config.wheel.enabled };
}

/**
 * Idempotent spin: clientKey prevents double-credit on refresh.
 */
export async function spinWheel(userId: string, clientKey: string) {
  const key = clientKey.trim().slice(0, 64);
  if (key.length < 8) throw new Error("Invalid spin key.");

  const existing = await prisma.wheelSpin.findUnique({
    where: { userId_clientKey: { userId, clientKey: key } },
  });
  if (existing) {
    return { spin: existing, replay: true as const };
  }

  const config = await getLuckEngineConfig();
  if (!config.wheel.enabled) throw new Error("Wheel is disabled.");

  const segments = await prisma.wheelSegment.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (segments.length === 0) throw new Error("No wheel segments configured.");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.wheelSpins < 1) throw new Error("No spins available.");

  const segment = pickSegment(segments);

  // Deduct spin + create pending record atomically
  const spin = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: userId, wheelSpins: { gte: 1 } },
      data: { wheelSpins: { decrement: 1 } },
    });
    if (updated.count !== 1) throw new Error("No spins available.");

    return tx.wheelSpin.create({
      data: {
        userId,
        clientKey: key,
        segmentId: segment.id,
        rewardType: segment.rewardType,
        rewardValue: segment.rewardValue,
        rewardLabel: segment.label,
        processed: false,
      },
    });
  });

  // Apply rewards once
  if (segment.rewardType === "hits") {
    await grantHits({
      userId,
      amount: segment.rewardValue,
      type: "earned_wheel",
      description: `Glitter Wheel: ${segment.label}`,
      metadata: { spinId: spin.id },
    });
  } else if (segment.rewardType === "luck") {
    await awardLuck({
      userId,
      amount: segment.rewardValue,
      source: "wheel",
      description: segment.label,
      silent: true,
    });
  } else if (segment.rewardType === "spins") {
    await prisma.user.update({
      where: { id: userId },
      data: { wheelSpins: { increment: segment.rewardValue } },
    });
  } else if (segment.rewardType === "token") {
    await prisma.user.update({
      where: { id: userId },
      data: { questTokens: { increment: segment.rewardValue } },
    });
  } else if (segment.rewardType === "multiplier") {
    await grantTemporaryBoost({
      userId,
      multiplierPct: segment.rewardValue,
      durationMinutes: 20,
    });
  } else if (segment.rewardType === "drop") {
    await maybeSpawnGlitterDrop(userId);
  }

  const processed = await prisma.wheelSpin.update({
    where: { id: spin.id },
    data: { processed: true },
  });

  await recordRewardEvent({
    userId,
    kind: "wheel",
    title: "🎡 Glitter Wheel",
    body: segment.label,
    payload: { spinId: spin.id, segmentId: segment.id },
  });

  await notifyUser({
    userId,
    type: "wheel_result",
    title: "🎡 Wheel result",
    body: segment.label,
    href: "/luck/wheel",
  });

  return { spin: processed, segment, replay: false as const };
}

export async function grantDailyLoginSpin(userId: string) {
  const config = await getLuckEngineConfig();
  if (!config.wheel.enabled || !config.wheel.dailyLoginSpin) return false;

  const today = new Date().toISOString().slice(0, 10);
  const key = `daily_spin:${userId}:${today}`;
  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  if (existing) return false;

  await prisma.systemSetting.create({
    data: { key, valueJson: JSON.stringify({ granted: true }) },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { wheelSpins: { increment: 1 } },
  });
  return true;
}
