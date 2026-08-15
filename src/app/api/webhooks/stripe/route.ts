import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const payload = await request.text();
  const result = await handleStripeWebhook(payload, signature);

  if (!result.received) {
    return NextResponse.json({ error: result.error ?? "Webhook error" }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
