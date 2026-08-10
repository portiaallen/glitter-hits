"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WebsiteOption = {
  id: string;
  title: string;
  url: string;
  moderationStatus: string;
};

export function CampaignCreateForm({ websites }: { websites: WebsiteOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligible = websites.filter(
    (w) => w.moderationStatus !== "blocked" && w.moderationStatus !== "rejected",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = {
      websiteId: String(form.get("websiteId") || ""),
      name: String(form.get("name") || "").trim(),
      visitDurationSec: Number(form.get("visitDurationSec") || 15),
      dailyVisitCap: form.get("dailyVisitCap")
        ? Number(form.get("dailyVisitCap"))
        : null,
      priority: String(form.get("priority") || "standard"),
      deliveryMode: String(form.get("deliveryMode") || "evenly"),
      deviceTarget: String(form.get("deviceTarget") || "all"),
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
          <label className="gh-label" htmlFor="priority">
            Priority
          </label>
          <select id="priority" name="priority" className="gh-input" defaultValue="standard">
            <option value="standard">Standard</option>
            <option value="boosted">Boosted</option>
            <option value="featured">Featured</option>
            <option value="premium">Premium</option>
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
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" className="gh-btn gh-btn-primary" disabled={busy}>
        {busy ? "Creating…" : "Create campaign"}
      </button>
    </form>
  );
}
