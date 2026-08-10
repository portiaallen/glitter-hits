import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { heartbeatSession } from "@/lib/surf/session";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = z.object({ sessionId: z.string() }).parse(await req.json());
  try {
    await heartbeatSession(sessionId, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
