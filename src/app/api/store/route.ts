import { NextResponse } from "next/server";
import type { MembershipTier } from "@prisma/client";
import { auth } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/anti-abuse/rate-limit";
import {
  getStoreCatalog,
  upgradeMembershipWithCredits,
} from "@/lib/mail/service";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [catalog, user] = await Promise.all([
    getStoreCatalog(),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { membership: true, creditBalance: true },
    }),
  ]);

  return NextResponse.json({
    ...catalog,
    membership: user.membership,
    balance: user.creditBalance,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit({
    key: clientKey(req, `store:${session.user.id}`),
    limit: 10,
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
    if (body.action === "upgrade_membership") {
      const tier = body.tier as Exclude<MembershipTier, "free">;
      if (!["plus", "premium", "vip"].includes(tier)) {
        return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
      }
      const result = await upgradeMembershipWithCredits({
        userId: session.user.id,
        tier,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "buy_pack") {
      const catalog = await getStoreCatalog();
      if (!catalog.cashCheckoutEnabled) {
        return NextResponse.json(
          {
            error:
              "Cash checkout is not enabled yet. Earn Glitter Hits by surfing, or upgrade membership with credits.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Stripe checkout wiring is staged — contact support for packs." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
