import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { trackReferralClick } from "@/lib/referrals/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const events = await prisma.referralEvent.findMany({
    where: { referrerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = {
    clicks: events.filter((e) => e.status === "clicked").length,
    registrations: events.filter((e) =>
      ["registered", "activated", "qualified"].includes(e.status),
    ).length,
    qualified: events.filter((e) => e.status === "qualified").length,
    credits: events.reduce((s, e) => s + e.creditsAwarded, 0),
  };

  return NextResponse.json({
    code: user.referralCode,
    url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/signup?ref=${user.referralCode}`,
    stats,
    events,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.code) return NextResponse.json({ error: "code required" }, { status: 400 });
  const event = await trackReferralClick(body.code, req.headers.get("x-forwarded-for"));
  return NextResponse.json({ event });
}
