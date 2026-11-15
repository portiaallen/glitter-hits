"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ModerationControls({
  websiteId,
  deleteAccess,
}: {
  websiteId: string;
  deleteAccess?: "allowed" | "history";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; message: string } | null>(null);

  async function submit(payload: Record<string, unknown>, successMessage: string) {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, ...payload }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(typeof result?.error === "string" ? result.error : "The site was not updated.");
      }
      setNotice({ error: false, message: successMessage });
      router.refresh();
    } catch (error) {
      setNotice({
        error: true,
        message: error instanceof Error ? error.message : "The site was not updated.",
      });
    } finally {
      setBusy(false);
    }
  }

  function deleteWebsite() {
    if (deleteAccess !== "allowed") return;
    if (!window.confirm("Permanently delete this site? Sites with campaign, report, or placement history cannot be deleted.")) return;
    void submit({ action: "delete_website" }, "Site deleted.");
  }

  async function moderate(
    status: "approved" | "rejected" | "suspended" | "blocked",
    extras?: { queerdomPick?: boolean; featured?: boolean },
  ) {
    await submit({ action: "moderate_website", status, ...extras }, `Site ${status}.`);
  }

  return (
    <div className="space-y-2">
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
        {deleteAccess === "allowed" && (
          <button type="button" disabled={busy} className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs" onClick={deleteWebsite}>
            Delete site
          </button>
        )}
      </div>
      {deleteAccess === "history" && (
        <p className="text-xs text-[var(--text-muted)]">
          This site has history. Use Block to remove it from discovery.
        </p>
      )}
      {notice && (
        <p role={notice.error ? "alert" : "status"} className="text-sm">
          {notice.message}
        </p>
      )}
    </div>
  );
}
