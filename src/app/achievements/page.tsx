import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [defs, earned] = await Promise.all([
    prisma.achievementDefinition.findMany({ where: { isActive: true } }),
    prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      include: { achievement: true },
    }),
  ]);
  const earnedIds = new Set(earned.map((e) => e.achievementId));

  return (
    <AppShell title="Achievements" subtitle="Unlock credits and level points through real discovery.">
      <div className="grid gap-3 sm:grid-cols-2">
        {defs.map((def) => {
          const got = earnedIds.has(def.id);
          return (
            <div
              key={def.id}
              className={`gh-glass p-5 ${got ? "border-pink-400/40" : "opacity-80"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{def.name}</h2>
                <span className="gh-badge">{got ? "Unlocked" : "Locked"}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{def.description}</p>
              <p className="mt-3 text-xs text-white/45">
                +{def.creditReward} Hits · +{def.pointsReward} pts
              </p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
