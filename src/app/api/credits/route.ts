import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCreditHistory } from "@/lib/credits/ledger";
import { claimDailyReward } from "@/lib/rewards/streaks";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const ledger = await getCreditHistory(session.user.id, 100);
  return NextResponse.json({
    balance: user.creditBalance,
    lifetimeEarned: user.lifetimeEarned,
    lifetimeSpent: user.lifetimeSpent,
    ledger,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "daily") {
    try {
      const result = await claimDailyReward(session.user.id);
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed" },
        { status: 400 },
      );
    }
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
