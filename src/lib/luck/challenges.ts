import { prisma } from "@/lib/db";
import { grantHits } from "@/lib/luck/rewards";
import { notifyUser } from "@/lib/notifications/service";
import { recordRewardEvent } from "@/lib/luck/engine";

export async function contributeToChallenges(
  userId: string,
  metric: string,
  amount: number,
) {
  const now = new Date();
  const challenges = await prisma.communityChallenge.findMany({
    where: {
      status: "active",
      metric,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
  });

  for (const challenge of challenges) {
    await prisma.$transaction(async (tx) => {
      await tx.communityChallenge.update({
        where: { id: challenge.id },
        data: { progress: { increment: amount } },
      });
      await tx.challengeContribution.upsert({
        where: {
          challengeId_userId: { challengeId: challenge.id, userId },
        },
        create: { challengeId: challenge.id, userId, amount },
        update: { amount: { increment: amount } },
      });
    });

    const fresh = await prisma.communityChallenge.findUniqueOrThrow({
      where: { id: challenge.id },
    });
    if (fresh.progress >= fresh.goal && fresh.status === "active") {
      await completeChallenge(fresh.id);
    }
  }
}

async function completeChallenge(challengeId: string) {
  const challenge = await prisma.communityChallenge.findUniqueOrThrow({
    where: { id: challengeId },
  });
  if (challenge.status !== "active") return;

  await prisma.communityChallenge.update({
    where: { id: challengeId },
    data: { status: "completed", completedAt: new Date() },
  });

  const contributors = await prisma.challengeContribution.findMany({
    where: { challengeId, rewarded: false },
  });

  for (const c of contributors) {
    if (challenge.rewardHits > 0) {
      await grantHits({
        userId: c.userId,
        amount: challenge.rewardHits,
        type: "earned_challenge",
        description: `Community challenge: ${challenge.name}`,
        metadata: { challengeId },
      });
    }
    await prisma.challengeContribution.update({
      where: { id: c.id },
      data: { rewarded: true },
    });
    await recordRewardEvent({
      userId: c.userId,
      kind: "challenge",
      title: `${challenge.icon} ${challenge.name}`,
      body: `Community goal reached · +${challenge.rewardHits} Hits`,
      payload: { challengeId },
    });
    await notifyUser({
      userId: c.userId,
      type: "challenge_complete",
      title: `${challenge.icon} Challenge complete!`,
      body: `${challenge.name} — every active member earned ${challenge.rewardHits} Hits.`,
      href: "/luck/challenges",
    });
  }
}

export async function listActiveChallenges() {
  return prisma.communityChallenge.findMany({
    where: { status: { in: ["active", "completed"] } },
    orderBy: [{ status: "asc" }, { endsAt: "asc" }],
    take: 10,
  });
}
