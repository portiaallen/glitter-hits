import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";
import { WebsiteCard } from "@/components/sites/WebsiteCard";

export const metadata: Metadata = {
  title: "Trending",
  description: "Approved Glitter Hits sites ranked by discover count.",
};

export default async function TrendingPage() {
  const websites = await prisma.website.findMany({
    where: { moderationStatus: "approved" },
    include: { category: true },
    orderBy: [{ discoverCount: "desc" }, { updatedAt: "desc" }],
    take: 40,
  });

  return (
    <div>
      <PageHero
        title="What’s catching fire."
        description="Approved sites ordered by discover count — organic interest from real surf sessions, not manufactured vanity."
        eyebrow="Trending"
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {websites.length === 0 ? (
          <p className="gh-glass p-8 text-center text-[var(--text-muted)]">
            No trending sites yet — be the first to earn discovers.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((site, i) => (
              <WebsiteCard
                key={site.id}
                title={site.title}
                url={site.url}
                description={site.description}
                categoryName={site.category?.name}
                categorySlug={site.category?.slug}
                discoverCount={site.discoverCount}
                badges={[`#${i + 1}`, ...(site.isTrending ? ["Hot"] : [])]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
