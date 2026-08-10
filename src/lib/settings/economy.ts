import { prisma } from "@/lib/db";

export type EconomySettings = {
  creditsPerCompletedSurf: number;
  creditsChargedPerVisit: number;
  minVisitDurationSec: number;
  maxVisitDurationSec: number;
  defaultVisitDurationSec: number;
  skipAllowedAfterSec: number;
  referralSignupBonus: number;
  referralQualifiedBonus: number;
  referralPercentOfRefereeEarnings: number;
  dailyRewardBase: number;
  weeklyActivityBonus: number;
  streakBonusPerDay: number;
  maxStreakBonus: number;
  signupBonusCredits: number;
  allowAutomatedViewers: boolean;
  automatedViewerMultiplier: number; // integer percent, e.g. 50 = half credits
};

export const DEFAULT_ECONOMY: EconomySettings = {
  creditsPerCompletedSurf: 1,
  creditsChargedPerVisit: 1,
  minVisitDurationSec: 10,
  maxVisitDurationSec: 120,
  defaultVisitDurationSec: 15,
  skipAllowedAfterSec: 5,
  referralSignupBonus: 5,
  referralQualifiedBonus: 25,
  referralPercentOfRefereeEarnings: 10,
  dailyRewardBase: 5,
  weeklyActivityBonus: 20,
  streakBonusPerDay: 1,
  maxStreakBonus: 14,
  signupBonusCredits: 50,
  allowAutomatedViewers: true,
  automatedViewerMultiplier: 50,
};

export async function getEconomySettings(): Promise<EconomySettings> {
  const row = await prisma.systemSetting.findUnique({ where: { key: "economy" } });
  if (!row) return { ...DEFAULT_ECONOMY };
  try {
    return { ...DEFAULT_ECONOMY, ...(JSON.parse(row.valueJson) as Partial<EconomySettings>) };
  } catch {
    return { ...DEFAULT_ECONOMY };
  }
}

export async function setEconomySettings(
  settings: Partial<EconomySettings>,
  updatedBy?: string,
): Promise<EconomySettings> {
  const current = await getEconomySettings();
  const next = { ...current, ...settings };
  // Coerce all numeric fields to integers
  (Object.keys(next) as (keyof EconomySettings)[]).forEach((key) => {
    const val = next[key];
    if (typeof val === "number") {
      (next as Record<string, number | boolean>)[key] = Number.isInteger(val)
        ? val
        : Math.trunc(val);
    }
  });
  await prisma.systemSetting.upsert({
    where: { key: "economy" },
    create: { key: "economy", valueJson: JSON.stringify(next), updatedBy },
    update: { valueJson: JSON.stringify(next), updatedBy },
  });
  return next;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  try {
    return JSON.parse(row.valueJson) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown, updatedBy?: string) {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, valueJson: JSON.stringify(value), updatedBy },
    update: { valueJson: JSON.stringify(value), updatedBy },
  });
}
