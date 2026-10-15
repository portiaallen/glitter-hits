"use client";

import { useEffect, useState } from "react";

type FoundingStatus = {
  claimed: number;
  cap: number;
  spotsLeft: number;
  open: boolean;
};

export function FoundingCounter({ initial }: { initial: FoundingStatus }) {
  const [status, setStatus] = useState<FoundingStatus>(initial);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/founding/status", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as FoundingStatus;
        if (alive) setStatus(next);
      } catch {
        // keep the last known numbers; the next poll retries
      }
    };
    const id = setInterval(tick, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const pct = Math.min(100, Math.round((status.claimed / status.cap) * 100));

  if (!status.open) {
    return (
      <div className="gh-glass mx-auto max-w-md rounded-3xl p-8 text-center">
        <p className="gh-gradient-text font-[family-name:var(--font-syne)] text-4xl font-extrabold">
          The Founding 500 is full
        </p>
        <p className="mt-3 text-[var(--text-muted)]">
          All {status.cap} founding spots are claimed. Thank you, founding members!
        </p>
      </div>
    );
  }

  return (
    <div className="gh-glass mx-auto w-full max-w-xl rounded-3xl p-8 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
        Founding spots claimed
      </p>
      <p className="gh-gradient-text mt-2 font-[family-name:var(--font-syne)] text-6xl font-extrabold tabular-nums sm:text-7xl">
        {status.claimed}
        <span className="text-3xl text-[var(--text-muted)] sm:text-4xl">
          {" "}of {status.cap}
        </span>
      </p>
      <div
        className="mt-5 h-3 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Founding spots claimed"
        style={{ background: "var(--theme-wash)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(pct, 2)}%`,
            background: "linear-gradient(90deg, var(--theme-accent), var(--theme-accent-2))",
          }}
        />
      </div>
      <p className="mt-4 text-sm text-[var(--text-muted)]">
        Next member joins as{" "}
        <strong className="text-[var(--text)]">spot #{status.claimed + 1}</strong> of {status.cap}.
        When 500 are gone, the package is gone for good.
      </p>
    </div>
  );
}
