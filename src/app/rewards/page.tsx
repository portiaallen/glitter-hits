import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const [levels, achievements] = await Promise.all([
    prisma.levelDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.achievementDefinition.findMany({ where: { isActive: true } }),
  ]);

  return (
    <div>
      <PageHero
        title="Levels, achievements, streaks"
        description="Gamification that rewards real discovery — every credit reward is admin-configurable."
        eyebrow="Rewards"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <section className="mb-12">
          <h2 className="mb-4 font-[family-name:var(--font-syne)] text-2xl font-bold">Levels</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((l) => (
              <div key={l.id} className="gh-glass p-5">
                <p className="gh-badge">{l.minPoints}+ pts</p>
                <h3 className="mt-3 font-[family-name:var(--font-syne)] text-lg font-semibold">
                  {l.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{l.description}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 font-[family-name:var(--font-syne)] text-2xl font-bold">
            Achievements
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {achievements.map((a) => (
              <div key={a.id} className="gh-glass p-5">
                <h3 className="font-semibold">{a.name}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{a.description}</p>
                <p className="mt-3 text-xs text-white/45">
                  +{a.creditReward} Hits · +{a.pointsReward} pts
                </p>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-10">
          <Link href="/signup" className="gh-btn gh-btn-primary">
            Start earning
          </Link>
        </div>
      </div>
    </div>
  );
}
