import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { getLeaderboards } from "@/lib/rewards/launch";
import { formatCredits } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaderboards" };

export default async function LeaderboardsPage() {
  const boards = await getLeaderboards();

  return (
    <div>
      <PageHero
        title="Network leaderboards"
        description="Top discoverers, promoters, streaks, referrals, and trending sites — based on real Glitter Hits activity."
        eyebrow="Leaderboards"
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <Board title="Top Discoverers" rows={boards.discoverers.map((u, i) => ({
          rank: i + 1,
          name: u.name || "Anonymous",
          meta: `${u.levelSlug} · streak ${u.streakDays}d`,
          value: `${formatCredits(u.lifetimeEarned)} earned`,
        }))} />
        <Board title="Top Promoters" rows={boards.promoters.map((u, i) => ({
          rank: i + 1,
          name: u.name || "Anonymous",
          meta: u.levelSlug,
          value: `${formatCredits(u.lifetimeSpent)} spent`,
        }))} />
        <Board title="Most Active" rows={boards.active.map((u, i) => ({
          rank: i + 1,
          name: u.name || "Anonymous",
          meta: u.levelSlug,
          value: `${u.streakDays}d streak · ${u.levelPoints} pts`,
        }))} />
        <Board title="Most Referred" rows={boards.referred.map((u, i) => ({
          rank: i + 1,
          name: u.name || "Anonymous",
          meta: u.levelSlug || "",
          value: `${u.referrals || 0} referrals`,
        }))} />
        <div className="lg:col-span-2">
          <Board title="Trending Sites" rows={boards.trending.map((s, i) => ({
            rank: i + 1,
            name: s.title,
            meta: s.url,
            value: `${s.discoverCount} discovers`,
          }))} />
        </div>
      </div>
    </div>
  );
}

function Board({
  title,
  rows,
}: {
  title: string;
  rows: { rank: number; name: string; meta: string; value: string }[];
}) {
  return (
    <section className="gh-glass p-5">
      <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {rows.length === 0 && (
          <li className="text-sm text-[var(--text-muted)]">No data yet.</li>
        )}
        {rows.map((row) => (
          <li key={`${title}-${row.rank}-${row.name}`} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">
                <span className="mr-2 text-white/40">#{row.rank}</span>
                {row.name}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{row.meta}</p>
            </div>
            <span className="shrink-0 text-[var(--neon-cyan)]">{row.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
