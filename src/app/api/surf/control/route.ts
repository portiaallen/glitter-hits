import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { heartbeatSession, pauseSession, resumeSession, endSession } from "@/lib/surf/session";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = z
    .object({
      sessionId: z.string(),
      action: z.enum(["heartbeat", "pause", "resume", "end"]),
    })
    .parse(await req.json());

  try {
    if (body.action === "heartbeat") {
      await heartbeatSession(body.sessionId, session.user.id);
    } else if (body.action === "pause") {
      await pauseSession(body.sessionId, session.user.id);
    } else if (body.action === "resume") {
      await resumeSession(body.sessionId, session.user.id);
    } else {
      await endSession(body.sessionId, session.user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
