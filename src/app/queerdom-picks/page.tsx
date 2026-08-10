import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";
import { WebsiteCard } from "@/components/sites/WebsiteCard";

export const metadata: Metadata = {
  title: "Queerdom Picks",
  description: "Curated Queerdom Pick websites on Glitter Hits.",
};

export default async function QueerdomPicksPage() {
  const websites = await prisma.website.findMany({
    where: { moderationStatus: "approved", isQueerdomPick: true },
    include: { category: true },
    orderBy: [{ discoverCount: "desc" }, { title: "asc" }],
  });

  return (
    <div>
      <PageHero
        title="Hand-picked for the Queerdom."
        description="Admin-curated sites that celebrate queer creators, culture, and community — still exchange-labeled, still fair."
        eyebrow="Queerdom Picks"
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {websites.length === 0 ? (
          <div className="gh-glass p-8 text-center">
            <p className="text-[var(--text-muted)]">Picks are being curated.</p>
            <Link href="/browse" className="gh-btn gh-btn-ghost mt-6 inline-flex">
              Browse the directory
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((site) => (
              <WebsiteCard
                key={site.id}
                title={site.title}
                url={site.url}
                description={site.description}
                categoryName={site.category?.name}
                categorySlug={site.category?.slug}
                discoverCount={site.discoverCount}
                badges={["Queerdom Pick"]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
