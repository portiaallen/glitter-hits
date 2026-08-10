"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { EconomySettings } from "@/lib/settings/economy";

type Feature = {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
};

const ECONOMY_FIELDS: {
  key: keyof EconomySettings;
  label: string;
  type: "number" | "boolean";
}[] = [
  { key: "creditsPerCompletedSurf", label: "Credits per completed surf", type: "number" },
  { key: "creditsChargedPerVisit", label: "Credits charged per visit", type: "number" },
  { key: "minVisitDurationSec", label: "Min visit duration (s)", type: "number" },
  { key: "maxVisitDurationSec", label: "Max visit duration (s)", type: "number" },
  { key: "defaultVisitDurationSec", label: "Default visit duration (s)", type: "number" },
  { key: "skipAllowedAfterSec", label: "Skip allowed after (s)", type: "number" },
  { key: "referralSignupBonus", label: "Referral signup bonus", type: "number" },
  { key: "referralQualifiedBonus", label: "Referral qualified bonus", type: "number" },
  {
    key: "referralPercentOfRefereeEarnings",
    label: "Referral % of referee earnings",
    type: "number",
  },
  { key: "dailyRewardBase", label: "Daily reward base", type: "number" },
  { key: "weeklyActivityBonus", label: "Weekly activity bonus", type: "number" },
  { key: "streakBonusPerDay", label: "Streak bonus per day", type: "number" },
  { key: "maxStreakBonus", label: "Max streak bonus", type: "number" },
  { key: "signupBonusCredits", label: "Signup bonus credits", type: "number" },
  { key: "allowAutomatedViewers", label: "Allow automated viewers", type: "boolean" },
  {
    key: "automatedViewerMultiplier",
    label: "Automated viewer multiplier %",
    type: "number",
  },
];

export function SettingsEditor({
  economy,
  features,
}: {
  economy: EconomySettings;
  features: Feature[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settings, setSettings] = useState<EconomySettings>({ ...economy });
  const [featureState, setFeatureState] = useState(features);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function saveEconomy(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_economy", settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update economy");
      setSettings(data.economy);
      setMessage("Economy settings saved.");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update economy");
    }
  }

  async function toggleFeature(key: string, enabled: boolean) {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_monetization", key, enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle feature");
      setFeatureState((prev) =>
        prev.map((f) => (f.key === key ? { ...f, enabled: data.feature.enabled } : f)),
      );
      setMessage(`Updated ${key}.`);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle feature");
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl border border-[rgba(255,107,138,0.4)] bg-[rgba(255,107,138,0.1)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-xl border border-[rgba(93,255,176,0.35)] bg-[rgba(93,255,176,0.08)] px-4 py-3 text-sm text-[var(--success)]">
          {message}
        </p>
      )}

      <form onSubmit={saveEconomy} className="gh-glass p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
          Economy settings
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Integer credit economy — never floats, never Glitter Coins.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ECONOMY_FIELDS.map((field) => {
            if (field.type === "boolean") {
              return (
                <label key={field.key} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(settings[field.key])}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, [field.key]: e.target.checked }))
                    }
                  />
                  {field.label}
                </label>
              );
            }
            return (
              <div key={field.key}>
                <label className="gh-label" htmlFor={field.key}>
                  {field.label}
                </label>
                <input
                  id={field.key}
                  type="number"
                  step={1}
                  className="gh-input"
                  value={Number(settings[field.key])}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      [field.key]: Number.parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
            );
          })}
        </div>
        <button type="submit" className="gh-btn gh-btn-primary mt-6" disabled={pending}>
          Save economy
        </button>
      </form>

      <section className="gh-glass p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
          Monetization features
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Feature flags for future paid surfaces. Keep disabled until ready.
        </p>
        <ul className="mt-6 space-y-3">
          {featureState.map((feature) => (
            <li
              key={feature.key}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-glass)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{feature.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{feature.key}</p>
                {feature.description && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{feature.description}</p>
                )}
              </div>
              <button
                type="button"
                className={
                  feature.enabled
                    ? "gh-btn gh-btn-primary px-4 py-2 text-sm"
                    : "gh-btn gh-btn-ghost px-4 py-2 text-sm"
                }
                disabled={pending}
                onClick={() => toggleFeature(feature.key, !feature.enabled)}
              >
                {feature.enabled ? "Enabled" : "Disabled"}
              </button>
            </li>
          ))}
          {featureState.length === 0 && (
            <li className="text-sm text-[var(--text-muted)]">No monetization features seeded.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
