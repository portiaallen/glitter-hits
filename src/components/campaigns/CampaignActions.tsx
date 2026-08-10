"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CampaignActions({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: string, amount?: number) {
    setBusy(true);
    await fetch("/api/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, action, amount }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {status === "active" ? (
        <button disabled={busy} className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs" onClick={() => run("pause")}>
          Pause
        </button>
      ) : status !== "archived" ? (
        <button disabled={busy} className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs" onClick={() => run("resume")}>
          Resume
        </button>
      ) : null}
      <button
        disabled={busy}
        className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs"
        onClick={() => {
          const amount = Number(prompt("Allocate how many Glitter Hits?", "10"));
          if (Number.isInteger(amount) && amount > 0) run("allocate", amount);
        }}
      >
        Allocate
      </button>
      <button disabled={busy} className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs" onClick={() => run("duplicate")}>
        Duplicate
      </button>
      <button disabled={busy} className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs" onClick={() => run("archive")}>
        Archive
      </button>
    </div>
  );
}
