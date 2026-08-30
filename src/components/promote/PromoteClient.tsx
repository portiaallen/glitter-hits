"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Offer = {
  type: string;
  name: string;
  description: string;
  creditCost: number;
  listPrice: number;
  durationDays: number;
  membershipMin: string;
};

type Website = { id: string; title: string; url: string };

type Placement = {
  id: string;
  type: string;
  status: string;
  title: string | null;
  creditCost: number;
  endAt: string | Date | null;
  website: { title: string } | null;
};

export function PromoteClient({
  offers,
  websites,
  placements,
  balance,
  membership,
  enabled,
}: {
  offers: Offer[];
  websites: Website[];
  placements: Placement[];
  balance: number;
  membership: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [websiteId, setWebsiteId] = useState(websites[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function buy(type: string) {
    setError(null);
    setOk(null);
    if (!websiteId) {
      setError("Add and get an approved website first.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purchase", websiteId, type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Purchase failed");
        return;
      }
      setOk("Placement activated.");
      router.refresh();
    });
  }

  if (!enabled) {
    return (
      <p className="gh-glass p-5 text-sm text-[var(--text-muted)]">
        Featured placements are temporarily disabled by admin.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="gh-glass flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Balance · {membership}</p>
          <p className="text-2xl font-bold">{balance} hits</p>
        </div>
        <label className="text-sm">
          Promote website
          <select
            className="gh-input mt-1 min-w-[220px]"
            value={websiteId}
            onChange={(e) => setWebsiteId(e.target.value)}
          >
            {websites.length === 0 ? (
              <option value="">No approved sites</option>
            ) : (
              websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {(error || ok) && (
        <p className={`text-sm ${error ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {error || ok}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <div key={offer.type} className="gh-glass flex flex-col p-5">
            <p className="gh-badge mb-2">{offer.durationDays} days</p>
            <h3 className="font-semibold">{offer.name}</h3>
            <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">{offer.description}</p>
            <p className="mt-3 text-sm">
              <span className="text-xl font-bold">{offer.creditCost}</span> hits
              {offer.creditCost < offer.listPrice ? (
                <span className="ml-2 text-xs text-[var(--text-muted)] line-through">
                  {offer.listPrice}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Requires {offer.membershipMin}+
            </p>
            <button
              type="button"
              disabled={pending || !websiteId}
              onClick={() => buy(offer.type)}
              className="gh-btn gh-btn-primary mt-4 text-sm"
            >
              Activate
            </button>
          </div>
        ))}
      </div>

      <section className="gh-glass p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
          Your placements
        </h2>
        {placements.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">No placements yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {placements.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-glass)] pb-3 text-sm"
              >
                <div>
                  <p className="font-medium">{p.title || p.type}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {p.website?.title || "Site"} · {p.status}
                    {p.endAt
                      ? ` · until ${new Date(p.endAt).toISOString().slice(0, 10)}`
                      : ""}
                  </p>
                </div>
                <span className="text-[var(--text-muted)]">{p.creditCost} hits</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
