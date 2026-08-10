"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type PendingSite = {
  id: string;
  title: string;
  url: string;
  moderationStatus: string;
  moderationNotes: string | null;
  reportCount: number;
  isQueerdomPick: boolean;
  isFeatured: boolean;
  user: { id: string; email: string; name: string | null };
  category: { name: string } | null;
};

type OpenReport = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string | Date;
  website: { id: string; title: string; url: string };
  reporter: { id: string; email: string; name: string | null };
};

export function ModerationQueue({
  pendingSites,
  openReports,
}: {
  pendingSites: PendingSite[];
  openReports: OpenReport[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function moderate(
    websiteId: string,
    status: "approved" | "rejected" | "suspended" | "blocked",
    extras?: { queerdomPick?: boolean; featured?: boolean },
  ) {
    setError(null);
    setBusyId(websiteId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderate_website",
          websiteId,
          status,
          notes: notes[websiteId] || undefined,
          queerdomPick: extras?.queerdomPick,
          featured: extras?.featured,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Moderation failed");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Moderation failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl border border-[rgba(255,107,138,0.4)] bg-[rgba(255,107,138,0.1)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <section className="gh-glass overflow-hidden">
        <div className="border-b border-[var(--border-glass)] px-6 py-5">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">Pending sites</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {pendingSites.length} site{pendingSites.length === 1 ? "" : "s"} awaiting review.
          </p>
        </div>
        <ul className="divide-y divide-[var(--border-glass)]">
          {pendingSites.map((site) => (
            <li key={site.id} className="px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-[family-name:var(--font-syne)] font-semibold">{site.title}</p>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[var(--neon-cyan)] hover:underline"
                  >
                    {site.url}
                  </a>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                    <span className="gh-badge">{site.moderationStatus}</span>
                    <span className="gh-badge">{site.category?.name ?? "uncategorized"}</span>
                    <span>
                      Owner: {site.user.name || site.user.email}
                    </span>
                    <span>Reports: {site.reportCount}</span>
                  </div>
                  <label className="gh-label mt-4" htmlFor={`notes-${site.id}`}>
                    Notes
                  </label>
                  <input
                    id={`notes-${site.id}`}
                    className="gh-input"
                    value={notes[site.id] ?? site.moderationNotes ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [site.id]: e.target.value }))
                    }
                    placeholder="Optional moderation notes"
                  />
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                  <button
                    type="button"
                    className="gh-btn gh-btn-primary px-4 py-2 text-sm"
                    disabled={pending || busyId === site.id}
                    onClick={() => moderate(site.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="gh-btn gh-btn-ghost px-4 py-2 text-sm"
                    disabled={pending || busyId === site.id}
                    onClick={() => moderate(site.id, "rejected")}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="gh-btn gh-btn-ghost px-4 py-2 text-sm"
                    disabled={pending || busyId === site.id}
                    onClick={() => moderate(site.id, "approved", { featured: true })}
                  >
                    Approve + feature
                  </button>
                  <button
                    type="button"
                    className="gh-btn gh-btn-ghost px-4 py-2 text-sm"
                    disabled={pending || busyId === site.id}
                    onClick={() => moderate(site.id, "approved", { queerdomPick: true })}
                  >
                    Queerdom pick
                  </button>
                  <button
                    type="button"
                    className="gh-btn gh-btn-ghost px-4 py-2 text-sm"
                    disabled={pending || busyId === site.id}
                    onClick={() => moderate(site.id, "suspended")}
                  >
                    Suspend
                  </button>
                </div>
              </div>
            </li>
          ))}
          {pendingSites.length === 0 && (
            <li className="px-6 py-10 text-center text-[var(--text-muted)]">
              Queue is clear.
            </li>
          )}
        </ul>
      </section>

      <section className="gh-glass overflow-hidden">
        <div className="border-b border-[var(--border-glass)] px-6 py-5">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">Open reports</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {openReports.length} open report{openReports.length === 1 ? "" : "s"}.
          </p>
        </div>
        <ul className="divide-y divide-[var(--border-glass)]">
          {openReports.map((report) => (
            <li key={report.id} className="px-6 py-4">
              <p className="font-medium">{report.website.title}</p>
              <p className="text-sm text-[var(--text-muted)]">{report.website.url}</p>
              <p className="mt-2 text-sm">
                <span className="gh-badge">{report.reason}</span>
                <span className="ml-2 text-[var(--text-muted)]">
                  by {report.reporter.name || report.reporter.email}
                </span>
              </p>
              {report.details && (
                <p className="mt-2 text-sm text-[var(--text-muted)]">{report.details}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="gh-btn gh-btn-ghost px-4 py-2 text-sm"
                  disabled={pending || busyId === report.website.id}
                  onClick={() => moderate(report.website.id, "suspended")}
                >
                  Suspend site
                </button>
                <button
                  type="button"
                  className="gh-btn gh-btn-ghost px-4 py-2 text-sm"
                  disabled={pending || busyId === report.website.id}
                  onClick={() => moderate(report.website.id, "blocked")}
                >
                  Block site
                </button>
              </div>
            </li>
          ))}
          {openReports.length === 0 && (
            <li className="px-6 py-10 text-center text-[var(--text-muted)]">
              No open reports.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
