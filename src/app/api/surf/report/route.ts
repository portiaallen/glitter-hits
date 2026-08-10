import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reportWebsite } from "@/lib/moderation/service";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = z
    .object({
      visitId: z.string().optional(),
      websiteId: z.string().optional(),
      reason: z.string().min(3).max(200),
      details: z.string().max(2000).optional(),
    })
    .parse(await req.json());

  let websiteId = body.websiteId;
  if (!websiteId && body.visitId) {
    const visit = await prisma.visit.findFirst({
      where: { id: body.visitId, visitorUserId: session.user.id },
    });
    websiteId = visit?.websiteId;
    if (visit) {
      await prisma.visit.update({
        where: { id: visit.id },
        data: { reported: true },
      });
    }
  }
  if (!websiteId) {
    return NextResponse.json({ error: "websiteId or visitId required" }, { status: 400 });
  }

  const report = await reportWebsite({
    websiteId,
    reporterId: session.user.id,
    reason: body.reason,
    details: body.details,
  });
  return NextResponse.json({ report });
}
