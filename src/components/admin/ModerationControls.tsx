"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ModerationControls({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function moderate(
    status: "approved" | "rejected" | "suspended" | "blocked",
    extras?: { queerdomPick?: boolean; featured?: boolean },
  ) {
    setBusy(true);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "moderate_website",
        websiteId,
        status,
        ...extras,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={busy} className="gh-btn gh-btn-primary px-3 py-1.5 text-xs" onClick={() => moderate("approved")}>
        Approve
      </button>
      <button disabled={busy} className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs" onClick={() => moderate("approved", { queerdomPick: true })}>
        Queerdom Pick
      </button>
      <button disabled={busy} className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs" onClick={() => moderate("approved", { featured: true })}>
        Feature
      </button>
      <button disabled={busy} className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs" onClick={() => moderate("rejected")}>
        Reject
      </button>
      <button disabled={busy} className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs" onClick={() => moderate("blocked")}>
        Block
      </button>
    </div>
  );
}
