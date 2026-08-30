import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { listActiveChallenges } from "@/lib/luck/challenges";

export const metadata: Metadata = { title: "Community Challenges" };

export default async function ChallengesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const challenges = await listActiveChallenges();

  return (
    <AppShell
      title="🌈 Glitter Community Challenges"
      subtitle="Platform-wide goals. When we hit them together, every active contributor gets rewarded."
    >
      <div className="space-y-4">
        {challenges.length === 0 && (
          <p className="gh-glass p-5 text-[var(--text-muted)]">No challenges right now.</p>
        )}
        {challenges.map((c) => {
          const pct = Math.min(100, Math.floor((c.progress / Math.max(1, c.goal)) * 100));
          return (
            <div key={c.id} className="gh-glass p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                  {c.icon} {c.name}
                </h2>
                <span className="gh-badge">{c.status}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{c.description}</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--bg-glass)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-pink)] to-[var(--neon-gold)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-sm">
                {c.progress.toLocaleString()} / {c.goal.toLocaleString()} · +{c.rewardHits} Hits
                when complete
              </p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
