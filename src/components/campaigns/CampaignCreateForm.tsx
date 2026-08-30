"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PriorityTier } from "@prisma/client";

type WebsiteOption = {
  id: string;
  title: string;
  url: string;
  moderationStatus: string;
};

const ALL_PRIORITIES: { value: PriorityTier; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "boosted", label: "Boosted (Plus+)" },
  { value: "featured", label: "Featured (Premium+)" },
  { value: "premium", label: "Premium (VIP)" },
];

const DAYS = [
  { v: 0, l: "Sun" },
  { v: 1, l: "Mon" },
  { v: 2, l: "Tue" },
  { v: 3, l: "Wed" },
  { v: 4, l: "Thu" },
  { v: 5, l: "Fri" },
  { v: 6, l: "Sat" },
];

export function CampaignCreateForm({
  websites,
  allowedPriorities = ["standard", "boosted", "featured", "premium"],
}: {
  websites: WebsiteOption[];
  allowedPriorities?: PriorityTier[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"always" | "custom">("always");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const eligible = websites.filter(
    (w) => w.moderationStatus !== "blocked" && w.moderationStatus !== "rejected",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const geoRaw = String(form.get("geoTargets") || "WW");
    const body = {
      websiteId: String(form.get("websiteId") || ""),
      name: String(form.get("name") || "").trim(),
      visitDurationSec: Number(form.get("visitDurationSec") || 15),
      dailyVisitCap: form.get("dailyVisitCap")
        ? Number(form.get("dailyVisitCap"))
        : null,
      hourlyVisitCap: form.get("hourlyVisitCap")
        ? Number(form.get("hourlyVisitCap"))
        : null,
      frequencyCapHours: Number(form.get("frequencyCapHours") || 24),
      priority: String(form.get("priority") || "standard"),
      deliveryMode: String(form.get("deliveryMode") || "evenly"),
      deviceTarget: String(form.get("deviceTarget") || "all"),
      geoTargets: geoRaw
        .split(",")
        .map((g) => g.trim().toUpperCase())
        .filter(Boolean),
      schedule:
        scheduleMode === "always"
          ? { mode: "always" as const }
          : {
              mode: "custom" as const,
              days,
              hours: String(form.get("hours") || "9,10,11,12,13,14,15,16,17,18")
                .split(",")
                .map((h) => Number(h.trim()))
                .filter((n) => Number.isInteger(n) && n >= 0 && n <= 23),
            },
      creditAllocation: Number(form.get("creditAllocation") || 0),
    };

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Could not create campaign");
      }
      router.push("/campaigns");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create campaign");
    } finally {
      setBusy(false);
    }
  }

  if (eligible.length === 0) {
    return (
      <div className="gh-glass p-6">
        <p className="text-[var(--text-muted)]">
          Add an eligible website before creating a campaign.
        </p>
        <a href="/websites/new" className="gh-btn gh-btn-primary mt-4 inline-flex">
          Add website
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="gh-glass space-y-4 p-6">
      <div>
        <label className="gh-label" htmlFor="websiteId">
          Website
        </label>
        <select id="websiteId" name="websiteId" required className="gh-input">
          {eligible.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title} — {w.url}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="gh-label" htmlFor="name">
          Campaign name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          className="gh-input"
          placeholder="Launch week push"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="gh-label" htmlFor="visitDurationSec">
            Visit duration (seconds)
          </label>
          <input
            id="visitDurationSec"
            name="visitDurationSec"
            type="number"
            min={10}
            max={120}
            defaultValue={15}
            className="gh-input"
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="creditAllocation">
            Credit allocation
          </label>
          <input
            id="creditAllocation"
            name="creditAllocation"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="gh-input"
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="dailyVisitCap">
            Daily visit cap (optional)
          </label>
          <input
            id="dailyVisitCap"
            name="dailyVisitCap"
            type="number"
            min={1}
            className="gh-input"
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="hourlyVisitCap">
            Hourly visit cap (optional)
          </label>
          <input
            id="hourlyVisitCap"
            name="hourlyVisitCap"
            type="number"
            min={1}
            className="gh-input"
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="frequencyCapHours">
            Frequency cap (hours)
          </label>
          <input
            id="frequencyCapHours"
            name="frequencyCapHours"
            type="number"
            min={1}
            max={168}
            defaultValue={24}
            className="gh-input"
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="priority">
            Priority
          </label>
          <select id="priority" name="priority" className="gh-input" defaultValue="standard">
            {ALL_PRIORITIES.map((p) => (
              <option
                key={p.value}
                value={p.value}
                disabled={!allowedPriorities.includes(p.value)}
              >
                {p.label}
                {!allowedPriorities.includes(p.value) ? " — upgrade" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="gh-label" htmlFor="deliveryMode">
            Delivery mode
          </label>
          <select id="deliveryMode" name="deliveryMode" className="gh-input" defaultValue="evenly">
            <option value="evenly">Evenly</option>
            <option value="fastest">Fastest</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="gh-label" htmlFor="deviceTarget">
            Device target
          </label>
          <select id="deviceTarget" name="deviceTarget" className="gh-input" defaultValue="all">
            <option value="all">All</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
          </select>
        </div>
      </div>

      <div>
        <label className="gh-label" htmlFor="geoTargets">
          Geo targets (ISO codes, WW = worldwide)
        </label>
        <input
          id="geoTargets"
          name="geoTargets"
          className="gh-input"
          defaultValue="WW"
          placeholder="WW or US,CA,GB"
        />
      </div>

      <fieldset className="rounded-xl border border-[var(--border-glass)] p-4">
        <legend className="px-1 text-sm font-medium">Schedule</legend>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={scheduleMode === "always"}
              onChange={() => setScheduleMode("always")}
            />
            Always on
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={scheduleMode === "custom"}
              onChange={() => setScheduleMode("custom")}
            />
            Custom days / hours
          </label>
        </div>
        {scheduleMode === "custom" ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const on = days.includes(d.v);
                return (
                  <button
                    key={d.v}
                    type="button"
                    className={`rounded-lg px-3 py-1 text-xs ${
                      on ? "bg-white/15 text-[var(--text)]" : "bg-[var(--bg-glass)] text-[var(--text)]/50"
                    }`}
                    onClick={() =>
                      setDays((prev) =>
                        on ? prev.filter((x) => x !== d.v) : [...prev, d.v].sort(),
                      )
                    }
                  >
                    {d.l}
                  </button>
                );
              })}
            </div>
            <div>
              <label className="gh-label" htmlFor="hours">
                Hours (0–23, comma-separated, UTC)
              </label>
              <input
                id="hours"
                name="hours"
                className="gh-input"
                defaultValue="9,10,11,12,13,14,15,16,17,18"
              />
            </div>
          </div>
        ) : null}
      </fieldset>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" className="gh-btn gh-btn-primary" disabled={busy}>
        {busy ? "Creating…" : "Create campaign"}
      </button>
    </form>
  );
}
