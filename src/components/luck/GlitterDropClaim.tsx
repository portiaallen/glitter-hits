"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Drop = {
  id: string;
  rarity: string;
  rewardLabel: string;
  expiresAt: string | Date;
};

export function GlitterDropClaim({ drop }: { drop: Drop | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [visible, setVisible] = useState(!!drop);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<string | null>(null);

  useEffect(() => {
    setVisible(!!drop);
    setClaimed(null);
    setError(null);
  }, [drop?.id]);

  if (!drop || !visible) return null;

  function claim() {
    startTransition(async () => {
      const res = await fetch("/api/luck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim_drop", dropId: drop!.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not claim");
        return;
      }
      setClaimed(drop!.rewardLabel);
      window.setTimeout(() => {
        setVisible(false);
        router.refresh();
      }, 1600);
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-8">
      <div className="gh-drop-card w-full max-w-md p-5 text-center">
        {claimed ? (
          <>
            <p className="font-[family-name:var(--font-syne)] text-2xl font-bold">✨ Claimed!</p>
            <p className="mt-2 text-[var(--neon-gold)]">{claimed}</p>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text)]/50">
              {drop.rarity} drop
            </p>
            <p className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold">
              ✨ A Glitter Drop has appeared!
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Claim it before it disappears.
            </p>
            {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
            <button
              type="button"
              disabled={pending}
              onClick={claim}
              className="gh-btn gh-btn-primary mt-4"
            >
              {pending ? "Claiming…" : "Claim Drop"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
