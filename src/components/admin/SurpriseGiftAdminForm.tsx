"use client";

import { useState } from "react";

const PRESETS = [
  { label: "100 Hits", hits: 100, spins: 0 },
  { label: "250 Hits", hits: 250, spins: 0 },
  { label: "500 Hits", hits: 500, spins: 0 },
  { label: "100 Hits + 1 spin", hits: 100, spins: 1 },
  { label: "250 Hits + 2 spins", hits: 250, spins: 2 },
] as const;

export function SurpriseGiftAdminForm({ poolSize }: { poolSize: number }) {
  const [hits, setHits] = useState(250);
  const [spins, setSpins] = useState(0);
  const [reason, setReason] = useState("Volume 111 surprise");
  const [announceDays, setAnnounceDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    name: string;
    hits: number;
    spins: number;
    poolSize: number;
  } | null>(null);

  async function giftNow() {
    if (
      !window.confirm(
        `Gift ${hits} Hits${spins ? ` + ${spins} spin(s)` : ""} to a random active member and announce it on the site?`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "surprise_gift",
          hits,
          spins,
          reason,
          announceDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Gift failed.");
        return;
      }
      const winnerName =
        data.gift?.winner?.name?.trim() ||
        data.gift?.winner?.email?.split("@")[0] ||
        "a member";
      setResult({
        name: winnerName,
        hits: data.gift.hits,
        spins: data.gift.spins,
        poolSize: data.gift.poolSize,
      });
    } catch {
      setError("Gift failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gh-glass space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
          Surprise gift a random active member
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Picks someone who surfed in the last 14 days, gives them something of value, notifies
          them, and announces it in the site-wide banner. Active pool right now:{" "}
          <strong className="text-[var(--text)]">{poolSize}</strong>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`gh-badge min-h-9 cursor-pointer transition ${
              hits === p.hits && spins === p.spins
                ? "border-[var(--theme-accent)] bg-[var(--theme-wash)] text-[var(--text)]"
                : ""
            }`}
            onClick={() => {
              setHits(p.hits);
              setSpins(p.spins);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="gh-label" htmlFor="giftHits">
            Hits to gift
          </label>
          <input
            id="giftHits"
            type="number"
            min={1}
            max={50000}
            step={1}
            className="gh-input"
            value={hits}
            onChange={(e) => setHits(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="giftSpins">
            Extra wheel spins
          </label>
          <input
            id="giftSpins"
            type="number"
            min={0}
            max={20}
            step={1}
            className="gh-input"
            value={spins}
            onChange={(e) => setSpins(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="announceDays">
            Announce for (days)
          </label>
          <input
            id="announceDays"
            type="number"
            min={1}
            max={30}
            step={1}
            className="gh-input"
            value={announceDays}
            onChange={(e) => setAnnounceDays(Number(e.target.value) || 7)}
          />
        </div>
      </div>

      <div>
        <label className="gh-label" htmlFor="giftReason">
          Reason / vibe (shown to winner)
        </label>
        <input
          id="giftReason"
          className="gh-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={120}
          placeholder="Rainbow Month surprise"
        />
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {result ? (
        <p className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
          Gifted <strong>{result.name}</strong> {result.hits} Hits
          {result.spins ? ` + ${result.spins} spin(s)` : ""}. Announced on the site (pool was{" "}
          {result.poolSize}).
        </p>
      ) : null}

      <button
        type="button"
        className="gh-btn gh-btn-primary min-h-11"
        disabled={busy || poolSize < 1 || hits < 1}
        onClick={() => void giftNow()}
      >
        {busy ? "Gifting…" : "Gift a random active member"}
      </button>
    </div>
  );
}
