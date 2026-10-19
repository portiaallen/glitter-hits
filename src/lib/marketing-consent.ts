import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

// Cross-brand marketing email consent (opt-in only).
// Wording approved by the operator (Oct 15, 2026) with the counsel go recorded
// Oct 19, 2026. Every change to this copy bumps MARKETING_CONSENT_VERSION so
// the recorded consent always names the exact wording shown when it was given.

export const MARKETING_CONSENT_VERSION = "2026-10-19-v1";

export const MARKETING_CONSENT_COPY =
  "I'd like occasional promotions, special offers, and updates from Glitter Hits, " +
  "Glitter Universe, and PK Business Services, all operated by Portia Allen. Any brand " +
  "added later would be covered only after this notice is updated. Unsubscribe anytime " +
  "with the link in any email.";

export type ConsentStatus = "opted-in" | "opted-out";

export type ConsentEntry = {
  status: ConsentStatus;
  at: string; // UTC ISO timestamp
  version: string; // wording version in force when recorded
  source: string; // "signup" | "settings" | "unsubscribe-link"
};

export type MarketingConsentRecord = {
  current: ConsentStatus;
  entries: ConsentEntry[];
};

const keyFor = (userId: string) => `marketing-consent:${userId}`;
const MAX_ENTRIES = 50;

/** No record means the member was never asked: no marketing email, ever. */
export async function getMarketingConsent(
  userId: string,
): Promise<MarketingConsentRecord> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: keyFor(userId) },
  });
  if (!row) return { current: "opted-out", entries: [] };
  try {
    const parsed = JSON.parse(row.valueJson) as MarketingConsentRecord;
    if (parsed.current !== "opted-in" && parsed.current !== "opted-out") {
      return { current: "opted-out", entries: [] };
    }
    return parsed;
  } catch {
    return { current: "opted-out", entries: [] };
  }
}

/** True only for an explicit, recorded opt-in. Absence is never consent. */
export async function hasMarketingOptIn(userId: string): Promise<boolean> {
  return (await getMarketingConsent(userId)).current === "opted-in";
}

export async function recordMarketingConsent(
  userId: string,
  optIn: boolean,
  source: string,
): Promise<MarketingConsentRecord> {
  const existing = await getMarketingConsent(userId);
  const entry: ConsentEntry = {
    status: optIn ? "opted-in" : "opted-out",
    at: new Date().toISOString(),
    version: MARKETING_CONSENT_VERSION,
    source,
  };
  const next: MarketingConsentRecord = {
    current: entry.status,
    entries: [...existing.entries, entry].slice(-MAX_ENTRIES),
  };
  await prisma.systemSetting.upsert({
    where: { key: keyFor(userId) },
    create: { key: keyFor(userId), valueJson: JSON.stringify(next) },
    update: { valueJson: JSON.stringify(next) },
  });
  return next;
}

// ─── Unsubscribe link (honored across every brand mailing list) ──────────────
// Signed with the server's AUTH_SECRET; the link works without a session.

function unsubscribeSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

export function signUnsubscribeToken(email: string): string {
  return createHmac("sha256", unsubscribeSecret())
    .update(`${email.toLowerCase()}|marketing-unsubscribe|v1`)
    .digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = signUnsubscribeToken(email);
  const a = Buffer.from(expected);
  const b = Buffer.from(token || "");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function marketingUnsubscribeUrl(email: string, appUrl: string): string {
  const token = signUnsubscribeToken(email);
  return `${appUrl}/api/marketing/unsubscribe?email=${encodeURIComponent(
    email,
  )}&token=${token}`;
}
