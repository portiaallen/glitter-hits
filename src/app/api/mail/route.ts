import { NextResponse } from "next/server";
import type { MailTier } from "@prisma/client";
import { auth } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/anti-abuse/rate-limit";
import {
  getInbox,
  getMailEconomy,
  markMailRead,
  membershipAllowsMailTier,
  sendSoloMail,
} from "@/lib/mail/service";
import { prisma } from "@/lib/db";

const TIERS: MailTier[] = ["standard", "boosted", "featured", "premium_solo"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [inbox, economy, user, sent] = await Promise.all([
    getInbox(session.user.id),
    getMailEconomy(),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { membership: true, creditBalance: true },
    }),
    prisma.mailCampaign.findMany({
      where: { senderId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    inbox,
    sent,
    economy,
    membership: user.membership,
    balance: user.creditBalance,
    unlockedTiers: TIERS.filter((t) => membershipAllowsMailTier(user.membership, t)),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit({
    key: clientKey(req, `mail:${session.user.id}`),
    limit: 8,
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
    if (body.action === "read") {
      if (typeof body.receiptId !== "string") {
        return NextResponse.json({ error: "receiptId required" }, { status: 400 });
      }
      return NextResponse.json(await markMailRead(session.user.id, body.receiptId));
    }

    if (body.action === "send") {
      const tier = (TIERS.includes(body.tier) ? body.tier : "standard") as MailTier;
      const mail = await sendSoloMail({
        senderId: session.user.id,
        subject: String(body.subject ?? ""),
        body: String(body.body ?? ""),
        ctaUrl: body.ctaUrl ? String(body.ctaUrl) : undefined,
        ctaLabel: body.ctaLabel ? String(body.ctaLabel) : undefined,
        tier,
        paidSoloUpgrade: !!body.paidSoloUpgrade,
      });
      return NextResponse.json({ ok: true, mail });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
