import type { Metadata } from "next";
import Link from "next/link";
import { getAdminNetworkAnalytics } from "@/lib/analytics/service";
import { getEconomySettings } from "@/lib/settings/economy";
import { formatCredits } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const [analytics, economy] = await Promise.all([
    getAdminNetworkAnalytics(),
    getEconomySettings(),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Users", value: String(analytics.users) },
          { label: "Active campaigns", value: String(analytics.activeCampaigns) },
          { label: "Visits today", value: String(analytics.visitsToday) },
          {
            label: "Credits in circulation",
            value: formatCredits(analytics.creditsInCirculation),
          },
          { label: "Pending sites", value: String(analytics.pendingSites) },
        ].map((c) => (
          <div key={c.label} className="gh-glass p-4">
            <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
            <p className="mt-2 text-xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="gh-glass p-5">
        <h2 className="font-semibold">Economy snapshot</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Surf earn {economy.creditsPerCompletedSurf} · Visit charge{" "}
          {economy.creditsChargedPerVisit} · Signup bonus {economy.signupBonusCredits} ·
          Default duration {economy.defaultVisitDurationSec}s
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/moderation" className="gh-btn gh-btn-primary text-sm">
            Moderation queue
          </Link>
          <Link href="/admin/settings" className="gh-btn gh-btn-ghost text-sm">
            Economy settings
          </Link>
          <Link href="/admin/brands" className="gh-btn gh-btn-ghost text-sm">
            Brand directory
          </Link>
        </div>
      </div>
    </div>
  );
}
