import type { CreditTxnType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertIntegerCredits } from "@/lib/utils";

export type CreditMoveInput = {
  userId: string;
  amount: number; // positive credit, negative debit
  type: CreditTxnType;
  description: string;
  campaignId?: string;
  visitId?: string;
  referralId?: string;
  achievementId?: string;
  metadata?: Record<string, unknown>;
  createdById?: string;
  tx?: Prisma.TransactionClient;
};

/**
 * Atomic integer credit ledger write.
 * Never uses floating-point arithmetic for balances.
 */
export async function moveCredits(input: CreditMoveInput) {
  const amount = assertIntegerCredits(input.amount);
  if (amount === 0) {
    throw new Error("Credit movement amount cannot be zero.");
  }

  const run = async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: input.userId } });

    if (user.isSuspended) {
      throw new Error("Account is suspended — credits cannot be moved.");
    }

    const nextBalance = user.creditBalance + amount;
    if (nextBalance < 0) {
      throw new Error("Insufficient Glitter Hits balance.");
    }

    const amountAbs = Math.abs(amount);
    const lifetimeEarned =
      amount > 0 ? user.lifetimeEarned + amountAbs : user.lifetimeEarned;
    const lifetimeSpent =
      amount < 0 ? user.lifetimeSpent + amountAbs : user.lifetimeSpent;

    const updated = await tx.user.update({
      where: { id: input.userId },
      data: {
        creditBalance: nextBalance,
        lifetimeEarned,
        lifetimeSpent,
      },
    });

    const entry = await tx.creditLedger.create({
      data: {
        userId: input.userId,
        amount,
        balanceAfter: nextBalance,
        type: input.type,
        description: input.description,
        campaignId: input.campaignId,
        visitId: input.visitId,
        referralId: input.referralId,
        achievementId: input.achievementId,
        metadataJson: JSON.stringify(input.metadata ?? {}),
        createdById: input.createdById,
      },
    });

    return { user: updated, entry };
  };

  if (input.tx) return run(input.tx);
  return prisma.$transaction(run);
}

export async function getCreditHistory(userId: string, limit = 50) {
  return prisma.creditLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function allocateCreditsToCampaign(params: {
  userId: string;
  campaignId: string;
  amount: number;
}) {
  const amount = assertIntegerCredits(params.amount);
  if (amount <= 0) throw new Error("Allocation must be a positive integer.");

  return prisma.$transaction(async (tx) => {
    await moveCredits({
      tx,
      userId: params.userId,
      amount: -amount,
      type: "spent_campaign",
      description: `Allocated ${amount} Glitter Hits to campaign`,
      campaignId: params.campaignId,
    });

    const campaign = await tx.campaign.update({
      where: { id: params.campaignId },
      data: {
        creditBalance: { increment: amount },
        status: "active",
      },
    });

    return campaign;
  });
}
