import { getAdminNetworkAnalytics } from "@/lib/analytics/service";
import { prisma } from "@/lib/db";
import { formatCredits } from "@/lib/utils";

export default async function AdminAnalyticsPage() {
  const [analytics, qualityGroups, recentVisits] = await Promise.all([
    getAdminNetworkAnalytics(),
    prisma.visit.groupBy({
      by: ["quality"],
      _count: { _all: true },
    }),
    prisma.visit.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      select: {
        id: true,
        quality: true,
        sourceLabel: true,
        completed: true,
        creditsCharged: true,
        creditsEarned: true,
        startedAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Users", value: analytics.users },
          { label: "Active campaigns", value: analytics.activeCampaigns },
          { label: "Visits today", value: analytics.visitsToday },
          {
            label: "Credits circulating",
            value: formatCredits(analytics.creditsInCirculation),
          },
        ].map((c) => (
          <div key={c.label} className="gh-glass p-4">
            <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
            <p className="mt-2 text-xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="gh-glass p-5">
        <h2 className="font-semibold">Traffic quality (all time)</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Honest labels only — never spoofed organic/search/social.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {qualityGroups.map((g) => (
            <li key={g.quality} className="flex justify-between">
              <span>{g.quality}</span>
              <span>{g._count._all}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="gh-glass p-5">
        <h2 className="font-semibold">Recent visits</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {recentVisits.map((v) => (
            <li key={v.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-2">
              <span>
                {v.quality} · {v.sourceLabel} · {v.completed ? "completed" : "open"}
              </span>
              <span className="text-[var(--text-muted)]">
                charged {v.creditsCharged} / earned {v.creditsEarned}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
