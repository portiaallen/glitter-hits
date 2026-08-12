import { NextResponse } from "next/server";
import type { PlacementType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/anti-abuse/rate-limit";
import { prisma } from "@/lib/db";
import {
  PLACEMENT_OFFERS,
  expireDuePlacements,
  listUserPlacements,
  placementCostForMembership,
  purchasePlacement,
} from "@/lib/placements/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await expireDuePlacements();

  const [user, websites, placements, feature] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { membership: true, creditBalance: true },
    }),
    prisma.website.findMany({
      where: { userId: session.user.id, moderationStatus: "approved" },
      select: { id: true, title: true, url: true },
      orderBy: { title: "asc" },
    }),
    listUserPlacements(session.user.id),
    prisma.monetizationFeature.findUnique({ where: { key: "featured_placements" } }),
  ]);

  return NextResponse.json({
    enabled: feature?.enabled ?? true,
    balance: user.creditBalance,
    membership: user.membership,
    websites,
    placements,
    offers: PLACEMENT_OFFERS.map((o) => ({
      ...o,
      creditCost: placementCostForMembership(o, user.membership),
      listPrice: o.creditCost,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit({
    key: clientKey(req, `placements:${session.user.id}`),
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
    if (body.action === "purchase") {
      const placement = await purchasePlacement({
        userId: session.user.id,
        websiteId: String(body.websiteId ?? ""),
        type: body.type as PlacementType,
        title: body.title ? String(body.title) : undefined,
        body: body.body ? String(body.body) : undefined,
      });
      return NextResponse.json({ ok: true, placement });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
