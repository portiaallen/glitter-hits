import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { completeSurfVisit } from "@/lib/surf/session";
import { maybeQualifyReferral } from "@/lib/referrals/service";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = z
    .object({
      visitId: z.string(),
      actualDurationSec: z.number(),
    })
    .parse(await req.json());

  try {
    const result = await completeSurfVisit({
      visitId: body.visitId,
      userId: session.user.id,
      actualDurationSec: body.actualDurationSec,
    });
    await maybeQualifyReferral(session.user.id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
