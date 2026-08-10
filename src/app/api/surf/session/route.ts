import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startSurfSession } from "@/lib/surf/session";
import { rateLimit, clientKey } from "@/lib/anti-abuse/rate-limit";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.isSuspended) {
    return NextResponse.json({ error: "Account suspended." }, { status: 403 });
  }

  const rl = rateLimit({
    key: clientKey(req, `surf-start:${session.user.id}`),
    limit: 10,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many surf sessions. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const viewerType =
    body.viewerType === "automated_viewer" ? "automated_viewer" : "human_exchange";

  const surf = await startSurfSession({
    userId: session.user.id,
    viewerType,
    ip: req.headers.get("x-forwarded-for"),
    userAgent: req.headers.get("user-agent"),
    deviceHint: body.deviceHint,
    countryCode: body.countryCode || user.countryCode,
  });

  return NextResponse.json({ session: surf });
}
