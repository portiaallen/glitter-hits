import { getLuckEngineConfig } from "@/lib/luck/config";
import { prisma } from "@/lib/db";
import { LuckEngineAdminForm } from "@/components/admin/LuckEngineAdminForm";

export default async function AdminLuckPage() {
  const [config, levels, quests, segments, milestones] = await Promise.all([
    getLuckEngineConfig(),
    prisma.luckLevelDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.questDefinition.findMany({ orderBy: { sortOrder: "asc" }, take: 30 }),
    prisma.wheelSegment.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.streakMilestone.findMany({ orderBy: { days: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
          Glitter Luck Engine
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Configure drops, jackpot, wheel, and luck weights without code changes.
        </p>
      </div>

      <LuckEngineAdminForm config={config} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="gh-glass p-5">
          <h3 className="font-semibold">Luck levels ({levels.length})</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {levels.map((l) => (
              <li key={l.id}>
                {l.icon} {l.name} · {l.minLuck}+
              </li>
            ))}
          </ul>
        </section>
        <section className="gh-glass p-5">
          <h3 className="font-semibold">Quests ({quests.length})</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {quests.map((q) => (
              <li key={q.id}>
                {q.icon} {q.name} · {q.isActive ? "active" : "off"}
              </li>
            ))}
          </ul>
        </section>
        <section className="gh-glass p-5">
          <h3 className="font-semibold">Wheel segments ({segments.length})</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {segments.map((s) => (
              <li key={s.id}>
                {s.label} · w{s.weight}
              </li>
            ))}
          </ul>
        </section>
        <section className="gh-glass p-5">
          <h3 className="font-semibold">Streak milestones ({milestones.length})</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {milestones.map((m) => (
              <li key={m.id}>
                {m.days}d · {m.name}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
