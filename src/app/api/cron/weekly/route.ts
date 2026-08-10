import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Weekly cron hook — records a network health snapshot.
 * Member weekly bonuses are claimed by users from /credits (activity-gated).
 * Protect with CRON_SECRET (Vercel Cron sends Authorization: Bearer <CRON_SECRET>).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const [users, activeCampaigns, visitsWeek] = await Promise.all([
    prisma.user.count(),
    prisma.campaign.count({ where: { status: "active" } }),
    prisma.visit.count({
      where: {
        completed: true,
        startedAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
      },
    }),
  ]);

  const key = `cron:weekly:${new Date().toISOString().slice(0, 10)}`;
  await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      valueJson: JSON.stringify({ users, activeCampaigns, visitsWeek }),
    },
    update: {
      valueJson: JSON.stringify({ users, activeCampaigns, visitsWeek }),
    },
  });

  return NextResponse.json({
    ok: true,
    users,
    activeCampaigns,
    visitsWeek,
    note: "Weekly member bonuses are claimed in-app after 5 discoveries.",
  });
}
