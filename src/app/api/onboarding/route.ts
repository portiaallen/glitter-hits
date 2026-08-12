import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  dismissOnboarding,
  estimateCampaignDelivery,
  getDashboardDeliverySummary,
  getOnboardingState,
} from "@/lib/onboarding/service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if (campaignId) {
    try {
      return NextResponse.json(
        await estimateCampaignDelivery(campaignId, session.user.id),
      );
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed" },
        { status: 400 },
      );
    }
  }

  const [onboarding, delivery] = await Promise.all([
    getOnboardingState(session.user.id),
    getDashboardDeliverySummary(session.user.id),
  ]);

  return NextResponse.json({ onboarding, delivery });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (body.action === "dismiss") {
    await dismissOnboarding(session.user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
