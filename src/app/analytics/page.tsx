import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id, status: { not: "deleted" } },
    include: { website: true },
    orderBy: { visitsDelivered: "desc" },
  });

  return (
    <AppShell
      title="Analytics"
      subtitle="Honest exchange metrics — visits labeled as Glitter Hits traffic."
    >
      <div className="space-y-3">
        {campaigns.map((c) => (
          <Link
            key={c.id}
            href={`/analytics/${c.id}`}
            className="gh-glass block p-5 transition hover:border-pink-400/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{c.name}</h2>
                <p className="text-sm text-[var(--text-muted)]">{c.website.title}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="gh-badge">{c.visitsDelivered} visits</span>
                <span className="gh-badge">{c.creditsSpent} spent</span>
              </div>
            </div>
          </Link>
        ))}
        {campaigns.length === 0 && (
          <p className="text-[var(--text-muted)]">Create a campaign to see analytics.</p>
        )}
      </div>
    </AppShell>
  );
}
