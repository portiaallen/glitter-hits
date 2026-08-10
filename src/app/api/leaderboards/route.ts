import { NextResponse } from "next/server";
import { getLeaderboards } from "@/lib/rewards/launch";

export async function GET() {
  const boards = await getLeaderboards();
  return NextResponse.json(boards);
}
