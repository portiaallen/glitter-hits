"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function PlacementAdminControls({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(next: string) {
    startTransition(async () => {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_placement_status",
          placementId: id,
          status: next,
        }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {status !== "active" ? (
        <button
          type="button"
          disabled={pending}
          className="gh-btn gh-btn-ghost px-2 py-1 text-xs"
          onClick={() => setStatus("active")}
        >
          Activate
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          className="gh-btn gh-btn-ghost px-2 py-1 text-xs"
          onClick={() => setStatus("paused")}
        >
          Pause
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        className="gh-btn gh-btn-ghost px-2 py-1 text-xs"
        onClick={() => setStatus("disabled")}
      >
        Disable
      </button>
    </div>
  );
}
