"use client";

import { useState, useTransition } from "react";
import { updateMarketingConsentAction } from "@/lib/actions/marketing";

export function MarketingEmailPrefs({
  optedIn,
  lastAt,
  copy,
}: {
  optedIn: boolean;
  lastAt: string | null;
  copy: string;
}) {
  const [state, setState] = useState(optedIn);
  const [saved, setSaved] = useState<string | null>(lastAt);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set(next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await updateMarketingConsentAction(next);
      if (result?.error) setError(result.error);
      else {
        setState(next);
        setSaved(new Date().toISOString());
      }
    });
  }

  return (
    <div className="gh-glass space-y-3 p-6 text-sm text-[var(--text-muted)]">
      <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold text-[var(--text)]">
        Marketing email
      </h2>
      <p>{copy}</p>
      <p className="text-xs">
        {state
          ? `Opted in${saved ? ` on ${new Date(saved).toLocaleString()}` : ""}. Unsubscribe anytime with the link in any marketing email, or right here.`
          : saved
            ? `Not opted in (last change ${new Date(saved).toLocaleString()}). Marketing email stays off until you opt in.`
            : "Not opted in. You were never asked to opt in, so nothing marketing has been sent to you."}
      </p>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <div className="flex gap-2">
        {state ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => set(false)}
            className="gh-btn gh-btn-ghost text-sm disabled:opacity-60"
          >
            {pending ? "Saving…" : "Turn off"}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => set(true)}
            className="gh-btn gh-btn-primary text-sm disabled:opacity-60"
          >
            {pending ? "Saving…" : "Opt in"}
          </button>
        )}
      </div>
    </div>
  );
}
