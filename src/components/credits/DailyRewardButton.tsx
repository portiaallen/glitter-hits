"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DailyRewardButton() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function claim() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "daily" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not claim");
      return;
    }
    setMsg(`Claimed ${data.amount} Hits (streak day ${data.streakDay})`);
    router.refresh();
  }

  return (
    <div className="gh-glass flex flex-wrap items-center justify-between gap-3 p-5">
      <div>
        <h2 className="font-semibold">Daily reward</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Claim once per UTC day. Streak bonuses stack up to the admin cap.
        </p>
        {msg && <p className="mt-2 text-sm text-[var(--neon-cyan)]">{msg}</p>}
      </div>
      <button type="button" disabled={busy} onClick={claim} className="gh-btn gh-btn-primary">
        {busy ? "Claiming…" : "Claim daily"}
      </button>
    </div>
  );
}
