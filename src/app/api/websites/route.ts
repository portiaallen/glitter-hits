import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createWebsite, websiteInputSchema } from "@/lib/campaigns/service";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const websites = await prisma.website.findMany({
    where: { userId: session.user.id },
    include: { category: true, campaigns: true, tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ websites });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const raw = await req.json();
    const parsed = websiteInputSchema.parse(raw);
    const website = await createWebsite(session.user.id, parsed);
    return NextResponse.json({ website }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
