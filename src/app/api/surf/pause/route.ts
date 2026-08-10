import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pauseSession, resumeSession } from "@/lib/surf/session";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = z
    .object({
      sessionId: z.string(),
      resume: z.boolean().optional(),
      action: z.enum(["pause", "resume"]).optional(),
    })
    .parse(await req.json());
  try {
    const shouldResume = body.resume === true || body.action === "resume";
    if (shouldResume) await resumeSession(body.sessionId, session.user.id);
    else await pauseSession(body.sessionId, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
