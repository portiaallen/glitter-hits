"use client";

import { useState } from "react";
import type { EconomySettings } from "@/lib/settings/economy";

export function EconomyForm({ economy }: { economy: EconomySettings }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const settings: Record<string, number | boolean> = {};
    for (const [key, value] of form.entries()) {
      if (key === "allowAutomatedViewers") {
        settings[key] = value === "on";
      } else {
        settings[key] = Number(value);
      }
    }
    // checkbox absent when unchecked
    if (!form.get("allowAutomatedViewers")) settings.allowAutomatedViewers = false;

    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_economy", settings }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Economy updated." : data.error);
  }

  const fields: { key: keyof EconomySettings; label: string }[] = [
    { key: "creditsPerCompletedSurf", label: "Credits per completed surf" },
    { key: "creditsChargedPerVisit", label: "Credits charged per visit" },
    { key: "defaultVisitDurationSec", label: "Default visit duration (sec)" },
    { key: "minVisitDurationSec", label: "Min visit duration" },
    { key: "maxVisitDurationSec", label: "Max visit duration" },
    { key: "skipAllowedAfterSec", label: "Skip allowed after (sec)" },
    { key: "signupBonusCredits", label: "Signup bonus" },
    { key: "referralSignupBonus", label: "Referral signup bonus" },
    { key: "referralQualifiedBonus", label: "Referral qualified bonus" },
    { key: "referralPercentOfRefereeEarnings", label: "Referral % of earnings" },
    { key: "dailyRewardBase", label: "Daily reward base" },
    { key: "weeklyActivityBonus", label: "Weekly activity bonus" },
    { key: "streakBonusPerDay", label: "Streak bonus / day" },
    { key: "maxStreakBonus", label: "Max streak bonus" },
    { key: "automatedViewerMultiplier", label: "Automated viewer multiplier %" },
  ];

  return (
    <form onSubmit={onSubmit} className="gh-glass grid gap-3 p-5 sm:grid-cols-2">
      <h2 className="font-semibold sm:col-span-2">Exchange economy</h2>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="gh-label" htmlFor={f.key}>{f.label}</label>
          <input
            id={f.key}
            name={f.key}
            type="number"
            step={1}
            className="gh-input"
            defaultValue={Number(economy[f.key])}
          />
        </div>
      ))}
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="allowAutomatedViewers"
          defaultChecked={economy.allowAutomatedViewers}
        />
        Allow automated viewers (transparently labeled)
      </label>
      {msg && <p className="text-sm text-[var(--neon-cyan)] sm:col-span-2">{msg}</p>}
      <button disabled={busy} type="submit" className="gh-btn gh-btn-primary sm:col-span-2">
        Save economy settings
      </button>
    </form>
  );
}
