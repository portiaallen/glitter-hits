import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { CampaignActions } from "@/components/campaigns/CampaignActions";
import { formatCredits } from "@/lib/utils";
import { getEconomySettings } from "@/lib/settings/economy";
import { estimateNetworkAvailability } from "@/lib/delivery/engine";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [campaigns, economy, network] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId: session.user.id, status: { not: "deleted" } },
      include: { website: true },
      orderBy: { updatedAt: "desc" },
    }),
    getEconomySettings(),
    estimateNetworkAvailability(),
  ]);
  const charge = Math.max(1, economy.creditsChargedPerVisit);

  return (
    <AppShell title="Campaigns" subtitle="Allocate Glitter Hits, target audiences, and control delivery.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/campaigns/new" className="gh-btn gh-btn-primary">
          Create Campaign
        </Link>
        <p className="text-xs text-[var(--text-muted)]">{network.note}</p>
      </div>
      <div className="space-y-3">
        {campaigns.length === 0 && (
          <p className="text-[var(--text-muted)]">No campaigns yet.</p>
        )}
        {campaigns.map((c) => {
          const hitsRemaining = Math.floor(c.creditBalance / charge);
          const share =
            c.priority === "premium"
              ? 0.5
              : c.priority === "featured"
                ? 0.35
                : c.priority === "boosted"
                  ? 0.25
                  : 0.15;
          const estimatedDaily = Math.min(
            hitsRemaining,
            Math.max(0, Math.floor(network.estimatedVisitsPerDay * share)),
          );
          return (
            <div key={c.id} className="gh-glass p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{c.name}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{c.website.title}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="gh-badge">{c.status}</span>
                    <span className="gh-badge">{c.priority}</span>
                    <span className="gh-badge">{c.visitDurationSec}s</span>
                    <span className="gh-badge">{formatCredits(c.creditBalance)} credits</span>
                    <span className="gh-badge">{hitsRemaining} hits left</span>
                    <span className="gh-badge">~{estimatedDaily}/day est.</span>
                    <span className="gh-badge">{c.visitsDelivered} visits</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/analytics/${c.id}`}
                    className="text-sm text-[var(--neon-cyan)]"
                  >
                    Analytics →
                  </Link>
                  <CampaignActions campaignId={c.id} status={c.status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
