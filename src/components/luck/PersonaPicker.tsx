"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Persona = {
  id: string;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  unlockLuckMin: number;
  unlocked: boolean;
  selected: boolean;
};

export function PersonaPicker({ personas }: { personas: Persona[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function select(id: string) {
    startTransition(async () => {
      await fetch("/api/luck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select_persona", personaId: id }),
      });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {personas.map((p) => (
        <div
          key={p.id}
          className="gh-glass p-5"
          style={{ boxShadow: p.selected ? `0 0 0 1px ${p.accentColor}` : undefined }}
        >
          <p className="text-3xl">{p.icon}</p>
          <h3 className="mt-2 font-semibold">{p.name}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{p.description}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Unlock at {p.unlockLuckMin} Luck</p>
          {p.selected ? (
            <span className="gh-badge mt-3 inline-flex">Selected</span>
          ) : p.unlocked ? (
            <button
              type="button"
              disabled={pending}
              className="gh-btn gh-btn-primary mt-3 text-sm"
              onClick={() => select(p.id)}
            >
              Choose
            </button>
          ) : (
            <span className="mt-3 inline-block text-xs text-[var(--text-muted)]">Locked</span>
          )}
        </div>
      ))}
    </div>
  );
}
