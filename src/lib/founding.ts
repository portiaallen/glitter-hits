import { prisma } from "@/lib/db";

/**
 * The Founding 500 — the first 500 real members of Glitter Hits.
 * Founding status is derived from join order, so it needs no schema change:
 * an account is "founding" when it is among the first FOUNDING_CAP accounts
 * by createdAt, excluding the founder account and seed accounts.
 */
export const FOUNDING_CAP = 500;
export const FOUNDING_BONUS_CREDITS = 500;

const foundingExclusions = [
  { role: { not: "founder" as const } },
  { email: { not: { endsWith: "@glitterhits.gay" } } },
];

export type FoundingStatus = {
  claimed: number;
  cap: number;
  spotsLeft: number;
  open: boolean;
};

export async function getFoundingStatus(): Promise<FoundingStatus> {
  const claimed = await prisma.user.count({ where: { AND: foundingExclusions } });
  const spotsLeft = Math.max(0, FOUNDING_CAP - claimed);
  return { claimed, cap: FOUNDING_CAP, spotsLeft, open: spotsLeft > 0 };
}

/**
 * 1-based founding number for a user (their join position among eligible
 * accounts), or null when they are not in the Founding 500.
 */
export async function getFoundingNumber(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, role: true, email: true },
  });
  if (!user) return null;
  if (user.role === "founder") return null;
  if (user.email.endsWith("@glitterhits.gay")) return null;

  const position = await prisma.user.count({
    where: {
      AND: [...foundingExclusions, { createdAt: { lte: user.createdAt } }],
    },
  });
  return position <= FOUNDING_CAP ? position : null;
}
