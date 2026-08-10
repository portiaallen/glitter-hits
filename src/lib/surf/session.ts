import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";
import { getEconomySettings } from "@/lib/settings/economy";
import {
  selectNextCampaign,
  startVisit,
  type ViewerContext,
} from "@/lib/delivery/engine";
import { sha256Hex } from "@/lib/utils";
import { checkAchievements } from "@/lib/rewards/achievements";
import { touchStreak } from "@/lib/rewards/streaks";
import type { ViewerType } from "@prisma/client";

export async function startSurfSession(params: {
  userId: string;
  viewerType?: ViewerType;
  ip?: string | null;
  userAgent?: string | null;
  deviceHint?: string | null;
  countryCode?: string | null;
}) {
  // Close any lingering active sessions
  await prisma.surfSession.updateMany({
    where: { userId: params.userId, status: { in: ["active", "paused"] } },
    data: { status: "aborted", endedAt: new Date() },
  });

  return prisma.surfSession.create({
    data: {
      userId: params.userId,
      viewerType: params.viewerType ?? "human_exchange",
      ipHash: params.ip ? await sha256Hex(params.ip) : undefined,
      userAgentHash: params.userAgent ? await sha256Hex(params.userAgent) : undefined,
      deviceHint: params.deviceHint ?? undefined,
      countryCode: params.countryCode ?? undefined,
    },
  });
}

export async function heartbeatSession(sessionId: string, userId: string) {
  const session = await prisma.surfSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session || session.status === "completed" || session.status === "aborted") {
    throw new Error("Surf session is not active.");
  }
  return prisma.surfSession.update({
    where: { id: sessionId },
    data: { lastHeartbeatAt: new Date() },
  });
}

export async function pauseSession(sessionId: string, userId: string) {
  return prisma.surfSession.updateMany({
    where: { id: sessionId, userId, status: "active" },
    data: { status: "paused" },
  });
}

export async function resumeSession(sessionId: string, userId: string) {
  return prisma.surfSession.updateMany({
    where: { id: sessionId, userId, status: "paused" },
    data: { status: "active", lastHeartbeatAt: new Date() },
  });
}

export async function endSession(sessionId: string, userId: string) {
  return prisma.surfSession.updateMany({
    where: { id: sessionId, userId, status: { in: ["active", "paused"] } },
    data: { status: "completed", endedAt: new Date() },
  });
}

export async function nextSurfSite(params: {
  sessionId: string;
  userId: string;
}) {
  const session = await prisma.surfSession.findFirst({
    where: { id: params.sessionId, userId: params.userId, status: "active" },
  });
  if (!session) throw new Error("No active surf session.");

  // Stale heartbeat check (> 2 min) — flag but still allow with risk note
  const staleMs = Date.now() - session.lastHeartbeatAt.getTime();
  if (staleMs > 120_000) {
    await prisma.surfSession.update({
      where: { id: session.id },
      data: {
        riskFlagsJson: JSON.stringify(["stale_heartbeat"]),
      },
    });
  }

  const ctx: ViewerContext = {
    userId: params.userId,
    countryCode: session.countryCode,
    deviceHint: session.deviceHint,
    viewerType: session.viewerType,
  };

  const campaign = await selectNextCampaign(ctx);
  if (!campaign) {
    return { empty: true as const, message: "No eligible campaigns right now. Try again soon." };
  }

  const visit = await startVisit({
    session,
    campaign,
    visitorUserId: params.userId,
    countryCode: session.countryCode,
    deviceHint: session.deviceHint,
  });

  await prisma.surfSession.update({
    where: { id: session.id },
    data: { lastHeartbeatAt: new Date() },
  });

  return { empty: false as const, ...visit };
}

export async function completeSurfVisit(params: {
  visitId: string;
  userId: string;
  actualDurationSec: number;
}) {
  const duration = Math.max(0, Math.trunc(params.actualDurationSec));
  const economy = await getEconomySettings();

  return prisma.$transaction(async (tx) => {
    const visit = await tx.visit.findFirst({
      where: { id: params.visitId, visitorUserId: params.userId },
      include: { campaign: true },
    });
    if (!visit) throw new Error("Visit not found.");
    if (visit.credited) return { alreadyCredited: true as const, visit };

    // Anti-abuse: require meeting duration (small grace of 1s)
    if (duration + 1 < visit.requiredDurationSec) {
      await tx.visit.update({
        where: { id: visit.id },
        data: {
          actualDurationSec: duration,
          quality: "suspicious",
          completed: false,
        },
      });
      throw new Error("Visit duration not met — credits not awarded.");
    }

    const charge = economy.creditsChargedPerVisit;
    if (visit.campaign.creditBalance < charge) {
      await tx.campaign.update({
        where: { id: visit.campaignId },
        data: { status: "exhausted" },
      });
      throw new Error("Campaign ran out of credits.");
    }

    const earn = visit.creditsEarned;

    await tx.campaign.update({
      where: { id: visit.campaignId },
      data: {
        creditBalance: { decrement: charge },
        creditsSpent: { increment: charge },
        visitsDelivered: { increment: 1 },
      },
    });

    // Deduct from campaign owner's spent tracking already on campaign;
    // visitor earns credits
    if (earn > 0) {
      await moveCredits({
        tx,
        userId: params.userId,
        amount: earn,
        type:
          visit.viewerType === "automated_viewer"
            ? "earned_automated"
            : "earned_surf",
        description: `Earned for discovering a site (${duration}s)`,
        campaignId: visit.campaignId,
        visitId: visit.id,
      });
    }

    const updated = await tx.visit.update({
      where: { id: visit.id },
      data: {
        actualDurationSec: duration,
        completed: true,
        credited: true,
        creditsCharged: charge,
        completedAt: new Date(),
      },
    });

    if (visit.surfSessionId) {
      await tx.surfSession.update({
        where: { id: visit.surfSessionId },
        data: {
          creditsEarned: { increment: earn },
          sitesViewed: { increment: 1 },
          lastHeartbeatAt: new Date(),
        },
      });
    }

    await tx.website.update({
      where: { id: visit.websiteId },
      data: { discoverCount: { increment: 1 } },
    });

    return { alreadyCredited: false as const, visit: updated, earned: earn };
  }).then(async (result) => {
    if (!result.alreadyCredited) {
      await touchStreak(params.userId);
      await checkAchievements(params.userId);
    }
    return result;
  });
}

export async function skipSurfVisit(params: {
  visitId: string;
  userId: string;
  elapsedSec: number;
}) {
  const economy = await getEconomySettings();
  const visit = await prisma.visit.findFirst({
    where: { id: params.visitId, visitorUserId: params.userId },
  });
  if (!visit) throw new Error("Visit not found.");
  if (params.elapsedSec < economy.skipAllowedAfterSec) {
    throw new Error(`Skip allowed after ${economy.skipAllowedAfterSec}s.`);
  }

  await prisma.visit.update({
    where: { id: visit.id },
    data: {
      skipped: true,
      actualDurationSec: Math.trunc(params.elapsedSec),
      completedAt: new Date(),
    },
  });

  if (visit.surfSessionId) {
    await prisma.surfSession.update({
      where: { id: visit.surfSessionId },
      data: { sitesSkipped: { increment: 1 } },
    });
  }

  return { skipped: true };
}
