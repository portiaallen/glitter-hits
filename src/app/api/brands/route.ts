import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { estimateNetworkAvailability } from "@/lib/delivery/engine";

export async function GET() {
  const [brands, categories, availability] = await Promise.all([
    prisma.brand.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    estimateNetworkAvailability(),
  ]);
  return NextResponse.json({ brands, categories, availability });
}
