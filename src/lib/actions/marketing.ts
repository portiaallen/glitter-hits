"use server";

import { auth } from "@/lib/auth";
import { recordMarketingConsent, getMarketingConsent } from "@/lib/marketing-consent";

export async function updateMarketingConsentAction(optIn: boolean) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Please log in first." };
  const record = await recordMarketingConsent(userId, optIn, "settings");
  return { ok: true, current: record.current };
}

export async function getMyMarketingConsentAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Please log in first." };
  return { ok: true, record: await getMarketingConsent(userId) };
}
