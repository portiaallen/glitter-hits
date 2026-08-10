"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CampaignStatusControls({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: "active" | "paused") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Update failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {status === "active" ? (
          <button
            type="button"
            className="gh-btn gh-btn-ghost px-3 py-2 text-sm"
            disabled={busy}
            onClick={() => void setStatus("paused")}
          >
            Pause
          </button>
        ) : null}
        {status === "paused" || status === "draft" || status === "exhausted" ? (
          <button
            type="button"
            className="gh-btn gh-btn-primary px-3 py-2 text-sm"
            disabled={busy}
            onClick={() => void setStatus("active")}
          >
            Resume
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
