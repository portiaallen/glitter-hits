import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordMarketingConsent, verifyUnsubscribeToken } from "@/lib/marketing-consent";

// One-click unsubscribe honored across every brand mailing list. Works without
// a session: the link is HMAC-signed with the server secret.
export async function GET(req: NextRequest) {
  const email = String(req.nextUrl.searchParams.get("email") || "")
    .toLowerCase()
    .trim();
  const token = String(req.nextUrl.searchParams.get("token") || "");
  const base = req.nextUrl.origin;

  if (!email || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(`${base}/unsubscribed?status=invalid`, 303);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Do not leak whether the address exists; show the generic confirmation.
    return NextResponse.redirect(`${base}/unsubscribed?status=done`, 303);
  }

  await recordMarketingConsent(user.id, false, "unsubscribe-link");
  return NextResponse.redirect(`${base}/unsubscribed?status=done`, 303);
}
