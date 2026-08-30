import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { LuckMeter } from "@/components/luck/LuckMeter";
import { GlitterDropClaim } from "@/components/luck/GlitterDropClaim";
import { QuestList } from "@/components/luck/QuestList";
import { getLuckStatus, listRecentRewardEvents } from "@/lib/luck/engine";
import { getPendingDrop } from "@/lib/luck/drops";
import { listUserQuests } from "@/lib/luck/quests";
import { listActiveChallenges } from "@/lib/luck/challenges";
import { formatCredits } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { grantDailyLoginSpin } from "@/lib/luck/wheel";
import { getEarnMembershipProgress } from "@/lib/membership/earn";
import { EarnMembershipCard } from "@/components/membership/EarnMembershipCard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await grantDailyLoginSpin(session.user.id);

  const [status, pendingDrop, events, quests, challenges, user, earnProgress] =
    await Promise.all([
      getLuckStatus(session.user.id),
      getPendingDrop(session.user.id),
      listRecentRewardEvents(session.user.id, 10),
      listUserQuests(session.user.id),
      listActiveChallenges(),
      prisma.user.findUniqueOrThrow({
        where: { id: session.user.id },
        include: { persona: true },
      }),
      getEarnMembershipProgress(session.user.id),
    ]);

  const levels = await prisma.luckLevelDefinition.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const levelNumber = Math.max(
    1,
    levels.findIndex((l) => l.slug === status.level?.slug) + 1,
  );

  const missions = [
    { href: "/surf", title: "Surf toward Pro", reward: "Earn Plus membership" },
    { href: "/surf", title: "Surf 10 pages", reward: "+Hits · +Luck" },
    {
      href: "/luck/quests",
      title: "Complete a quest",
      reward: "Claim ready rewards",
    },
    { href: "/websites/new", title: "Promote a website", reward: "+Luck · slots" },
    { href: "/luck/wheel", title: "Spin the Glitter Wheel", reward: `${status.wheelSpins} spins` },
  ];

  const activeQuests = quests.filter((q) => q.status !== "claimed").slice(0, 5);
  const challenge = challenges.find((c) => c.status === "active") ?? challenges[0];

  return (
    <AppShell
      title={`${user.persona?.icon || "✨"} ${user.name || "Discoverer"}`}
      subtitle={status.mantra}
    >
      <GlitterDropClaim drop={pendingDrop} />

      <div className="mb-6">
        <EarnMembershipCard
          membership={earnProgress.membership}
          membershipExpiresAt={earnProgress.membershipExpiresAt}
          membershipSource={earnProgress.membershipSource}
          milestones={earnProgress.milestones}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <LuckMeter
          levelName={status.level?.name || "Spark"}
          levelIcon={status.level?.icon || "✨"}
          levelNumber={levelNumber}
          progressPct={status.progressPct}
          luckPoints={status.luckPoints}
        />
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Hits", value: formatCredits(status.hits) },
            { label: "Streak", value: `🔥 ${status.streakDays}d` },
            { label: "Spins", value: String(status.wheelSpins) },
            { label: "Tokens", value: String(status.questTokens) },
          ].map((card) => (
            <div key={card.label} className="gh-glass p-4">
              <p className="text-xs text-[var(--text-muted)]">{card.label}</p>
              <p className="mt-1 font-[family-name:var(--font-syne)] text-xl font-bold">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {status.boostExpiresAt && status.boostExpiresAt > new Date() ? (
        <p className="mb-4 rounded-xl border border-[var(--neon-gold)]/30 bg-[var(--neon-gold)]/10 px-4 py-3 text-sm">
          ⚡ Boost active · {status.boostMultiplier}% surf credits until{" "}
          {status.boostExpiresAt.toISOString().slice(11, 16)} UTC
        </p>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 font-[family-name:var(--font-syne)] text-lg font-semibold">
          🎯 Today&apos;s Missions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {missions.map((m) => (
            <Link key={m.href} href={m.href} className="gh-glass block p-4 transition hover:bg-[var(--bg-glass)]">
              <p className="font-medium">{m.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{m.reward}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
              ✨ Glitter Quests
            </h2>
            <Link href="/luck/quests" className="text-sm text-[var(--neon-cyan)]">
              All →
            </Link>
          </div>
          <QuestList quests={activeQuests} />
        </section>

        <section className="space-y-4">
          {challenge ? (
            <div className="gh-glass p-5">
              <p className="gh-badge">Community</p>
              <h3 className="mt-2 font-[family-name:var(--font-syne)] text-lg font-semibold">
                {challenge.icon} {challenge.name}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{challenge.description}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-glass)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-pink)]"
                  style={{
                    width: `${Math.min(100, Math.floor((challenge.progress / Math.max(1, challenge.goal)) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {challenge.progress.toLocaleString()} / {challenge.goal.toLocaleString()} · reward{" "}
                {challenge.rewardHits} Hits
              </p>
              <Link href="/luck/challenges" className="mt-3 inline-block text-sm text-[var(--neon-cyan)]">
                View challenges →
              </Link>
            </div>
          ) : null}

          <div className="gh-glass p-5">
            <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
              ✨ Glitter Activity
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {events.length === 0 && (
                <li className="text-[var(--text-muted)]">Surf to spark your first rewards.</li>
              )}
              {events.map((e) => (
                <li key={e.id} className="border-b border-[var(--border-glass)] pb-2">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{e.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/surf" className="gh-btn gh-btn-primary text-sm">
          Surf
        </Link>
        <Link href="/luck/wheel" className="gh-btn gh-btn-ghost text-sm">
          Wheel
        </Link>
        <Link href="/luck/royalty" className="gh-btn gh-btn-ghost text-sm">
          Royalty
        </Link>
        <Link href="/luck/personas" className="gh-btn gh-btn-ghost text-sm">
          Personas
        </Link>
        <Link href="/mail" className="gh-btn gh-btn-ghost text-sm">
          Glitter Mail
        </Link>
      </div>
    </AppShell>
  );
}
