import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { nextSurfSite } from "@/lib/surf/session";
import { rateLimit, clientKey } from "@/lib/anti-abuse/rate-limit";
import { bumpRiskScore } from "@/lib/moderation/site-check";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit({
    key: clientKey(req, `surf-next:${session.user.id}`),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    await bumpRiskScore(session.user.id, 5, "excessive surf next requests");
    return NextResponse.json(
      { error: `Slow down. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = z.object({ sessionId: z.string() }).parse(await req.json());
  try {
    const result = await nextSurfSite({
      sessionId: body.sessionId,
      userId: session.user.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
