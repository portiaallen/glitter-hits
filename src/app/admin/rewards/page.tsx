import { prisma } from "@/lib/db";

export default async function AdminRewardsPage() {
  const [levels, achievements] = await Promise.all([
    prisma.levelDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.achievementDefinition.findMany(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="gh-glass p-5">
        <h2 className="font-semibold">Levels</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {levels.map((l) => (
            <li key={l.id} className="flex justify-between gap-3">
              <span>{l.name}</span>
              <span className="text-[var(--text-muted)]">{l.minPoints}+ pts</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="gh-glass p-5">
        <h2 className="font-semibold">Achievements</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {achievements.map((a) => (
            <li key={a.id}>
              <p className="font-medium">{a.name}</p>
              <p className="text-[var(--text-muted)]">
                {a.description} · +{a.creditReward} Hits
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
