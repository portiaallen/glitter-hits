import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { CampaignActions } from "@/components/campaigns/CampaignActions";
import { formatCredits } from "@/lib/utils";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id, status: { not: "deleted" } },
    include: { website: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppShell title="Campaigns" subtitle="Allocate Glitter Hits, target audiences, and control delivery.">
      <div className="mb-4">
        <Link href="/campaigns/new" className="gh-btn gh-btn-primary">
          Create Campaign
        </Link>
      </div>
      <div className="space-y-3">
        {campaigns.length === 0 && (
          <p className="text-[var(--text-muted)]">No campaigns yet.</p>
        )}
        {campaigns.map((c) => (
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
        ))}
      </div>
    </AppShell>
  );
}
