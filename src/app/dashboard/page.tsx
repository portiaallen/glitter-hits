import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { getUserOverviewStats } from "@/lib/analytics/service";
import { formatCredits } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getUserOverviewStats(session.user.id);

  return (
    <AppShell
      title={`Hey, ${stats.user.name || "Discoverer"}`}
      subtitle="Your Glitter Hits overview — earn by surfing, spend by promoting."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Balance", value: formatCredits(stats.user.creditBalance) },
          { label: "Earned today", value: formatCredits(stats.earnedToday) },
          { label: "Visits delivered today", value: String(stats.deliveredToday) },
          { label: "Active campaigns", value: String(stats.activeCampaigns) },
        ].map((card) => (
          <div key={card.label} className="gh-glass p-5">
            <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
            <p className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className="gh-glass p-5">
          <p className="gh-badge">Level</p>
          <p className="mt-3 text-xl font-semibold">{stats.level?.name || stats.user.levelSlug}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {stats.user.levelPoints} points · streak {stats.user.streakDays}d
          </p>
        </div>
        <div className="gh-glass p-5 lg:col-span-2">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/websites/new" className="gh-btn gh-btn-ghost text-sm">
              Add Website
            </Link>
            <Link href="/surf" className="gh-btn gh-btn-primary text-sm">
              Start Surfing
            </Link>
            <Link href="/campaigns/new" className="gh-btn gh-btn-ghost text-sm">
              Create Campaign
            </Link>
            <Link href="/browse" className="gh-btn gh-btn-ghost text-sm">
              Browse Sites
            </Link>
            <Link href="/invite" className="gh-btn gh-btn-ghost text-sm">
              Invite Friends
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="gh-glass p-5">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Recent credit activity
          </h2>
          <ul className="mt-4 space-y-3">
            {stats.recentLedger.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">No movements yet.</li>
            )}
            {stats.recentLedger.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p>{entry.description}</p>
                  <p className="text-xs text-white/40">{entry.type}</p>
                </div>
                <span className={entry.amount >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                  {entry.amount >= 0 ? "+" : ""}
                  {formatCredits(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="gh-glass p-5">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Achievements
          </h2>
          <ul className="mt-4 space-y-3">
            {stats.achievements.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">
                Surf your first site to unlock achievements.
              </li>
            )}
            {stats.achievements.map((a) => (
              <li key={a.id} className="text-sm">
                <p className="font-medium">{a.achievement.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{a.achievement.description}</p>
              </li>
            ))}
          </ul>
          <Link href="/achievements" className="mt-4 inline-block text-sm text-[var(--neon-cyan)]">
            View all →
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
