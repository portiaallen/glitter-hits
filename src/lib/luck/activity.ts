import { prisma } from "@/lib/db";
import { awardLuck, recordRewardEvent } from "@/lib/luck/engine";
import { getLuckEngineConfig } from "@/lib/luck/config";
import { maybeSpawnGlitterDrop } from "@/lib/luck/drops";
import { maybeTriggerJackpot } from "@/lib/luck/jackpot";
import { contributeToChallenges } from "@/lib/luck/challenges";
import { syncQuestProgress } from "@/lib/luck/quests";
import { processStreakMilestones } from "@/lib/luck/streak-milestones";
import { notifyUser } from "@/lib/notifications/service";

function utcDateString(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/**
 * Central activity hook — awards luck, advances streak/quests/challenges,
 * and may spawn drops / jackpots. Always server-side.
 */
export async function onMeaningfulActivity(params: {
  userId: string;
  kind:
    | "surf"
    | "website"
    | "campaign"
    | "placement"
    | "referral"
    | "mail_open"
    | "daily"
    | "quest"
    | "drop"
    | "wheel";
  visitId?: string;
  silentLuckNotify?: boolean;
}) {
  const config = await getLuckEngineConfig();
  const weightMap: Record<typeof params.kind, number> = {
    surf: config.weights.surfComplete,
    website: config.weights.websiteAdded,
    campaign: config.weights.campaignCreated,
    placement: config.weights.placementPurchased,
    referral: config.weights.referralActivated,
    mail_open: config.weights.mailOpened,
    daily: config.weights.dailyReturn,
    quest: config.weights.questCompleted,
    drop: config.weights.dropClaimed,
    wheel: config.weights.wheelSpin,
  };

  const luckGain = weightMap[params.kind] ?? 0;
  const feedback: {
    luck: number;
    hits?: number;
    streakDays?: number;
    dropId?: string;
    jackpot?: { label: string; type: string; value: number } | null;
    levelUp?: string | null;
    messages: string[];
  } = { luck: luckGain, messages: [] };

  const today = utcDateString();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  let streakChanged = false;
  if (user.lastActiveDate !== today) {
    const yesterday = utcDateString(new Date(Date.now() - 86_400_000));
    const nextStreak = user.lastActiveDate === yesterday ? user.streakDays + 1 : 1;
    await prisma.user.update({
      where: { id: params.userId },
      data: {
        lastActiveDate: today,
        streakDays: nextStreak,
        longestStreak: Math.max(user.longestStreak, nextStreak),
        lastSurfDate: params.kind === "surf" ? new Date() : user.lastSurfDate,
      },
    });
    streakChanged = true;
    feedback.streakDays = nextStreak;
    feedback.messages.push(
      `🔥 Streak continues — ${nextStreak} day${nextStreak === 1 ? "" : "s"}`,
    );
    if (config.weights.streakDay > 0) {
      await awardLuck({
        userId: params.userId,
        amount: config.weights.streakDay,
        source: "streak",
        description: `Active day streak (${nextStreak})`,
        silent: true,
      });
      feedback.luck += config.weights.streakDay;
    }
    await processStreakMilestones(params.userId, nextStreak);
  } else if (params.kind === "surf") {
    await prisma.user.update({
      where: { id: params.userId },
      data: { lastSurfDate: new Date() },
    });
  }

  if (luckGain > 0) {
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: params.userId },
      select: { luckLevelSlug: true },
    });
    await awardLuck({
      userId: params.userId,
      amount: luckGain,
      source: params.kind,
      description: `Activity: ${params.kind}`,
      metadata: { visitId: params.visitId },
      silent: params.silentLuckNotify ?? true,
    });
    const after = await prisma.user.findUniqueOrThrow({
      where: { id: params.userId },
      select: { luckLevelSlug: true },
    });
    if (before.luckLevelSlug !== after.luckLevelSlug) {
      feedback.levelUp = after.luckLevelSlug;
      feedback.messages.push(`✨ Luck level up — ${after.luckLevelSlug}`);
    }
    feedback.messages.unshift(`🌟 +${luckGain} Luck`);
  }

  await syncQuestProgress(params.userId, params.kind);

  if (params.kind === "surf") {
    await contributeToChallenges(params.userId, "pages_surfed", 1);
  } else if (
    params.kind === "website" ||
    params.kind === "campaign" ||
    params.kind === "placement"
  ) {
    await contributeToChallenges(params.userId, "sites_promoted", 1);
  } else if (params.kind === "referral") {
    await contributeToChallenges(params.userId, "referrals", 1);
  }

  if (params.kind === "surf" && config.wheel.enabled && config.wheel.surfSpinsEvery > 0) {
    const surfs = await prisma.visit.count({
      where: { visitorUserId: params.userId, completed: true },
    });
    if (surfs > 0 && surfs % config.wheel.surfSpinsEvery === 0) {
      await prisma.user.update({
        where: { id: params.userId },
        data: { wheelSpins: { increment: 1 } },
      });
      feedback.messages.push("🎡 +1 Wheel spin");
      await notifyUser({
        userId: params.userId,
        type: "wheel_spin_earned",
        title: "🎡 Wheel spin earned",
        body: `You earned a Glitter Wheel spin after ${surfs} surfs.`,
        href: "/luck/wheel",
      });
    }
  }

  if (params.kind === "surf") {
    const drop = await maybeSpawnGlitterDrop(params.userId);
    if (drop) {
      feedback.dropId = drop.id;
      feedback.messages.push("💎 You found a Glitter Drop!");
    }
    const jackpot = await maybeTriggerJackpot(params.userId, "surf");
    if (jackpot) {
      feedback.jackpot = jackpot;
      feedback.messages.push(`💎 JACKPOT! ${jackpot.label}`);
    }
  }

  if (streakChanged || luckGain > 0) {
    await recordRewardEvent({
      userId: params.userId,
      kind: params.kind,
      title: `Activity · ${params.kind}`,
      body: feedback.messages.join(" · "),
      payload: feedback,
    });
  }

  return feedback;
}

export {
  grantHits,
  grantTemporaryBoost,
  applyBoostedSurfEarnings,
} from "@/lib/luck/rewards";
