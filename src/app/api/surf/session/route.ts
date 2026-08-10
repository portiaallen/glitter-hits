import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startSurfSession } from "@/lib/surf/session";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    countryCode: body.countryCode,
  });

  return NextResponse.json({ session: surf });
}
