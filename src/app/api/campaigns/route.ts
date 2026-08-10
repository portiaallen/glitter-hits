import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createCampaign,
  campaignInputSchema,
  setCampaignStatus,
  duplicateCampaign,
} from "@/lib/campaigns/service";
import { allocateCreditsToCampaign } from "@/lib/credits/ledger";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id, status: { not: "deleted" } },
    include: { website: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const campaign = await createCampaign(session.user.id, campaignInputSchema.parse(await req.json()));
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = z
    .object({
      campaignId: z.string(),
      action: z.enum(["pause", "resume", "archive", "delete", "duplicate", "allocate"]),
      amount: z.number().int().positive().optional(),
    })
    .parse(await req.json());

  try {
    if (body.action === "duplicate") {
      const campaign = await duplicateCampaign(session.user.id, body.campaignId);
      return NextResponse.json({ campaign });
    }
    if (body.action === "allocate") {
      if (!body.amount) throw new Error("amount required");
      const campaign = await allocateCreditsToCampaign({
        userId: session.user.id,
        campaignId: body.campaignId,
        amount: body.amount,
      });
      return NextResponse.json({ campaign });
    }
    const statusMap = {
      pause: "paused",
      resume: "active",
      archive: "archived",
      delete: "deleted",
    } as const;
    const campaign = await setCampaignStatus(
      session.user.id,
      body.campaignId,
      statusMap[body.action],
    );
    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
