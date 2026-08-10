import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCreditHistory } from "@/lib/credits/ledger";
import { claimDailyReward } from "@/lib/rewards/streaks";
import { claimWeeklyBonus } from "@/lib/rewards/launch";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/anti-abuse/rate-limit";

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

  const rl = rateLimit({
    key: clientKey(req, `credits:${session.user.id}`),
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limited. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "daily") {
      return NextResponse.json(await claimDailyReward(session.user.id));
    }
    if (body.action === "weekly") {
      return NextResponse.json(await claimWeeklyBonus(session.user.id));
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
