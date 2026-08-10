"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

type Website = { id: string; title: string; url: string };

export default function NewCampaignPage() {
  const router = useRouter();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/websites")
      .then((r) => r.json())
      .then((d) => setWebsites(d.websites || []))
      .catch(() => setWebsites([]));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const creditAllocation = Number(form.get("creditAllocation") || 0);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        websiteId: form.get("websiteId"),
        name: form.get("name"),
        visitDurationSec: Number(form.get("visitDurationSec") || 15),
        dailyVisitCap: form.get("dailyVisitCap")
          ? Number(form.get("dailyVisitCap"))
          : null,
        hourlyVisitCap: form.get("hourlyVisitCap")
          ? Number(form.get("hourlyVisitCap"))
          : null,
        frequencyCapHours: Number(form.get("frequencyCapHours") || 24),
        priority: form.get("priority") || "standard",
        deliveryMode: form.get("deliveryMode") || "evenly",
        deviceTarget: form.get("deviceTarget") || "all",
        geoTargets: String(form.get("geoTargets") || "WW")
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        creditAllocation: Number.isInteger(creditAllocation) ? creditAllocation : 0,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Failed to create campaign");
      return;
    }
    router.push("/campaigns");
    router.refresh();
  }

  return (
    <AppShell title="Create Campaign" subtitle="Targeting availability is honest — we never guarantee volume.">
      <form onSubmit={onSubmit} className="gh-glass mx-auto max-w-2xl space-y-4 p-6">
        <div>
          <label className="gh-label" htmlFor="websiteId">Website</label>
          <select id="websiteId" name="websiteId" required className="gh-input">
            <option value="">Select…</option>
            {websites.map((w) => (
              <option key={w.id} value={w.id}>{w.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="gh-label" htmlFor="name">Campaign name</label>
          <input id="name" name="name" required className="gh-input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="gh-label" htmlFor="visitDurationSec">Visit duration (sec)</label>
            <input id="visitDurationSec" name="visitDurationSec" type="number" min={10} max={120} defaultValue={15} className="gh-input" />
          </div>
          <div>
            <label className="gh-label" htmlFor="creditAllocation">Allocate credits</label>
            <input id="creditAllocation" name="creditAllocation" type="number" min={0} defaultValue={10} className="gh-input" />
          </div>
          <div>
            <label className="gh-label" htmlFor="dailyVisitCap">Daily cap</label>
            <input id="dailyVisitCap" name="dailyVisitCap" type="number" min={1} className="gh-input" />
          </div>
          <div>
            <label className="gh-label" htmlFor="hourlyVisitCap">Hourly cap</label>
            <input id="hourlyVisitCap" name="hourlyVisitCap" type="number" min={1} className="gh-input" />
          </div>
          <div>
            <label className="gh-label" htmlFor="frequencyCapHours">Frequency cap (hours)</label>
            <input id="frequencyCapHours" name="frequencyCapHours" type="number" min={1} max={168} defaultValue={24} className="gh-input" />
          </div>
          <div>
            <label className="gh-label" htmlFor="priority">Priority</label>
            <select id="priority" name="priority" className="gh-input" defaultValue="standard">
              <option value="standard">Standard</option>
              <option value="boosted">Boosted</option>
              <option value="featured">Featured</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="gh-label" htmlFor="deliveryMode">Delivery</label>
            <select id="deliveryMode" name="deliveryMode" className="gh-input" defaultValue="evenly">
              <option value="fastest">Fastest available</option>
              <option value="evenly">Evenly distributed</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="gh-label" htmlFor="deviceTarget">Device</label>
            <select id="deviceTarget" name="deviceTarget" className="gh-input" defaultValue="all">
              <option value="all">All</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
        </div>
        <div>
          <label className="gh-label" htmlFor="geoTargets">Geo targets (comma codes, WW = worldwide)</label>
          <input id="geoTargets" name="geoTargets" className="gh-input" defaultValue="WW" />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" disabled={busy} className="gh-btn gh-btn-primary">
          {busy ? "Creating…" : "Create campaign"}
        </button>
      </form>
    </AppShell>
  );
}
