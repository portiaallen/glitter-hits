import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";

export async function grantHits(params: {
  userId: string;
  amount: number;
  type:
    | "earned_drop"
    | "earned_jackpot"
    | "earned_wheel"
    | "earned_quest"
    | "earned_challenge"
    | "earned_streak"
    | "earned_bonus";
  description: string;
  metadata?: Record<string, unknown>;
}) {
  if (params.amount <= 0) return null;
  return moveCredits({
    userId: params.userId,
    amount: params.amount,
    type: params.type,
    description: params.description,
    metadata: params.metadata,
  });
}

export async function grantTemporaryBoost(params: {
  userId: string;
  multiplierPct: number;
  durationMinutes: number;
}) {
  const expires = new Date(Date.now() + params.durationMinutes * 60_000);
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      boostMultiplier: params.multiplierPct,
      boostExpiresAt: expires,
    },
  });
}

export async function applyBoostedSurfEarnings(userId: string, base: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.boostExpiresAt && user.boostExpiresAt > new Date() && user.boostMultiplier > 100) {
    return Math.max(1, Math.floor((base * user.boostMultiplier) / 100));
  }
  return base;
}
