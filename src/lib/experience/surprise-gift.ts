import { prisma } from "@/lib/db";
import { moveCredits } from "@/lib/credits/ledger";
import { notifyUser } from "@/lib/notifications/service";

const ACTIVE_WITHIN_DAYS = 14;

export type SurpriseGiftInput = {
  actorId: string;
  hits: number;
  spins?: number;
  /** Optional public note, e.g. "Rainbow Month surprise" */
  reason?: string;
  /** How many days the site announcement stays live */
  announceDays?: number;
};

export type SurpriseGiftResult = {
  winner: {
    id: string;
    name: string | null;
    email: string;
  };
  hits: number;
  spins: number;
  announcementId: string;
  poolSize: number;
};

function publicName(name: string | null, email: string) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0] || "a lucky member";
  return local;
}

/**
 * Pick a random recently-active, non-suspended member and gift them Hits
 * (plus optional wheel spins). Creates a site-wide announcement.
 */
export async function giftRandomActiveMember(
  input: SurpriseGiftInput,
): Promise<SurpriseGiftResult> {
  const hits = Math.trunc(input.hits);
  const spins = Math.max(0, Math.trunc(input.spins ?? 0));
  if (!Number.isInteger(hits) || hits < 1) {
    throw new Error("Gift Hits must be a positive integer.");
  }
  if (hits > 50_000) {
    throw new Error("Gift Hits amount is too large.");
  }

  const since = new Date(Date.now() - ACTIVE_WITHIN_DAYS * 86_400_000);

  const pool = await prisma.user.findMany({
    where: {
      isSuspended: false,
      role: { in: ["member", "moderator"] },
      lastSurfDate: { gte: since },
    },
    select: { id: true, name: true, email: true },
    take: 500,
  });

  if (pool.length === 0) {
    throw new Error(
      `No active members found (surfed in the last ${ACTIVE_WITHIN_DAYS} days).`,
    );
  }

  const winner = pool[Math.floor(Math.random() * pool.length)]!;
  const display = publicName(winner.name, winner.email);
  const reason = input.reason?.trim() || "Glitter Hits surprise gift";
  const announceDays = Math.min(30, Math.max(1, input.announceDays ?? 7));

  await moveCredits({
    userId: winner.id,
    amount: hits,
    type: "earned_bonus",
    description: `Surprise gift: ${reason}`,
    createdById: input.actorId,
    metadata: { kind: "surprise_gift", spins },
  });

  if (spins > 0) {
    await prisma.user.update({
      where: { id: winner.id },
      data: { wheelSpins: { increment: spins } },
    });
  }

  const giftBits = [
    `${hits} Glitter Hits`,
    spins > 0 ? `${spins} wheel spin${spins === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  const title = `Surprise gift for ${display}!`;
  const body = `${display} just received ${giftBits.join(" + ")} from Glitter Hits. Come explore — you could be next.`;

  // Keep the gift banner prominent: deactivate older surprise-gift announcements
  await prisma.announcement.updateMany({
    where: {
      isActive: true,
      title: { startsWith: "Surprise gift" },
    },
    data: { isActive: false },
  });

  const announcement = await prisma.announcement.create({
    data: {
      title,
      body,
      isActive: true,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + announceDays * 86_400_000),
    },
  });

  await notifyUser({
    userId: winner.id,
    type: "surprise_gift",
    title: "You got a surprise gift!",
    body: `Glitter Hits gifted you ${giftBits.join(" + ")}. ${reason}`,
    href: "/credits",
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: "experience.surprise_gift",
      targetType: "user",
      targetId: winner.id,
      detailsJson: JSON.stringify({
        hits,
        spins,
        reason,
        announcementId: announcement.id,
        poolSize: pool.length,
        winnerName: display,
      }),
    },
  });

  return {
    winner: { id: winner.id, name: winner.name, email: winner.email },
    hits,
    spins,
    announcementId: announcement.id,
    poolSize: pool.length,
  };
}

export async function countActiveGiftPool() {
  const since = new Date(Date.now() - ACTIVE_WITHIN_DAYS * 86_400_000);
  return prisma.user.count({
    where: {
      isSuspended: false,
      role: { in: ["member", "moderator"] },
      lastSurfDate: { gte: since },
    },
  });
}
