"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Feature = {
  key: string;
  name: string;
  enabled: boolean;
  description: string | null;
};

export function MonetizationToggles({ features }: { features: Feature[] }) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function toggle(key: string, enabled: boolean) {
    setBusyKey(key);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_monetization", key, enabled }),
    });
    setBusyKey(null);
    router.refresh();
  }

  return (
    <div className="gh-glass p-5">
      <h2 className="font-semibold">Monetization feature flags</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Enable streams individually. Free exchange works without payments.
      </p>
      <ul className="mt-4 space-y-3">
        {features.map((f) => (
          <li key={f.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div>
              <p className="font-medium">{f.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{f.description}</p>
            </div>
            <button
              disabled={busyKey === f.key}
              className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs"
              onClick={() => toggle(f.key, !f.enabled)}
            >
              {f.enabled ? "Disable" : "Enable"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
