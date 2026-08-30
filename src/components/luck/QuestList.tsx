"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type QuestRow = {
  id: string;
  status: string;
  progress: number;
  target: number;
  quest: {
    name: string;
    description: string;
    icon: string;
    rarity: string;
    rewardHits: number;
    rewardLuck: number;
  };
};

export function QuestList({ quests }: { quests: QuestRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function claim(id: string) {
    startTransition(async () => {
      await fetch("/api/luck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim_quest", userQuestId: id }),
      });
      router.refresh();
    });
  }

  if (quests.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No quests yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {quests.map((q) => {
        const pct = Math.min(100, Math.floor((q.progress / Math.max(1, q.target)) * 100));
        return (
          <li key={q.id} className="gh-glass p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {q.quest.icon} {q.quest.name}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{q.quest.description}</p>
                <p className="mt-2 text-xs text-[var(--text)]/50">
                  +{q.quest.rewardHits} Hits · +{q.quest.rewardLuck} Luck · {q.quest.rarity}
                </p>
              </div>
              <span className="gh-badge">{q.status}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-glass)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--neon-pink)] to-[var(--neon-gold)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>
                {q.progress}/{q.target}
              </span>
              {q.status === "completed" ? (
                <button
                  type="button"
                  disabled={pending}
                  className="gh-btn gh-btn-primary px-3 py-1 text-xs"
                  onClick={() => claim(q.id)}
                >
                  Claim
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
