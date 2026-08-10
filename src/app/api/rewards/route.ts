import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [levels, achievements] = await Promise.all([
    prisma.levelDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.achievementDefinition.findMany({ where: { isActive: true } }),
  ]);
  return NextResponse.json({ levels, achievements });
}
