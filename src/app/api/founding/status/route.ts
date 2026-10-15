import { NextResponse } from "next/server";
import { getFoundingStatus } from "@/lib/founding";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getFoundingStatus();
  return NextResponse.json(status);
}
