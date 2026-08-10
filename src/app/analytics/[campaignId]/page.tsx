import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { getCampaignAnalytics } from "@/lib/analytics/service";
import { formatCredits } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";

export const metadata: Metadata = { title: "Campaign analytics" };

export default async function CampaignAnalyticsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { campaignId } = await params;

  let data;
  try {
    data = await getCampaignAnalytics(campaignId, session.user.id);
  } catch {
    redirect("/analytics");
  }

  return (
    <AppShell
      title={data.campaign.name}
      subtitle={data.transparencyNote}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total visits", value: String(data.totals.total) },
          { label: "Today", value: String(data.totals.today) },
          { label: "This week", value: String(data.totals.week) },
          { label: "Credits spent", value: formatCredits(data.totals.creditsSpent) },
        ].map((c) => (
          <div key={c.label} className="gh-glass p-5">
            <p className="text-sm text-[var(--text-muted)]">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Avg duration {data.totals.avgDuration}s · Month {data.totals.month} visits
      </p>
      <AnalyticsCharts
        deviceBreakdown={data.deviceBreakdown}
        countryBreakdown={data.countryBreakdown}
        qualityBreakdown={data.qualityBreakdown}
      />
    </AppShell>
  );
}
