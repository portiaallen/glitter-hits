"use client";

import { useState } from "react";
import type { MonthlyTheme } from "@/lib/experience/monthly-theme";

export function MonthlyThemeAdminForm({
  themes,
  activeSlug,
}: {
  themes: MonthlyTheme[];
  activeSlug: string;
}) {
  const [selected, setSelected] = useState(activeSlug);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = themes.find((t) => t.slug === selected) ?? themes[0];

  async function save() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_monthly_theme", slug: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save theme.");
        return;
      }
      setMsg(`Live theme set to ${data.theme?.name || selected}. Refresh the site to see it everywhere.`);
    } catch {
      setError("Could not save theme.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="gh-glass p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
          Theme of the Month
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Pick what bizarre thing Glitter Hits is doing this month. This updates homepage copy,
          Explore the Hits language, collectible hints, and accent washes — without rebuilding the
          app.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => {
            const active = selected === theme.slug;
            return (
              <button
                key={theme.slug}
                type="button"
                onClick={() => setSelected(theme.slug)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-[var(--theme-accent)] bg-[var(--theme-wash)] shadow-[var(--shadow-soft)]"
                    : "border-[var(--border-glass)] bg-white/70 hover:border-[var(--theme-accent)]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--text)]">{theme.name}</p>
                  {theme.slug === activeSlug ? (
                    <span className="gh-badge">Live</span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                  {theme.tagline}
                </p>
                <div
                  className="mt-3 flex h-2 overflow-hidden rounded-full"
                  aria-hidden
                >
                  <span className="flex-1" style={{ background: theme.accents.primary }} />
                  <span className="flex-1" style={{ background: theme.accents.secondary }} />
                </div>
              </button>
            );
          })}
        </div>

        {current ? (
          <div className="mt-5 rounded-2xl border border-[var(--border-glass)] bg-white/80 p-4 text-sm">
            <p className="font-semibold text-[var(--text)]">Preview · {current.name}</p>
            <p className="mt-2 text-[var(--text-muted)]">{current.discoveryLine}</p>
            <p className="mt-2 text-[var(--text-muted)]">
              Collectible: <span className="text-[var(--text)]">{current.collectibleName}</span> —{" "}
              {current.collectibleHint}
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        {msg ? <p className="mt-3 text-sm text-[var(--success)]">{msg}</p> : null}

        <button
          type="button"
          className="gh-btn gh-btn-primary mt-5 min-h-11"
          disabled={busy || selected === activeSlug}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : selected === activeSlug ? "Already live" : "Make this theme live"}
        </button>
      </div>
    </div>
  );
}
