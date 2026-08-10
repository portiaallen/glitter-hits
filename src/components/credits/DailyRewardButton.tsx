"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DailyRewardButton() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function claim(action: "daily" | "weekly") {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not claim");
      return;
    }
    setMsg(
      action === "daily"
        ? `Claimed ${data.amount} Hits (streak day ${data.streakDay})`
        : `Claimed weekly ${data.amount} Hits (${data.weekKey})`,
    );
    router.refresh();
  }

  return (
    <div className="gh-glass flex flex-wrap items-center justify-between gap-3 p-5">
      <div>
        <h2 className="font-semibold">Daily & weekly rewards</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Daily claim once per UTC day. Weekly bonus unlocks after 5 discoveries this week.
        </p>
        {msg && <p className="mt-2 text-sm text-[var(--neon-cyan)]">{msg}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => claim("daily")}
          className="gh-btn gh-btn-primary"
        >
          {busy ? "…" : "Claim daily"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => claim("weekly")}
          className="gh-btn gh-btn-ghost"
        >
          Claim weekly
        </button>
      </div>
    </div>
  );
}
