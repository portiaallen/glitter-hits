import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { getMembershipEntitlements } from "@/lib/membership/entitlements";

export const metadata: Metadata = { title: "My Websites" };

export default async function WebsitesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [websites, entitlements] = await Promise.all([
    prisma.website.findMany({
      where: { userId: session.user.id },
      include: { category: true, campaigns: true },
      orderBy: { createdAt: "desc" },
    }),
    getMembershipEntitlements(session.user.id),
  ]);

  const slotsFull = entitlements.websitesRemaining <= 0;

  return (
    <AppShell
      title="My Websites"
      subtitle={`Submit sites, track moderation, and launch campaigns. Slots ${entitlements.websitesUsed}/${entitlements.websiteSlots} (${entitlements.membership}).`}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {slotsFull ? (
          <Link href="/store" className="gh-btn gh-btn-primary">
            Upgrade for more slots
          </Link>
        ) : (
          <Link href="/websites/new" className="gh-btn gh-btn-primary">
            Add Website
          </Link>
        )}
        <Link href="/promote" className="gh-btn gh-btn-ghost">
          Promote a site
        </Link>
      </div>
      <div className="space-y-3">
        {websites.length === 0 && (
          <p className="text-[var(--text-muted)]">No websites yet.</p>
        )}
        {websites.map((site) => (
          <div key={site.id} className="gh-glass p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{site.title}</h2>
                <a
                  href={site.url}
                  className="text-sm text-[var(--neon-cyan)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {site.url}
                </a>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{site.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="gh-badge">{site.moderationStatus}</span>
                {site.isFeatured ? <span className="gh-badge">Featured</span> : null}
                {site.category && <span className="gh-badge">{site.category.name}</span>}
                <span className="gh-badge">{site.campaigns.length} campaigns</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
