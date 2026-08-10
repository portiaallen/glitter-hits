import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";
import { getEconomySettings } from "@/lib/settings/economy";
import { checkAchievements } from "@/lib/rewards/achievements";
import { sha256Hex } from "@/lib/utils";

export async function trackReferralClick(code: string, ip?: string | null) {
  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!referrer) return null;
  return prisma.referralEvent.create({
    data: {
      referrerId: referrer.id,
      code,
      status: "clicked",
      ipHash: ip ? await sha256Hex(ip) : undefined,
    },
  });
}

export async function attachReferralOnSignup(params: {
  newUserId: string;
  code?: string | null;
  ip?: string | null;
}) {
  if (!params.code) return null;
  const economy = await getEconomySettings();
  const referrer = await prisma.user.findUnique({ where: { referralCode: params.code } });
  if (!referrer) return null;

  // Anti self-referral
  if (referrer.id === params.newUserId) return null;

  // Duplicate IP farming heuristic
  if (params.ip) {
    const ipHash = await sha256Hex(params.ip);
    const recent = await prisma.referralEvent.count({
      where: {
        referrerId: referrer.id,
        ipHash,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recent >= 5) {
      await prisma.referralEvent.create({
        data: {
          referrerId: referrer.id,
          referredUserId: params.newUserId,
          code: params.code,
          status: "rejected",
          ipHash,
        },
      });
      return null;
    }
  }

  await prisma.user.update({
    where: { id: params.newUserId },
    data: { referredById: referrer.id },
  });

  const event = await prisma.referralEvent.create({
    data: {
      referrerId: referrer.id,
      referredUserId: params.newUserId,
      code: params.code,
      status: "registered",
      ipHash: params.ip ? await sha256Hex(params.ip) : undefined,
    },
  });

  if (economy.referralSignupBonus > 0) {
    await moveCredits({
      userId: referrer.id,
      amount: economy.referralSignupBonus,
      type: "earned_referral",
      description: "Referral signup bonus",
      referralId: event.id,
    });
    await prisma.referralEvent.update({
      where: { id: event.id },
      data: { creditsAwarded: { increment: economy.referralSignupBonus } },
    });
  }

  await checkAchievements(referrer.id);
  return event;
}

/** Qualify a referral after the referred user completes meaningful activity. */
export async function maybeQualifyReferral(referredUserId: string) {
  const user = await prisma.user.findUnique({ where: { id: referredUserId } });
  if (!user?.referredById) return;

  const completedVisits = await prisma.visit.count({
    where: { visitorUserId: referredUserId, completed: true },
  });
  if (completedVisits < 10) return;

  const event = await prisma.referralEvent.findFirst({
    where: {
      referredUserId,
      referrerId: user.referredById,
      status: { in: ["registered", "activated"] },
    },
  });
  if (!event) return;

  const economy = await getEconomySettings();
  await prisma.referralEvent.update({
    where: { id: event.id },
    data: {
      status: "qualified",
      activatedAt: event.activatedAt ?? new Date(),
      qualifiedAt: new Date(),
    },
  });

  if (economy.referralQualifiedBonus > 0) {
    await moveCredits({
      userId: user.referredById,
      amount: economy.referralQualifiedBonus,
      type: "earned_referral",
      description: "Qualified referral bonus",
      referralId: event.id,
    });
    await prisma.referralEvent.update({
      where: { id: event.id },
      data: { creditsAwarded: { increment: economy.referralQualifiedBonus } },
    });
  }
}
